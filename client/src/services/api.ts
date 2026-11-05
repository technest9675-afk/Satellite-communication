import { io, Socket } from 'socket.io-client';
import { 
  Message, Contact, CurrentUser, SatelliteModuleState, UpiDetails, AdminMetrics, GroundStation 
} from '../types';

const TOKEN_KEY = 'nexus_auth_token';

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

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
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

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';

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

// Authentication APIs
export async function requestOtpApi(identifier: string): Promise<{
  success: boolean;
  message: string;
  destination: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
}> {
  const res = await fetch('/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to request OTP');
  return data;
}

export async function verifyOtpApi(identifier: string, otp: string, persistSession = true): Promise<{
  success: boolean;
  token: string;
  user: CurrentUser;
}> {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'OTP verification failed');

  if (data.token) {
    setAuthToken(data.token, persistSession);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function logoutApi(): Promise<{ success: boolean }> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (err) {
    console.warn('Logout network error', err);
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
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Registration failed');
  if (data.token) {
    setAuthToken(data.token, true);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function generateNexusIdApi(prefix = 'NX'): Promise<{ nexusId: string }> {
  const res = await fetch(`/api/auth/generate-id?prefix=${encodeURIComponent(prefix)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate NEXUS ID');
  return data;
}

export async function checkNexusIdAvailabilityApi(nexusId: string): Promise<{ available: boolean; nexusId: string }> {
  const res = await fetch(`/api/auth/check-nexus-id?nexusId=${encodeURIComponent(nexusId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify NEXUS ID availability');
  return data;
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
  const res = await fetch('/api/auth/register-step1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Registration failed');
  return data;
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
  const res = await fetch('/api/auth/verify-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, code })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Account activation failed');
  if (data.token) {
    setAuthToken(data.token, persistSession);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function loginDemoApi(): Promise<{
  success: boolean;
  token: string;
  user: CurrentUser;
  message: string;
}> {
  const res = await fetch('/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Demo access failed');
  if (data.token) {
    setAuthToken(data.token, true);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function resetDemoDataApi(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/demo/reset', {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to reset demo environment');
  return data;
}

export async function loginUser(payload: {
  phone?: string;
  nexusId?: string;
}): Promise<{ success: boolean; user: CurrentUser; token?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
  if (data.token) {
    setAuthToken(data.token, true);
    reconnectSocketWithAuth();
  }
  return data;
}

export async function fetchUserSessions(): Promise<{ sessions: any[] }> {
  const res = await fetch('/api/auth/sessions', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to load active sessions');
  return res.json();
}

export async function revokeUserSession(sessionId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to revoke session');
  return res.json();
}

export async function verifyNexusId(nexusId: string): Promise<{ available: boolean; nexusId: string }> {
  const res = await fetch(`/api/auth/verify-id/${encodeURIComponent(nexusId)}`);
  return res.json();
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch('/api/user/me', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function updateProfile(data: Partial<CurrentUser>): Promise<CurrentUser> {
  const res = await fetch('/api/user/me', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || 'Failed to update profile');
  }
  return res.json();
}

// Contacts & Messages
export async function fetchContacts(): Promise<Contact[]> {
  const res = await fetch('/api/contacts', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('Failed to fetch contacts');
  }
  return res.json();
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  const res = await fetch('/api/contacts', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create contact');
  return res.json();
}

export async function fetchMessages(contactId: string): Promise<Message[]> {
  const res = await fetch(`/api/messages/${encodeURIComponent(contactId)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
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
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to send message');
  }
  return data;
}

export async function toggleMessageReaction(contactId: string, messageId: string, emoji: string) {
  const res = await fetch('/api/messages/reaction', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ contactId, messageId, emoji })
  });
  if (!res.ok) throw new Error('Failed to toggle reaction');
  return res.json();
}

// Satellite Module APIs
export async function fetchSatelliteStatus(): Promise<SatelliteModuleState> {
  const res = await fetch('/api/satellite/status', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch satellite status');
  return res.json();
}

export async function toggleHardwareModule(connected?: boolean): Promise<{ success: boolean; hardwareConnected: boolean; module: SatelliteModuleState }> {
  const res = await fetch('/api/satellite/hardware/toggle', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ connected })
  });
  if (!res.ok) throw new Error('Failed to toggle satellite hardware');
  return res.json();
}

export async function toggleSatelliteModule(connected?: boolean, mode?: 'internet_only' | 'satellite_only' | 'auto_hybrid'): Promise<SatelliteModuleState> {
  const res = await fetch('/api/satellite/toggle', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ connected, mode })
  });
  if (!res.ok) throw new Error('Failed to update satellite state');
  return res.json();
}

export async function dispatchSosBeacon(payload: {
  latitude?: number;
  longitude?: number;
  medicalNeed?: string;
  notes?: string;
}) {
  const res = await fetch('/api/satellite/sos', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to dispatch SOS');
  }
  return res.json();
}

export async function processUpiPayment(payload: {
  contactId: string;
  amount: number;
  note?: string;
  receiverVpa?: string;
}) {
  const res = await fetch('/api/upi/pay', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('UPI transaction failed');
  return res.json();
}

// Admin APIs (Protected by Server-Side RBAC)
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch('/api/admin/metrics', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch admin metrics');
  }
  return res.json();
}

export async function fetchAdminUsers(): Promise<CurrentUser[]> {
  const res = await fetch('/api/admin/users', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch users');
  }
  return res.json();
}

export async function updateAdminUser(userId: string, data: { role?: string; verifiedBharat?: boolean; satelliteAccess?: boolean }) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to update user');
  }
  return res.json();
}

export async function broadcastEmergencyAlert(data: { title: string; message: string; severity?: string; area?: string }) {
  const res = await fetch('/api/admin/broadcast', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to broadcast');
  }
  return res.json();
}

export async function fetchGroundStations(): Promise<GroundStation[]> {
  const res = await fetch('/api/admin/ground-stations', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch ground stations');
  return res.json();
}

export async function fetchAuditLogs(): Promise<{ success: boolean; logs: any[] }> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
