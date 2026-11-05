export type MessageMode = 'internet' | 'satellite';

export type MessageType = 'text' | 'voice' | 'image' | 'upi_transfer' | 'emergency_alert' | 'location';

export interface UpiDetails {
  amount: number;
  senderVpa: string;
  receiverVpa: string;
  utr: string;
  note?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp?: string;
}

export interface AlertDetails {
  level: string;
  category: string;
  area: string;
  satFrequency?: string;
  coordinates?: string;
  gridRef?: string;
  battery?: string;
}

export interface SatelliteInfo {
  constellation: string;
  snr: string;
  compression: string;
  hops: number;
  timestampUtc?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: string;
  mode: MessageMode;
  type?: MessageType;
  mediaUrl?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  upiDetails?: UpiDetails;
  alertDetails?: AlertDetails;
  locationData?: {
    lat: number;
    lng: number;
    address: string;
  };
  satelliteInfo?: SatelliteInfo;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'satellite_uplinked';
  reactions?: string[];
  encryptedEnvelope?: {
    ciphertext: string;
    iv: string;
    senderPublicKey: string;
    mode: string;
  };
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  phone?: string;
  nexusId?: string;
  isAdmin?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  nexusId: string;
  avatar: string;
  online: boolean;
  lastSeen: string;
  satelliteLinked: boolean;
  satelliteSignal: number;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  verifiedBharat: boolean;
  encryptionKey: string;
  about: string;
  publicKey?: string;
  members?: GroupMember[];
}

export interface CurrentUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nexusId: string;
  role: 'admin' | 'officer' | 'citizen' | 'suspended' | 'demo';
  status: string;
  avatar: string;
  about?: string;
  state?: string;
  satelliteAccess?: boolean;
  verifiedBharat: boolean;
  joinedDate?: string;
  publicKey?: string;
}

export interface SatelliteModuleState {
  hardwareConnected: boolean;
  connectionType: string;
  baudRate: string;
  hardwareModel: string;
  serialNumber: string;
  firmwareVersion: string;
  battery: number;
  signalStrength: number;
  activeConstellation: string;
  elevationAngle: string;
  azimuth: string;
  frequency: string;
  uplinkBitrate: string;
  encryptionStandard: string;
  mode: 'internet_only' | 'satellite_only' | 'auto_hybrid';
  location: {
    lat: number;
    lng: number;
    grid: string;
    place: string;
  };
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  caption: string;
  timestamp: string;
  viewed: boolean;
  bgColor?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  satelliteMessages: number;
  internetMessages: number;
  hardwareModulePluggedIn: boolean;
  batteryLevel: number;
  networkHealth: string;
  groundStationsOnline: number;
  activeEmergencyAlerts: number;
  complianceStatus: string;
}

export interface GroundStation {
  id: string;
  name: string;
  location: string;
  status: string;
  load: string;
}
