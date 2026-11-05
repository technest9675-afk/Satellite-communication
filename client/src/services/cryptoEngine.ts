/**
 * NEXUS Sovereign Cryptographic Engine
 * Zero-dependency client-side End-to-End Encryption (E2EE) powered by Web Crypto API.
 * Standards:
 * - Key Exchange: ECDH using NIST P-256 (secp256r1)
 * - Symmetric Encryption: AES-256-GCM with 96-bit cryptographically random IVs
 * - Safety Fingerprint: SHA-256 digest of lexicographically sorted public keys (60 digits)
 */

export interface EncryptedEnvelope {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes)
  senderPublicKey: string; // JWK string
  mode: 'P256-AES-GCM';
}

export interface E2EEIdentity {
  publicKeyJwk: string;
  fingerprint: string;
}

const STORAGE_KEY = 'nexus_e2ee_identity_v1';
let cachedKeyPair: CryptoKeyPair | null = null;
let cachedPublicJwk: string | null = null;
const derivedKeyCache = new Map<string, CryptoKey>();

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Initializes or restores local device ECDH P-256 keypair.
 */
export async function getOrCreateLocalIdentity(): Promise<E2EEIdentity> {
  if (cachedKeyPair && cachedPublicJwk) {
    const fp = await computeSingleFingerprint(cachedPublicJwk);
    return { publicKeyJwk: cachedPublicJwk, fingerprint: fp };
  }

  const subtle = window.crypto?.subtle;
  if (!subtle) {
    console.warn('[CryptoEngine] Web Crypto Subtle API not available in this context');
    return { publicKeyJwk: '', fingerprint: 'WEB-CRYPTO-UNAVAILABLE' };
  }

  // Check saved identity in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.privateKeyJwk && parsed.publicKeyJwk) {
        const privateKey = await subtle.importKey(
          'jwk',
          parsed.privateKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );
        const publicKey = await subtle.importKey(
          'jwk',
          parsed.publicKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );

        cachedKeyPair = { publicKey, privateKey };
        cachedPublicJwk = JSON.stringify(parsed.publicKeyJwk);
        const fp = await computeSingleFingerprint(cachedPublicJwk);
        return { publicKeyJwk: cachedPublicJwk, fingerprint: fp };
      }
    }
  } catch (err) {
    console.warn('[CryptoEngine] Failed to restore saved identity, generating new keypair', err);
  }

  // Generate new P-256 ECDH Keypair
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const pubJwk = await subtle.exportKey('jwk', keyPair.publicKey);
  const privJwk = await subtle.exportKey('jwk', keyPair.privateKey);

  cachedKeyPair = keyPair;
  cachedPublicJwk = JSON.stringify(pubJwk);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      publicKeyJwk: pubJwk,
      privateKeyJwk: privJwk,
      createdAt: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('[CryptoEngine] Unable to persist identity in localStorage', e);
  }

  const fp = await computeSingleFingerprint(cachedPublicJwk);
  return { publicKeyJwk: cachedPublicJwk, fingerprint: fp };
}

/**
 * Derives a shared AES-256-GCM key with a peer using their public key JWK.
 */
export async function deriveSharedKeyWithPeer(peerPublicKeyJwkStr: string): Promise<CryptoKey | null> {
  if (!cachedKeyPair) {
    await getOrCreateLocalIdentity();
  }
  if (!cachedKeyPair || !window.crypto?.subtle) return null;

  if (derivedKeyCache.has(peerPublicKeyJwkStr)) {
    return derivedKeyCache.get(peerPublicKeyJwkStr)!;
  }

  try {
    const peerJwk = typeof peerPublicKeyJwkStr === 'string'
      ? JSON.parse(peerPublicKeyJwkStr)
      : peerPublicKeyJwkStr;

    const peerKey = await window.crypto.subtle.importKey(
      'jwk',
      peerJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: peerKey },
      cachedKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    derivedKeyCache.set(peerPublicKeyJwkStr, sharedKey);
    return sharedKey;
  } catch (err) {
    console.error('[CryptoEngine] Failed to derive shared key with peer', err);
    return null;
  }
}

/**
 * Encrypts a message using AES-256-GCM.
 * If peerPublicKeyJwkStr is provided, it uses the peer's ECDH shared key.
 * Otherwise, it encrypts using a locally derived key (e.g. self-note/backup).
 */
export async function encryptMessagePayload(
  plaintext: string,
  peerPublicKeyJwkStr?: string
): Promise<EncryptedEnvelope | null> {
  const subtle = window.crypto?.subtle;
  if (!subtle) return null;

  try {
    const identity = await getOrCreateLocalIdentity();
    const targetKeyStr = peerPublicKeyJwkStr || identity.publicKeyJwk;
    const sharedKey = await deriveSharedKeyWithPeer(targetKeyStr);
    if (!sharedKey) return null;

    // 12-byte random IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const ciphertextBuffer = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      data
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv),
      senderPublicKey: identity.publicKeyJwk,
      mode: 'P256-AES-GCM'
    };
  } catch (err) {
    console.error('[CryptoEngine] Encryption failed', err);
    return null;
  }
}

/**
 * Decrypts an EncryptedEnvelope into a plaintext string.
 */
export async function decryptMessagePayload(envelope: EncryptedEnvelope): Promise<string | null> {
  const subtle = window.crypto?.subtle;
  if (!subtle || !envelope || !envelope.ciphertext || !envelope.iv) return null;

  try {
    const sharedKey = await deriveSharedKeyWithPeer(envelope.senderPublicKey);
    if (!sharedKey) return null;

    const iv = new Uint8Array(base64ToArrayBuffer(envelope.iv));
    const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('[CryptoEngine] Decryption failed', err);
    return null;
  }
}

/**
 * Computes a standardized 60-digit safety number (12 blocks of 5 digits) from two public keys.
 * Matches Signal-style safety numbers by hashing sorted public keys with SHA-256.
 */
export async function computeSafetyNumber(jwkA: string, jwkB: string): Promise<string> {
  const subtle = window.crypto?.subtle;
  if (!subtle || !jwkA || !jwkB) {
    return '00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000';
  }

  try {
    const sorted = [jwkA.trim(), jwkB.trim()].sort().join('::NEXUS_E2EE_FINGERPRINT::');
    const encoder = new TextEncoder();
    const digest = await subtle.digest('SHA-256', encoder.encode(sorted));
    const bytes = new Uint8Array(digest);

    // Convert SHA-256 32 bytes into 12 decimal blocks (60 digits)
    let digits = '';
    for (let i = 0; i < 12; i++) {
      const offset = (i * 2) % 30;
      const num = ((bytes[offset] << 8) | bytes[offset + 1]) % 100000;
      digits += num.toString().padStart(5, '0');
    }

    return digits.match(/.{1,5}/g)?.join(' ') || digits;
  } catch (err) {
    console.error('[CryptoEngine] Safety number generation failed', err);
    return '00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000';
  }
}

/**
 * Computes a device fingerprint for a single public key.
 */
export async function computeSingleFingerprint(jwk: string): Promise<string> {
  return computeSafetyNumber(jwk, jwk);
}
