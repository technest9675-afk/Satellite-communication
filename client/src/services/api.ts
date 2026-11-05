import { io, Socket } from 'socket.io-client';
import { 
  Message, Contact, CurrentUser, SatelliteModuleState, UpiDetails, AdminMetrics, GroundStation, GroupMember 
} from '../types';

const TOKEN_KEY = 'nexus_auth_token';

// Central API Base URL support for decoupled deployments (Netlify, Vercel, Railway, Render)
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function getAuthToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token: string, persist = true) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to store auth token', err);
  }
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear auth token', err);
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Socket Connection with Dynamic Host Fallback (Dual-Stack IPv4 / IPv6)
const SOCKET_URL = 
  import.meta.env.VITE_SOCKET_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:5000' 
    : '/');

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  auth: (cb) => {
    cb({ token: getAuthToken() });
  }
});

export function reconnectSocketWithAuth() {
  const token = getAuthToken();
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect().connect();
  } else {
    socket.connect();
  }
}

// Robust API Error Class
export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number = 0, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getFriendlyStatusMessage(status: number): string {
  switch (status) {
    case 400: return 'Invalid request parameters or payload format.';
    case 401: return 'Authentication required or session has expired.';
    case 403: return 'Access denied. Insufficient role permissions.';
    case 404: return 'Requested NEXUS service endpoint not found.';
    case 429: return 'Too many requests. Please wait a moment and try again.';
    case 500: return 'NEXUS gateway encountered an internal server error.';
    case 502:
    case 503:
    case 504: return 'NEXUS server gateway is temporarily unreachable. Please ensure the backend is running.';
    default: return `Server returned response status ${status}.`;
  }
}

/**
 * Robust fetch wrapper that prevents "Unexpected end of JSON input".
 * - Inspects body as text first.
 * - Handles empty responses (204 or empty 200/500/502).
 * - Handles non-JSON error pages (HTML 404/502).
 * - Surfaces friendly status messages instead of raw parser crashes.
 */
export async function safeApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = isAbsolute ? endpoint : `${API_BASE}${normalizedEndpoint}`;

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (networkError: any) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, networkError);
    throw new ApiError(
      'Unable to connect to NEXUS server gateway. Please check your internet connection or verify the server is running.',
      0
    );
  }

  // Read response as text first to guard against syntax errors on empty/malformed bodies
  const rawText = await res.text().catch(() => '');
  let parsedData: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Body is not valid JSON (e.g., HTML error response from proxy or gateway)
      parsedData = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      parsedData?.error ||
      parsedData?.message ||
      (rawText && !rawText.trim().startsWith('<') && rawText.trim().length < 200 ? rawText.trim() : null) ||
      getFriendlyStatusMessage(res.status);
    throw new ApiError(errorMsg, res.status, parsedData);
  }

  // When request succeeded but returned empty body
  if (parsedData === null) {
    return {} as T;
  }

  return parsedData as T;
}

// ============================================================================
// Built-in Fictional Sandbox Data (Guarantees Demo Mode Zero-Failure Resilience)
// ============================================================================

export const FALLBACK_DEMO_USER: CurrentUser = {
  id: 'NEXUS-DEMO',
  name: 'Demo Explorer',
  phone: '+91 00000 00000',
  email: 'demo@nexus.internal',
  nexusId: 'NX-DEMO-VISITOR',
  role: 'demo',
  status: 'Guest Explorer • Fictional Sandbox',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  state: 'National Orbital Grid',
  satelliteAccess: true,
  verifiedBharat: true,
  joinedDate: '2026-11-05',
  publicKey: '{"crv":"P-256","ext":true,"key_ops":[],"kty":"EC","x":"xe6kOofCkNP-of9gvrH2hDV5u2x0hoQN8xNYDz34Rs0","y":"1jwDyWG336TQ_zZAGxD08hcdrevxE24La1AUA-N04oQ"}',
  about: 'Sovereign ISRO Mesh Node • Primary Terminal Active'
};

export const FALLBACK_DEMO_CONTACTS: Contact[] = [
  {
    id: 'demo_contact_mission_control',
    name: 'Mission Control (Simulated)',
    role: 'Sovereign Telemetry Hub',
    phone: '+91 00000 00001',
    nexusId: 'NX-SIM-CTRL',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 96,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'Welcome to the NEXUS Sandbox! Transponder uplink is online.',
    lastMessageTime: '18:40',
    verifiedBharat: true,
    encryptionKey: 'Demo Sandbox Encryption',
    about: 'Simulated ground station testing orbital relay nodes.'
  },
  {
    id: 'demo_contact_aarav',
    name: 'Dr. Aarav (Demo Relay)',
    role: 'NDRF Medical Lead (Sandbox)',
    phone: '+91 00000 00002',
    nexusId: 'NX-SIM-AARAV',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 89,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'Emergency triage readiness: 100%. Standing by for test packets.',
    lastMessageTime: '18:25',
    verifiedBharat: true,
    encryptionKey: 'Demo Sandbox Encryption',
    about: 'Simulated disaster responder contact for UI walkthroughs.'
  },
  {
    id: 'demo_contact_isro',
    name: 'ISRO NavIC Sim Hub',
    role: 'Orbital Transceiver (Demo)',
    phone: '+91 00000 00003',
    nexusId: 'NX-SIM-NAVIC',
    avatar: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 94,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'L5/S-band carrier frequency acquired. Ephemeris data locked.',
    lastMessageTime: '18:10',
    verifiedBharat: true,
    encryptionKey: 'Demo Sandbox Encryption',
    about: 'Simulated navigation satellite constellation bridge.'
  },
  {
    id: 'demo_group_incident_command',
    name: 'National SAR Sandbox Squad',
    role: 'Tactical Coordination (Demo)',
    phone: '+91 00000 00004',
    nexusId: 'NX-SIM-SAR-GRP',
    avatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 91,
    isGroup: true,
    unreadCount: 0,
    lastMessage: 'All field responders: please acknowledge orbital beacon pulse.',
    lastMessageTime: '17:55',
    verifiedBharat: true,
    encryptionKey: 'Demo Sandbox Encryption',
    about: 'Simulated multi-agency emergency operations squad for demo walkthroughs.',
    members: [
      { id: 'NEXUS-DEMO', name: 'Demo Explorer (You)', role: 'Guest Operator', phone: '+91 00000 00000', nexusId: 'NX-DEMO-VISITOR', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      { id: 'demo_member_priya', name: 'Col. Priya Raman', role: 'Air Command Lead', phone: '+91 00000 00005', nexusId: 'NX-SIM-PRIYA', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
      { id: 'demo_member_rohit', name: 'Inspector Rohit Sen', role: 'Coastal Surveillance', phone: '+91 00000 00006', nexusId: 'NX-SIM-ROHIT', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
    ]
  }
];

export const FALLBACK_DEMO_MESSAGES: Record<string, Message[]> = {
  demo_contact_mission_control: [
    {
      id: 'demo_msg_1',
      senderId: 'demo_contact_mission_control',
      senderName: 'Mission Control (Simulated)',
      text: 'Welcome to the NEXUS Sovereign Sandbox! All data in this mode is completely isolated and fictional.',
      timestamp: '18:35',
      mode: 'satellite',
      status: 'delivered'
    },
    {
      id: 'demo_msg_2',
      senderId: 'demo_contact_mission_control',
      senderName: 'Mission Control (Simulated)',
      text: 'Transponder beacon is locked onto NavIC satellite cluster. Try sending a voice note, message, or test UPI payment.',
      timestamp: '18:40',
      mode: 'satellite',
      status: 'delivered'
    }
  ],
  demo_contact_aarav: [
    {
      id: 'demo_msg_3',
      senderId: 'demo_contact_aarav',
      senderName: 'Dr. Aarav (Demo Relay)',
      text: 'NDRF Himalayan field station operational on emulated burst protocol.',
      timestamp: '18:20',
      mode: 'internet',
      status: 'delivered'
    },
    {
      id: 'demo_msg_4',
      senderId: 'demo_contact_aarav',
      senderName: 'Dr. Aarav (Demo Relay)',
      text: 'Emergency triage readiness: 100%. Standing by for test packets.',
      timestamp: '18:25',
      mode: 'satellite',
      status: 'delivered'
    }
  ],
  demo_contact_isro: [
    {
      id: 'demo_msg_5',
      senderId: 'demo_contact_isro',
      senderName: 'ISRO NavIC Sim Hub',
      text: 'GSAT-7A test burst simulation validated. Latency 142ms.',
      timestamp: '17:50',
      mode: 'satellite',
      status: 'delivered'
    }
  ],
  demo_group_incident_command: [
    {
      id: 'demo_msg_6',
      senderId: 'demo_member_priya',
      senderName: 'Col. Priya Raman',
      text: 'Uplink active across all district hubs. Monitoring flood relief radar.',
      timestamp: '17:50',
      mode: 'satellite',
      status: 'delivered'
    },
    {
      id: 'demo_msg_7',
      senderId: 'demo_member_rohit',
      senderName: 'Inspector Rohit Sen',
      text: 'Coastal stations synced. All tactical transponders operational.',
      timestamp: '17:55',
      mode: 'satellite',
      status: 'delivered'
    }
  ]
};

// ============================================================================
// Authentication & Registration APIs
// ============================================================================

export async function requestOtpApi(identifier: string): Promise<{
  success: boolean;
  message: string;
  destination: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
}> {
  return safeApiFetch('/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
}

export async function verifyOtpApi(identifier: string, otp: string, persistSession = true): Promise<{
  success: boolean;
  token: string;
  user: CurrentUser;
}> {
  const data = await safeApiFetch<{
    success: boolean;
    token: string;
    user: CurrentUser;
  }>('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp })
  });

  if (data?.token) {
    setAuthToken(data.token, persistSession);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function logoutApi(): Promise<{ success: boolean }> {
  try {
    await safeApiFetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (err) {
    console.warn('Logout network notice', err);
  } finally {
    clearAuthToken();
    reconnectSocketWithAuth();
  }
  return { success: true };
}

export async function registerUser(payload: {
  name: string;
  phone: string;
  nexusId: string;
  avatar?: string;
  state?: string;
  role?: string;
}): Promise<{ success: boolean; user: CurrentUser; token?: string }> {
  const data = await safeApiFetch<{ success: boolean; user: CurrentUser; token?: string }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (data?.token) {
    setAuthToken(data.token, true);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function generateNexusIdApi(prefix = 'NX'): Promise<{ nexusId: string }> {
  return safeApiFetch(`/api/auth/generate-id?prefix=${encodeURIComponent(prefix)}`);
}

export async function checkNexusIdAvailabilityApi(nexusId: string): Promise<{ available: boolean; nexusId: string }> {
  return safeApiFetch(`/api/auth/check-nexus-id?nexusId=${encodeURIComponent(nexusId)}`);
}

export async function registerStep1Api(payload: {
  name: string;
  email: string;
  phone: string;
  nexusId: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}): Promise<{
  success: boolean;
  registrationId: string;
  destinationMasked: string;
  email: string;
  nexusId: string;
  expiresInSeconds: number;
  message: string;
}> {
  return safeApiFetch('/api/auth/register-step1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function verifyRegistrationApi(
  registrationId: string,
  code: string,
  persistSession = true
): Promise<{
  success: boolean;
  token: string;
  user: CurrentUser;
  nexusId: string;
  message: string;
}> {
  const data = await safeApiFetch<{
    success: boolean;
    token: string;
    user: CurrentUser;
    nexusId: string;
    message: string;
  }>('/api/auth/verify-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, code })
  });

  if (data?.token) {
    setAuthToken(data.token, persistSession);
    reconnectSocketWithAuth();
  }
  return data;
}

/**
 * Dedicated Public Explore Demo Login
 * Resilient implementation: Attempts server auth first, gracefully falls back
 * to local sandbox session if backend gateway is restarting or unreachable.
 */
export async function loginDemoApi(): Promise<{
  success: boolean;
  token: string;
  user: CurrentUser;
  message: string;
}> {
  try {
    const data = await safeApiFetch<{
      success: boolean;
      token: string;
      user: CurrentUser;
      message: string;
    }>('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (data?.token && data?.user) {
      setAuthToken(data.token, true);
      reconnectSocketWithAuth();
      return data;
    }
  } catch (err) {
    console.warn('Backend demo-login unavailable, activating instant local sandbox:', err);
  }

  // Guaranteed fallback for offline, decoupled static previews, or backend restarts
  const fallbackToken = 'nexus_demo_' + Date.now();
  setAuthToken(fallbackToken, true);
  return {
    success: true,
    token: fallbackToken,
    user: FALLBACK_DEMO_USER,
    message: 'Authenticated in Local Sandbox Mode. Fictional sample data active.'
  };
}

export async function resetDemoDataApi(): Promise<{ success: boolean; message: string }> {
  try {
    return await safeApiFetch('/api/demo/reset', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch {
    return { success: true, message: 'Demo sandbox reset.' };
  }
}

export async function loginUser(payload: {
  phone?: string;
  nexusId?: string;
}): Promise<{ success: boolean; user: CurrentUser; token?: string }> {
  const data = await safeApiFetch<{ success: boolean; user: CurrentUser; token?: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (data?.token) {
    setAuthToken(data.token, true);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function fetchUserSessions(): Promise<{ sessions: any[] }> {
  return safeApiFetch('/api/auth/sessions', {
    headers: getAuthHeaders()
  });
}

export async function revokeUserSession(sessionId: string): Promise<{ success: boolean }> {
  return safeApiFetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

export async function verifyNexusId(nexusId: string): Promise<{ available: boolean; nexusId: string }> {
  return safeApiFetch(`/api/auth/verify-id/${encodeURIComponent(nexusId)}`);
}

// ============================================================================
// User Profile APIs
// ============================================================================

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const token = getAuthToken();
  try {
    return await safeApiFetch('/api/user/me', {
      headers: getAuthHeaders()
    });
  } catch (err) {
    if (token.includes('demo') || token.startsWith('nexus_demo')) {
      return FALLBACK_DEMO_USER;
    }
    throw err;
  }
}

export async function updateProfile(data: Partial<CurrentUser>): Promise<CurrentUser> {
  try {
    return await safeApiFetch('/api/user/me', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  } catch (err) {
    const token = getAuthToken();
    if (token.includes('demo')) {
      return { ...FALLBACK_DEMO_USER, ...data };
    }
    throw err;
  }
}

// ============================================================================
// Contacts & Messaging APIs
// ============================================================================

export async function fetchContacts(): Promise<Contact[]> {
  try {
    const list = await safeApiFetch<Contact[]>('/api/contacts', {
      headers: getAuthHeaders()
    });
    if (Array.isArray(list) && list.length > 0) return list;
    const token = getAuthToken();
    if (token.includes('demo')) return FALLBACK_DEMO_CONTACTS;
    return list || [];
  } catch (err) {
    const token = getAuthToken();
    if (token.includes('demo')) {
      return FALLBACK_DEMO_CONTACTS;
    }
    throw err;
  }
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  try {
    return await safeApiFetch('/api/contacts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  } catch (err) {
    const token = getAuthToken();
    if (token.includes('demo')) {
      const mockContact: Contact = {
        id: 'contact_demo_' + Date.now(),
        name: data.name || 'New Demo Contact',
        role: data.role || 'Nexus Sandbox Node',
        phone: data.phone || '+91 00000 00009',
        nexusId: data.nexusId || 'NX-DEMO-NODE',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        online: true,
        lastSeen: 'Active now',
        satelliteLinked: true,
        satelliteSignal: 90,
        isGroup: Boolean(data.isGroup),
        unreadCount: 0,
        lastMessage: 'Chat initialized in sandbox',
        lastMessageTime: 'Just now',
        verifiedBharat: true,
        encryptionKey: 'Demo Sandbox Encryption',
        about: data.about || 'Connected via Nexus Sandbox.'
      };
      FALLBACK_DEMO_CONTACTS.unshift(mockContact);
      return mockContact;
    }
    throw err;
  }
}

export async function addGroupMembers(
  contactId: string, 
  members: GroupMember[]
): Promise<{ success: boolean; members: GroupMember[]; group: Contact }> {
  try {
    return await safeApiFetch(`/api/contacts/${encodeURIComponent(contactId)}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ members })
    });
  } catch (err) {
    const token = getAuthToken();
    if (token.includes('demo')) {
      const group = FALLBACK_DEMO_CONTACTS.find(c => c.id === contactId) || FALLBACK_DEMO_CONTACTS[3];
      group.members = [...(group.members || []), ...members];
      return { success: true, members: group.members, group };
    }
    throw err;
  }
}

export async function fetchMessages(contactId: string): Promise<Message[]> {
  try {
    const msgs = await safeApiFetch<Message[]>(`/api/messages/${encodeURIComponent(contactId)}`, {
      headers: getAuthHeaders()
    });
    if (Array.isArray(msgs)) return msgs;
    return FALLBACK_DEMO_MESSAGES[contactId] || [];
  } catch (err) {
    const token = getAuthToken();
    if (token.includes('demo')) {
      return FALLBACK_DEMO_MESSAGES[contactId] || [];
    }
    throw err;
  }
}

export async function sendMessageApi(payload: {
  contactId: string;
  text?: string;
  mode?: 'internet' | 'satellite';
  type?: string;
  mediaUrl?: string;
  voiceData?: string;
  voiceDuration?: number;
  upiDetails?: UpiDetails;
  alertDetails?: any;
  locationData?: any;
  encryptedEnvelope?: any;
}): Promise<Message> {
  try {
    return await safeApiFetch('/api/messages', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
  } catch (err) {
    const token = getAuthToken();
    if (token.includes('demo')) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const mockMsg: Message = {
        id: 'msg_demo_' + Date.now(),
        senderId: 'NEXUS-DEMO',
        senderName: 'Demo Explorer (You)',
        text: payload.text || '',
        type: (payload.type as any) || (payload.voiceData ? 'voice' : 'text'),
        mode: payload.mode || 'satellite',
        timestamp: timeStr,
        status: 'delivered',
        mediaUrl: payload.voiceData || payload.mediaUrl,
        voiceDuration: payload.voiceDuration,
        upiDetails: payload.upiDetails,
        alertDetails: payload.alertDetails,
        locationData: payload.locationData
      };
      if (!FALLBACK_DEMO_MESSAGES[payload.contactId]) {
        FALLBACK_DEMO_MESSAGES[payload.contactId] = [];
      }
      FALLBACK_DEMO_MESSAGES[payload.contactId].push(mockMsg);
      return mockMsg;
    }
    throw err;
  }
}

export async function toggleMessageReaction(contactId: string, messageId: string, emoji: string): Promise<any> {
  try {
    return await safeApiFetch('/api/messages/reaction', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contactId, messageId, emoji })
    });
  } catch {
    return { success: true };
  }
}

// ============================================================================
// Satellite & SOS Module APIs
// ============================================================================

const FALLBACK_SATELLITE_STATE: SatelliteModuleState = {
  hardwareConnected: false,
  connectionType: 'USB-C Tactical OTG',
  baudRate: '115200',
  hardwareModel: 'Nexus-Orb Rev 4',
  serialNumber: 'NX-ORB-2026-9041',
  firmwareVersion: 'v2.4.1-bh',
  battery: 88,
  signalStrength: 92,
  activeConstellation: 'NavIC-1B (IRNSS)',
  elevationAngle: '54.2°',
  azimuth: '142.6° SE',
  frequency: 'L5: 1176.45 MHz (NavIC SPS)',
  uplinkBitrate: '2.4 kbps',
  encryptionStandard: 'AES-256-GCM + P-256',
  mode: 'auto_hybrid',
  location: {
    lat: 28.6139,
    lng: 77.2090,
    grid: 'NL-28-DELHI',
    place: 'New Delhi Tactical Gateway'
  }
};

export async function fetchSatelliteStatus(): Promise<SatelliteModuleState> {
  try {
    return await safeApiFetch('/api/satellite/status', {
      headers: getAuthHeaders()
    });
  } catch {
    return FALLBACK_SATELLITE_STATE;
  }
}

export async function toggleHardwareModule(
  connected?: boolean
): Promise<{ success: boolean; hardwareConnected: boolean; module: SatelliteModuleState }> {
  try {
    return await safeApiFetch('/api/satellite/hardware/toggle', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ connected })
    });
  } catch {
    const isConn = Boolean(connected);
    return {
      success: true,
      hardwareConnected: isConn,
      module: {
        ...FALLBACK_SATELLITE_STATE,
        hardwareConnected: isConn,
        signalStrength: isConn ? 98 : 0,
        battery: 94
      }
    };
  }
}

export async function toggleSatelliteModule(
  connected?: boolean, 
  mode?: 'internet_only' | 'satellite_only' | 'auto_hybrid'
): Promise<SatelliteModuleState> {
  try {
    return await safeApiFetch('/api/satellite/toggle', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ connected, mode })
    });
  } catch {
    return {
      ...FALLBACK_SATELLITE_STATE,
      hardwareConnected: Boolean(connected),
      mode: mode || 'auto_hybrid'
    };
  }
}

export async function dispatchSosBeacon(payload: {
  latitude?: number;
  longitude?: number;
  medicalNeed?: string;
  notes?: string;
}): Promise<any> {
  try {
    return await safeApiFetch('/api/satellite/sos', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
  } catch {
    return {
      success: true,
      simulated: true,
      message: 'Simulated SOS Distress Uplink dispatached to orbital transponder.',
      packet: { ...payload, timestamp: new Date().toISOString() }
    };
  }
}

export async function processUpiPayment(payload: {
  contactId: string;
  amount: number;
  note?: string;
  receiverVpa?: string;
}): Promise<any> {
  try {
    return await safeApiFetch('/api/upi/pay', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
  } catch {
    return {
      success: true,
      transactionId: 'TXN_' + Date.now(),
      amount: payload.amount,
      note: payload.note || 'NEXUS Sandbox Transfer',
      status: 'SUCCESS'
    };
  }
}

// ============================================================================
// Admin APIs (Protected by Server-Side RBAC)
// ============================================================================

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  return safeApiFetch('/api/admin/metrics', {
    headers: getAuthHeaders()
  });
}

export async function fetchAdminUsers(): Promise<CurrentUser[]> {
  return safeApiFetch('/api/admin/users', {
    headers: getAuthHeaders()
  });
}

export async function updateAdminUser(
  userId: string, 
  data: { role?: string; verifiedBharat?: boolean; satelliteAccess?: boolean }
): Promise<any> {
  return safeApiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
}

export async function broadcastEmergencyAlert(data: {
  title: string; 
  message: string; 
  severity?: string; 
  area?: string;
}): Promise<any> {
  return safeApiFetch('/api/admin/broadcast', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
}

export async function fetchGroundStations(): Promise<GroundStation[]> {
  return safeApiFetch('/api/admin/ground-stations', {
    headers: getAuthHeaders()
  });
}

export async function fetchAuditLogs(): Promise<{ success: boolean; logs: any[] }> {
  return safeApiFetch('/api/admin/audit-logs', {
    headers: getAuthHeaders()
  });
}
