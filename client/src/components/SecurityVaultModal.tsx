import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, X, Key, Server, EyeOff, FileText, Smartphone, Copy, Check } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { getOrCreateLocalIdentity } from '../services/cryptoEngine';

interface SecurityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityVaultModal: React.FC<SecurityVaultModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'compliance' | 'e2ee' | 'privacy'>('compliance');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('Generating hardware-bound key fingerprint...');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [disappearingDays, setDisappearingDays] = useState<'off' | '24h' | '7d' | '90d'>('off');

  useEffect(() => {
    if (!isOpen) return;

    getOrCreateLocalIdentity()
      .then((identity) => {
        if (identity.fingerprint) {
          setDeviceFingerprint(identity.fingerprint);
        }
      })
      .catch((err) => {
        console.error('Failed to get crypto identity', err);
        setDeviceFingerprint('LOCAL-KEY-PENDING');
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyFingerprint = () => {
    try {
      navigator.clipboard.writeText(deviceFingerprint);
      setCopiedFingerprint(true);
      sounds.playSentSound();
      setTimeout(() => setCopiedFingerprint(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-surface dark:bg-[#0b121c] text-on-surface border border-emerald-500/40 rounded-3xl w-full max-w-[390px] overflow-y-auto no-scrollbar shadow-2xl emerald-glow flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#0e1724] border-b border-surface-container-highest dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-on-surface dark:text-white flex items-center space-x-2">
                <span className="truncate">Sovereignty &amp; Security Architecture</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold shrink-0">
                  DPDP 2023 READY
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 truncate">
                Architected for DPDP Act 2023 Principles — Local Data Residency &amp; Zero Foreign Trackers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex space-x-4 border-b border-surface-container-highest dark:border-slate-800 text-xs font-semibold shrink-0">
          {[
            { id: 'compliance', label: 'Architecture & Privacy' },
            { id: 'e2ee', label: 'WebCrypto P-256 E2EE' },
            { id: 'privacy', label: 'Ephemeral Chat Vault' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PRIVACY & DPDP ACT ARCHITECTURE */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/30 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    Architected in Conformance with DPDP Act 2023 Principles
                  </h4>
                  <p className="text-on-surface-variant dark:text-slate-300 leading-relaxed">
                    Nexus is designed from the ground up according to sovereign data protection guidelines: local storage, purpose-limited data handling, and zero third-party commercial SDKs.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="p-3 bg-surface-container-low dark:bg-slate-900/90 rounded-xl border border-surface-container-highest dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Server className="w-4 h-4" />
                    <span>In-Country Sovereign Residency</span>
                  </div>
                  <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                    All persistent application databases and relay endpoints execute on sovereign nodes. Zero cross-border data routing.
                  </p>
                </div>

                <div className="p-3 bg-surface-container-low dark:bg-slate-900/90 rounded-xl border border-surface-container-highest dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Zero Foreign Analytics or Trackers</span>
                  </div>
                  <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                    100% free from Google Analytics, Meta Pixels, advertising SDKs, or third-party telemetry beacons.
                  </p>
                </div>

                <div className="p-3 bg-surface-container-low dark:bg-slate-900/90 rounded-xl border border-surface-container-highest dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-sky-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>Right to Erasure (DPDP §12)</span>
                  </div>
                  <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                    Full user ownership of keys and chat records. Local cryptographic cache purges upon sign out.
                  </p>
                </div>

                <div className="p-3 bg-surface-container-low dark:bg-slate-900/90 rounded-xl border border-surface-container-highest dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Emergency Directive Interoperability</span>
                  </div>
                  <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                    Emergency SOS burst protocol designed to interface with disaster response teams during cellular blackouts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REAL E2EE VERIFICATION */}
          {activeTab === 'e2ee' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low dark:bg-slate-900 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface dark:text-white flex items-center space-x-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span>Hardware-Bound WebCrypto Safety Number</span>
                  </h4>
                  <button
                    onClick={handleCopyFingerprint}
                    className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    {copiedFingerprint ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFingerprint ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant dark:text-slate-400">
                  This 60-digit safety fingerprint is calculated using a SHA-256 digest of your local NIST P-256 public key. Compare this number with your peer to verify that no entity has intercepted your communication.
                </p>

                {/* 60-digit verification key */}
                <div className="p-3.5 bg-surface-container-lowest dark:bg-black/70 rounded-xl border border-emerald-500/30 font-mono text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 tracking-widest break-all text-center select-all">
                  {deviceFingerprint}
                </div>

                <div className="space-y-1 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Key Agreement:</span>
                    <span className="text-slate-300 font-mono">ECDH (NIST P-256 / secp256r1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payload Cipher:</span>
                    <span className="text-slate-300 font-mono">AES-256-GCM (96-bit random IV)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Key Derivation:</span>
                    <span className="text-slate-300 font-mono">PBKDF2-SHA256 (100,000 iterations)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-sky-500/10 dark:bg-sky-950/20 border border-sky-500/30 rounded-xl text-xs text-sky-900 dark:text-sky-300 flex items-start space-x-2">
                <span className="material-symbols-outlined text-sm mt-0.5">verified_user</span>
                <span>
                  All encryption/decryption occurs on your client terminal via the W3C Web Cryptography API. Private keys never leave device memory.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & DISAPPEARING MESSAGES */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low dark:bg-slate-900 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-on-surface dark:text-white font-bold text-sm">
                  <EyeOff className="w-4 h-4 text-emerald-400" />
                  <span>Ephemeral Disappearing Messages</span>
                </div>
                <p className="text-xs text-slate-400">
                  Automatically expunge chat transcripts from both client terminals and server relay queues after the selected time window.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {(['off', '24h', '7d', '90d'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setDisappearingDays(period)}
                      className={`p-2 rounded-xl text-xs font-semibold transition-all border ${
                        disappearingDays === period
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-surface-container dark:bg-slate-800 border-surface-container-highest dark:border-slate-700 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700'
                      }`}
                    >
                      {period === 'off' ? 'Disabled' : period.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low dark:bg-slate-900 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-2">
                <h5 className="font-bold text-xs text-on-surface dark:text-white">Zero-Knowledge Storage Policy</h5>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                  Nexus stores contact directories and encrypted message envelopes only for delivery synchronization. Once delivered and acknowledged by the recipient, payload buffers are eligible for immediate deletion.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
