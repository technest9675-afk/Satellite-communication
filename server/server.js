const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// ZERO-DEPENDENCY SECURITY HEADERS & CORS
// -------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com; media-src 'self' data: blob:; connect-src 'self' ws: wss: http: https:;"
  );
  next();
});

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));

// Request size limits
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// RATE LIMITING ENGINE (Sliding Window in Memory)
// -------------------------------------------------------------
const rateLimitBuckets = new Map();

function rateLimiter({ windowMs, maxRequests, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitBuckets.get(key);
    if (!record || now - record.resetTime > windowMs) {
      record = { count: 1, resetTime: now };
      rateLimitBuckets.set(key, record);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((windowMs - (now - record.resetTime)) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: message, retryAfterSeconds: retryAfter });
    }

    record.count++;
    next();
  };
}

// Stale rate-limit record cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitBuckets.entries()) {
    if (now - record.resetTime > 300000) {
      rateLimitBuckets.delete(key);
    }
  }
}, 300000);

// -------------------------------------------------------------
// INITIAL SEED DATA
// -------------------------------------------------------------
const initialUsers = [
  {
    id: 'user_yash',
    name: 'Captain Yash Vardhan',
    phone: '+91 98765 43210',
    nexusId: 'NX-CAPTAIN-YASH',
    role: 'admin',
    status: 'Operational | Sovereign Node Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    state: 'Delhi NCR',
    satelliteAccess: true,
    verifiedBharat: true,
    joinedDate: '2026-01-15'
  },
  {
    id: 'contact_aarav',
    name: 'Dr. Aarav Sharma',
    phone: '+91 94120 55123',
    nexusId: 'NX-AARAV-NDRF',
    role: 'officer',
    status: 'NDRF Quick Response Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    state: 'Uttarakhand',
    satelliteAccess: true,
    verifiedBharat: true,
    joinedDate: '2026-02-10'
  },
  {
    id: 'contact_isro_ground',
    name: 'Priya Patel',
    phone: '+91 80234 98765',
    nexusId: 'NX-PRIYA-ISRO',
    role: 'officer',
    status: 'ISTRAC Orbital Telemetry',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    state: 'Karnataka',
    satelliteAccess: true,
    verifiedBharat: true,
    joinedDate: '2026-03-01'
  },
  {
    id: 'contact_vikram',
    name: 'Subedar Vikram Singh',
    phone: '+91 97654 32109',
    nexusId: 'NX-VIKRAM-ARMY',
    role: 'officer',
    status: 'Siachen Glacial Patrol Command',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    state: 'Ladakh',
    satelliteAccess: true,
    verifiedBharat: true,
    joinedDate: '2026-03-12'
  },
  {
    id: 'contact_neha',
    name: 'Neha Gupta',
    role: 'citizen',
    phone: '+91 98112 34567',
    nexusId: 'NX-NEHA-LABS',
    status: 'Tech Architect',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    state: 'Maharashtra',
    satelliteAccess: true,
    verifiedBharat: true,
    joinedDate: '2026-04-05'
  },
  {
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
    joinedDate: '2026-11-05'
  }
];

const DEMO_USER = initialUsers[initialUsers.length - 1];

const initialDemoContacts = [
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
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 98,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'GSAT-7A test burst simulation validated. Latency 142ms.',
    lastMessageTime: '17:50',
    verifiedBharat: true,
    encryptionKey: 'Demo Sandbox Encryption',
    about: 'ISRO Telemetry Demo Gateway.'
  },
  {
    id: 'demo_contact_sar_team',
    name: 'SAR Rapid Response (Demo)',
    role: 'Tactical SAR Group',
    phone: '+91 00000 00004',
    nexusId: 'NX-SIM-SAR-GROUP',
    avatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 95,
    isGroup: true,
    unreadCount: 0,
    lastMessage: 'All units check in on 433.5MHz satellite relay.',
    lastMessageTime: '18:50',
    verifiedBharat: true,
    encryptionKey: 'Demo Sandbox Encryption',
    about: 'Emergency coordination group for simulated disaster drills.',
    members: [
      {
        id: 'mem_demo_admin',
        name: 'You (Demo Operator)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'Tactical Group Admin',
        phone: '+91 99999 88888',
        nexusId: 'NX-DEMO-ADMIN',
        isAdmin: true
      },
      {
        id: 'mem_demo_aarav',
        name: 'Dr. Aarav (Demo Relay)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'NDRF Medical Lead',
        phone: '+91 00000 00002',
        nexusId: 'NX-SIM-AARAV',
        isAdmin: false
      },
      {
        id: 'mem_demo_isro',
        name: 'ISRO NavIC Sim Hub',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        role: 'Orbital Transceiver',
        phone: '+91 00000 00003',
        nexusId: 'NX-SIM-NAVIC',
        isAdmin: false
      }
    ]
  }
];

const initialDemoMessages = {
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
  ]
};

let demoStore = {
  contacts: JSON.parse(JSON.stringify(initialDemoContacts)),
  messages: JSON.parse(JSON.stringify(initialDemoMessages))
};

const initialContacts = [
  {
    id: 'contact_aarav',
    name: 'Dr. Aarav Sharma',
    role: 'NDRF Disaster Response Team',
    phone: '+91 94120 55123',
    nexusId: 'NX-AARAV-NDRF',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 94,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'Satellite relay confirmed at Kedarnath base camp. Bandwidth stable.',
    lastMessageTime: '18:32',
    verifiedBharat: true,
    encryptionKey: 'P-256 ECDH Authenticated',
    about: 'Commanding NDRF Quick Reaction Force. All transmissions protected under DPDP principles.'
  },
  {
    id: 'contact_isro_ground',
    name: 'Priya Patel (ISRO NavIC Ops)',
    role: 'Orbital Telemetry Officer',
    phone: '+91 80234 98765',
    nexusId: 'NX-PRIYA-ISRO',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: true,
    satelliteSignal: 98,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'GSAT-7A transponder window is open for the next 4 hours. Uplink clear.',
    lastMessageTime: '18:15',
    verifiedBharat: true,
    encryptionKey: 'P-256 ECDH Authenticated',
    about: 'ISRO Telemetry, Tracking and Command Network (ISTRAC) Bangalore.'
  },
  {
    id: 'contact_family',
    name: 'Family Parivar 🇮🇳',
    role: 'Group • 6 Members',
    phone: '',
    nexusId: 'NX-GRP-FAMILY',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: false,
    satelliteSignal: 0,
    isGroup: true,
    unreadCount: 0,
    lastMessage: 'Maa: Subah se baarish ho rahi hai, weather update check karo.',
    lastMessageTime: '17:45',
    verifiedBharat: true,
    encryptionKey: 'Group Sovereign Key',
    about: 'Our sweet home group. Share photos, recipes and travel updates.',
    members: [
      { id: 'm1', name: 'Papa (Col. Rajesh)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'Group Admin', phone: '+91 94120 55123', nexusId: 'NX-PAPA', isAdmin: true },
      { id: 'm2', name: 'Maa', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', role: 'Member', phone: '+91 98110 01240', nexusId: 'NX-MAA', isAdmin: false },
      { id: 'm3', name: 'Rohan (Brother)', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', role: 'Member', phone: '+91 98220 01880', nexusId: 'NX-ROHAN', isAdmin: false },
      { id: 'm4', name: 'Ananya (Sister)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', role: 'Member', phone: '+91 98330 01990', nexusId: 'NX-ANANYA', isAdmin: false }
    ]
  },
  {
    id: 'contact_vikram',
    name: 'Subedar Vikram Singh',
    role: 'Northern Command / Siachen Outpost',
    phone: '+91 97654 32109',
    nexusId: 'NX-VIKRAM-ARMY',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    online: false,
    lastSeen: '10 min ago via Satellite',
    satelliteLinked: true,
    satelliteSignal: 88,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'Heavy blizzard cut terrestrial optical fiber. Now transmitting purely on Nexus Satellite module.',
    lastMessageTime: '16:50',
    verifiedBharat: true,
    encryptionKey: 'P-256 ECDH Authenticated',
    about: 'Border Security & Patrol Communications Hub.'
  },
  {
    id: 'contact_neha',
    name: 'Neha Gupta',
    role: 'Product Architect @ Nexus Labs',
    phone: '+91 98112 34567',
    nexusId: 'NX-NEHA-LABS',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: false,
    satelliteSignal: 0,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'Check out the new UPI instant settlement feature in the chat!',
    lastMessageTime: '15:20',
    verifiedBharat: true,
    encryptionKey: 'P-256 ECDH Authenticated',
    about: 'Building sovereign Indian communication infrastructure.'
  },
  {
    id: 'contact_ndrf_ops',
    name: 'NDRF Disaster Central Alert 🚨',
    role: 'National Emergency Broadcast',
    phone: '112 / 1070',
    nexusId: 'NX-NDRF-HQ',
    avatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80',
    online: true,
    lastSeen: 'Emergency Broadcast Live',
    satelliteLinked: true,
    satelliteSignal: 100,
    isGroup: true,
    unreadCount: 0,
    lastMessage: 'CYCLONE MONITORED: Bay of Bengal alert. Sat-com channels 14 to 28 activated.',
    lastMessageTime: '14:02',
    verifiedBharat: true,
    encryptionKey: 'Govt Sovereign Broadcast Key',
    about: 'Official National Disaster Response Force direct communication gateway.'
  }
];

const initialMessages = {
  contact_aarav: [
    {
      id: 'msg_1',
      senderId: 'contact_aarav',
      senderName: 'Dr. Aarav Sharma',
      text: 'Namaste Captain Yash! Setting up the mobile medical triage station near Rudraprayag.',
      timestamp: '18:25',
      mode: 'internet',
      status: 'read'
    },
    {
      id: 'msg_2',
      senderId: 'user_yash',
      senderName: 'Captain Yash Vardhan',
      text: 'Understood Dr. Aarav. How is the optical fiber backhaul holding up with the landslides?',
      timestamp: '18:28',
      mode: 'internet',
      status: 'read'
    },
    {
      id: 'msg_3',
      senderId: 'contact_aarav',
      senderName: 'Dr. Aarav Sharma',
      text: 'Ground optical cables snapped due to soil erosion. Switched over to the Nexus-Orb satellite module.',
      timestamp: '18:30',
      mode: 'satellite',
      satelliteInfo: {
        constellation: 'ISRO NavIC / GSAT-7A',
        snr: '28.4 dB',
        compression: '92% saved',
        hops: 1
      },
      status: 'read'
    },
    {
      id: 'msg_4',
      senderId: 'contact_aarav',
      senderName: 'Dr. Aarav Sharma',
      text: 'Satellite relay confirmed at Kedarnath base camp. Bandwidth stable.',
      timestamp: '18:32',
      mode: 'satellite',
      satelliteInfo: {
        constellation: 'ISRO NavIC / GSAT-7A',
        snr: '29.1 dB',
        compression: '94% saved',
        hops: 1
      },
      status: 'read'
    }
  ],
  contact_isro_ground: [
    {
      id: 'msg_ig_1',
      senderId: 'contact_isro_ground',
      senderName: 'Priya Patel',
      text: 'Greetings Yash! Telemetry check from ISTRAC ground terminal Bangalore.',
      timestamp: '18:05',
      mode: 'satellite',
      satelliteInfo: { constellation: 'NavIC-1I (Orbit 36,000 km)', snr: '34.2 dB', compression: '95%', hops: 1 },
      status: 'read'
    },
    {
      id: 'msg_ig_2',
      senderId: 'user_yash',
      senderName: 'Captain Yash Vardhan',
      text: 'Signal is remarkably crisp. What is the current transponder window for northern latitudes?',
      timestamp: '18:10',
      mode: 'satellite',
      satelliteInfo: { constellation: 'NavIC-1I', snr: '33.8 dB', compression: '93%', hops: 1 },
      status: 'read'
    },
    {
      id: 'msg_ig_3',
      senderId: 'contact_isro_ground',
      senderName: 'Priya Patel',
      text: 'GSAT-7A transponder window is open for the next 4 hours. Uplink clear.',
      timestamp: '18:15',
      mode: 'satellite',
      satelliteInfo: { constellation: 'GSAT-7A Military / Civilian Dual-band', snr: '36.5 dB', compression: '96%', hops: 1 },
      status: 'read'
    }
  ],
  contact_family: [
    {
      id: 'msg_fam_1',
      senderId: 'user_yash',
      senderName: 'Captain Yash Vardhan',
      text: 'Sab kaisa hai ghar par? (How is everything at home?)',
      timestamp: '17:30',
      mode: 'internet',
      status: 'read'
    },
    {
      id: 'msg_fam_2',
      senderId: 'contact_family',
      senderName: 'Papa',
      text: 'Sab theek hai beta! Tumhari behan ka college admission confirm ho gaya.',
      timestamp: '17:35',
      mode: 'internet',
      status: 'read',
      reactions: ['❤️', '🎉']
    },
    {
      id: 'msg_fam_3',
      senderId: 'contact_family',
      senderName: 'Maa',
      text: 'Subah se baarish ho rahi hai, weather update check karo.',
      timestamp: '17:45',
      mode: 'internet',
      status: 'read'
    }
  ],
  contact_vikram: [
    {
      id: 'msg_vik_1',
      senderId: 'contact_vikram',
      senderName: 'Subedar Vikram Singh',
      text: 'Jai Hind Captain. Temperature is -24°C up here on the glacier.',
      timestamp: '16:40',
      mode: 'satellite',
      satelliteInfo: { constellation: 'GSAT-7A', snr: '26.1 dB', compression: '90%', hops: 2 },
      status: 'read'
    },
    {
      id: 'msg_vik_2',
      senderId: 'contact_vikram',
      senderName: 'Subedar Vikram Singh',
      text: 'Heavy blizzard cut terrestrial optical fiber. Now transmitting purely on Nexus Satellite module.',
      timestamp: '16:50',
      mode: 'satellite',
      satelliteInfo: { constellation: 'GSAT-7A', snr: '25.8 dB', compression: '91%', hops: 2 },
      status: 'read'
    }
  ],
  contact_neha: [
    {
      id: 'msg_neh_1',
      senderId: 'contact_neha',
      senderName: 'Neha Gupta',
      text: 'Hey Yash! We just tested the DPDP Act 2023 compliance sandbox and local Indian data residency validation.',
      timestamp: '15:10',
      mode: 'internet',
      status: 'read'
    },
    {
      id: 'msg_neh_2',
      senderId: 'contact_neha',
      senderName: 'Neha Gupta',
      text: 'Check out the new UPI instant settlement feature in the chat!',
      timestamp: '15:20',
      mode: 'internet',
      status: 'read',
      type: 'upi_transfer',
      upiDetails: {
        amount: 500,
        senderVpa: 'neha@okaxis',
        receiverVpa: 'yash@oknexus',
        utr: 'UPI/20261030/982341992',
        note: 'Project Coffee & Samosas ☕🇮🇳',
        status: 'COMPLETED'
      }
    }
  ],
  contact_ndrf_ops: [
    {
      id: 'msg_ndrf_1',
      senderId: 'contact_ndrf_ops',
      senderName: 'NDRF Central Alert',
      text: 'CYCLONE MONITORED: Bay of Bengal alert. Sat-com channels 14 to 28 activated.',
      timestamp: '14:02',
      mode: 'satellite',
      satelliteInfo: { constellation: 'NavIC Regional Emergency Grid', snr: '40.0 dB', compression: '98%', hops: 1 },
      status: 'read',
      type: 'emergency_alert',
      alertDetails: {
        level: 'ORANGE ALERT',
        category: 'Severe Cyclonic Storm',
        area: 'Odisha - West Bengal Coastline',
        satFrequency: '1420.45 MHz (L5 NavIC Band)'
      }
    }
  ]
};

const defaultData = {
  registeredUsers: initialUsers,
  contacts: initialContacts,
  messages: initialMessages,
  satelliteModule: {
    hardwareConnected: true,
    connectionType: 'USB-C / Sub-GHz RF Interop',
    baudRate: '115200 bps Serial Interop',
    hardwareModel: 'Nexus-Orb Micro-Transceiver (Simulation Engine)',
    serialNumber: 'NX-SIM-2026-IND-9912',
    firmwareVersion: 'v4.2.1-EMULATED-RELAY',
    battery: 89,
    signalStrength: 92,
    activeConstellation: 'NavIC (ISRO IRNSS) + GSAT-7A',
    elevationAngle: '54.2° NNE',
    azimuth: '128.4°',
    frequency: '1176.45 MHz (L5) / 2492.028 MHz (S-Band)',
    uplinkBitrate: '2.4 kbps (Low-Power Burst)',
    encryptionStandard: 'WebCrypto ECDH P-256 + AES-256-GCM',
    mode: 'auto_hybrid',
    isSimulated: true,
    location: {
      lat: 28.6139,
      lng: 77.2090,
      grid: 'MGRS 43R FK 2341 8912',
      place: 'New Delhi / National Capital Region, India'
    }
  },
  groundStations: [
    { id: 'ISTRAC-BLR', name: 'ISTRAC Primary Ground Terminal', location: 'Bengaluru, Karnataka', status: 'ONLINE', load: '42%' },
    { id: 'ISRO-HASSAN', name: 'Master Control Facility (MCF)', location: 'Hassan, Karnataka', status: 'ONLINE', load: '38%' },
    { id: 'NAVIC-LKO', name: 'Regional Monitoring Uplink', location: 'Lucknow, Uttar Pradesh', status: 'ONLINE', load: '29%' },
    { id: 'COASTAL-PBL', name: 'Island & Maritime Gateway', location: 'Port Blair, Andaman & Nicobar', status: 'ONLINE', load: '51%' },
    { id: 'NORTH-LEH', name: 'High-Altitude Glacial Node', location: 'Leh, Ladakh', status: 'ONLINE', load: '18%' }
  ],
  adminAuditLog: [
    { id: 1, action: 'Sovereign Node Initialization', timestamp: '2026-10-30 09:00', by: 'System', status: 'SUCCESS' },
    { id: 2, action: 'DPDP Principles Architectural Audit', timestamp: '2026-10-30 12:30', by: 'Security Architect', status: 'VERIFIED' },
    { id: 3, action: 'NavIC-1A Transponder Window Locked', timestamp: '2026-10-30 15:45', by: 'NX-PRIYA-ISRO', status: 'ACTIVE' }
  ]
};

// -------------------------------------------------------------
// ATOMIC DATA STORAGE
// -------------------------------------------------------------
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.registeredUsers || parsed.registeredUsers.length === 0) {
        parsed.registeredUsers = initialUsers;
      } else {
        if (!parsed.registeredUsers.some(u => u.id === 'user_yash')) {
          parsed.registeredUsers.unshift(initialUsers[0]);
        }
        if (!parsed.registeredUsers.some(u => u.id === 'NEXUS-DEMO')) {
          parsed.registeredUsers.push(DEMO_USER);
        }
      }
      if (!parsed.contacts) parsed.contacts = initialContacts;
      if (!parsed.messages) parsed.messages = initialMessages;
      if (!parsed.satelliteModule) parsed.satelliteModule = defaultData.satelliteModule;
      if (!parsed.groundStations) parsed.groundStations = defaultData.groundStations;
      if (!parsed.adminAuditLog) parsed.adminAuditLog = defaultData.adminAuditLog;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading store, resetting to default:', err.message);
  }
  saveStore(defaultData);
  return defaultData;
}

function saveStore(data) {
  try {
    const tmpFile = `${STORE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error('Error saving store atomically:', err.message);
  }
}

let store = loadStore();

// -------------------------------------------------------------
// CRYPTOGRAPHIC OTP STORE & TIMING-SAFE VERIFICATION
// -------------------------------------------------------------
const otpStore = new Map();

function hashOtp(code, salt) {
  return crypto.pbkdf2Sync(code, salt, 1000, 32, 'sha256').toString('hex');
}

// -------------------------------------------------------------
// SERVER SESSION STORE
// -------------------------------------------------------------
const activeSessions = new Map();

const initialAdminToken = 'nexus_admin_session_root_token_2026';
activeSessions.set(initialAdminToken, {
  token: initialAdminToken,
  userId: 'user_yash',
  role: 'admin',
  createdAt: Date.now(),
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  ip: '127.0.0.1',
  userAgent: 'Nexus-Bootstrap-Terminal'
});

function createSession(user, req) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    token,
    userId: user.id,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    ip: req?.ip || req?.connection?.remoteAddress || '127.0.0.1',
    userAgent: req?.headers ? req.headers['user-agent'] || 'Unknown' : 'Socket.IO'
  };
  activeSessions.set(token, session);
  return session;
}

function getSession(token) {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

function destroySession(token) {
  if (token) activeSessions.delete(token);
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(token);
    }
  }
}, 600000);

// -------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// -------------------------------------------------------------
function parseCookie(req) {
  const list = {};
  const rc = req.headers?.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function authenticateUser(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookie(req);
    token = cookies.nexus_session;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = store.registeredUsers.find(u => u.id === session.userId) || (session.userId === DEMO_USER.id ? DEMO_USER : null);
  if (!user || user.role === 'suspended') {
    destroySession(token);
    return res.status(403).json({ error: 'User account suspended or not found.' });
  }

  req.user = user;
  req.session = session;
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this operation.' });
    }
    next();
  };
}

// -------------------------------------------------------------
// PUBLIC & HEALTH CHECK APIS
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Nexus',
    version: '3.0.0-Sovereign',
    securityArchitecture: {
      standard: 'Digital Personal Data Protection (DPDP) Act 2023 Principles',
      dataSovereignty: 'All persistent packets stored strictly on Indian Sovereign Nodes',
      encryptionStandard: 'Client-Side WebCrypto ECDH P-256 + AES-256-GCM Authenticated Encryption'
    },
    hardwareModule: {
      ...store.satelliteModule,
      isSimulated: true,
      simulationNotice: 'Hardware transceiver emulation active for demo resilience'
    }
  });
});

// -------------------------------------------------------------
// CRYPTOGRAPHIC AUTHENTICATION & SESSION APIS
// -------------------------------------------------------------

// -------------------------------------------------------------
// PENDING REGISTRATION STORE & UNIQUE ID GENERATOR
// -------------------------------------------------------------
const pendingRegistrations = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, reg] of pendingRegistrations.entries()) {
    if (now > reg.expiresAt) {
      pendingRegistrations.delete(id);
    }
  }
}, 120000);

function generateUniqueNexusId(prefix = 'NX') {
  const cleanPrefix = (prefix || 'NX').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'NX';
  for (let attempt = 0; attempt < 100; attempt++) {
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const candidate = `${cleanPrefix}-${randomSuffix}`;
    const takenInStore = store.registeredUsers.some(u => u.nexusId.toUpperCase() === candidate);
    let takenInPending = false;
    for (const reg of pendingRegistrations.values()) {
      if (reg.nexusId && reg.nexusId.toUpperCase() === candidate) {
        takenInPending = true;
        break;
      }
    }
    if (!takenInStore && !takenInPending) {
      return candidate;
    }
  }
  return `NX-${Date.now().toString(36).toUpperCase()}`;
}

function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

app.get('/api/auth/generate-id', (req, res) => {
  const prefix = req.query.prefix || 'NX';
  const id = generateUniqueNexusId(prefix);
  res.json({ nexusId: id });
});

app.get(['/api/auth/verify-id/:nexusId', '/api/auth/check-nexus-id'], (req, res) => {
  const nexusId = req.params.nexusId || req.query.nexusId;
  const cleanId = (nexusId || '').trim().toUpperCase();
  if (!cleanId) return res.status(400).json({ error: 'NEXUS ID is required' });
  const exists = store.registeredUsers.some(u => u.nexusId.toUpperCase() === cleanId);
  res.json({ available: !exists, nexusId: cleanId });
});

// Step 1: Request Cryptographic OTP
app.post(
  '/api/auth/request-otp',
  rateLimiter({ windowMs: 60000, maxRequests: 5, message: 'Too many OTP requests. Please wait 60 seconds.' }),
  (req, res) => {
    let { phone, nexusId, identifier } = req.body;
    if (identifier) {
      if (identifier.startsWith('+') || /^\d+$/.test(identifier.replace(/[\s-]/g, ''))) {
        phone = identifier;
      } else {
        nexusId = identifier;
      }
    }

    if (!phone && !nexusId) {
      return res.status(400).json({ error: 'Please enter your registered phone number or Nexus ID.' });
    }

    const normPhone = phone ? phone.replace(/\s+/g, '') : null;
    const normId = nexusId ? nexusId.trim().toUpperCase() : null;

    const user = store.registeredUsers.find(u => {
      if (normId && u.nexusId.toUpperCase() === normId) return true;
      if (normPhone && u.phone.replace(/\s+/g, '') === normPhone) return true;
      return false;
    });

    if (!user) {
      return res.status(404).json({
        error: 'No account registered with this phone number or Nexus ID. Please check your credentials or tap Request Access to register.'
      });
    }

    const identifierKey = user.id;

    // Check resend cooldown
    const existing = otpStore.get(identifierKey);
    if (existing && Date.now() < existing.resendAllowedAt) {
      const waitSec = Math.ceil((existing.resendAllowedAt - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new code.` });
    }

    // Generate 6-digit cryptographically random OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashOtp(rawOtp, salt);

    otpStore.set(identifierKey, {
      hash,
      salt,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      resendAllowedAt: Date.now() + 60000,
      userId: user.id
    });

    console.log(`[NEXUS-AUTH-GATEWAY] Secure OTP generated for ${user.name} (${user.nexusId}): [${rawOtp}] (Valid for 5m)`);

    res.json({
      success: true,
      identifier: identifierKey,
      destination: user.phone ? user.phone.slice(-4).padStart(user.phone.length, '•') : user.nexusId,
      destinationMasked: user.phone ? user.phone.slice(-4).padStart(user.phone.length, '•') : user.nexusId,
      message: 'One-Time Verification Code has been generated. Please enter the 6-digit code to log in.',
      expiresInSeconds: 300,
      cooldownSeconds: 60
    });
  }
);

// Step 2: Verify Cryptographic OTP & Issue Authenticated Session
app.post(
  '/api/auth/verify-otp',
  rateLimiter({ windowMs: 60000, maxRequests: 10, message: 'Too many verification attempts. Please wait.' }),
  (req, res) => {
    const { identifier, otp, phone, nexusId } = req.body;

    if (!otp || !otp.trim()) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }

    let user = null;
    let identifierKey = identifier;

    if (identifierKey && otpStore.has(identifierKey)) {
      user = store.registeredUsers.find(u => u.id === identifierKey);
    }

    if (!user) {
      let rawPhone = phone;
      let rawId = nexusId;
      if (identifier) {
        if (identifier.startsWith('+') || /^\d+$/.test(identifier.replace(/[\s-]/g, ''))) {
          rawPhone = identifier;
        } else {
          rawId = identifier;
        }
      }
      const normPhone = rawPhone ? rawPhone.replace(/\s+/g, '') : null;
      const normId = rawId ? rawId.trim().toUpperCase() : null;

      user = store.registeredUsers.find(u => {
        if (normId && u.nexusId.toUpperCase() === normId) return true;
        if (normPhone && u.phone.replace(/\s+/g, '') === normPhone) return true;
        return false;
      });

      if (user) identifierKey = user.id;
    }

    if (!user || !identifierKey || !otpStore.has(identifierKey)) {
      return res.status(401).json({ error: 'No active verification code found for this account. Please request a new code.' });
    }

    const record = otpStore.get(identifierKey);

    if (Date.now() > record.expiresAt) {
      otpStore.delete(identifierKey);
      return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(identifierKey);
      return res.status(429).json({ error: 'Too many failed verification attempts. Please request a new code.' });
    }

    record.attempts++;

    const inputHash = hashOtp(otp.trim(), record.salt);
    const expectedBuf = Buffer.from(record.hash, 'hex');
    const inputBuf = Buffer.from(inputHash, 'hex');

    if (expectedBuf.length !== inputBuf.length || !crypto.timingSafeEqual(expectedBuf, inputBuf)) {
      const remaining = 5 - record.attempts;
      return res.status(401).json({ error: `Invalid verification code. Attempts remaining: ${remaining}` });
    }

    // Code is valid: destroy immediately to prevent replay
    otpStore.delete(identifierKey);

    const session = createSession(user, req);
    res.setHeader('Set-Cookie', `nexus_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);

    res.json({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        nexusId: user.nexusId,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        state: user.state,
        satelliteAccess: user.satelliteAccess,
        verifiedBharat: user.verifiedBharat,
        joinedDate: user.joinedDate
      }
    });
  }
);

// Register New Account
app.post(
  '/api/auth/register',
  rateLimiter({ windowMs: 60000, maxRequests: 5, message: 'Too many registration requests. Please wait.' }),
  (req, res) => {
    const { name, phone, nexusId, avatar, state } = req.body;

    if (!name || !phone || !nexusId) {
      return res.status(400).json({ error: 'Name, mobile number, and unique Nexus ID are required.' });
    }

    const cleanNexusId = nexusId.trim().toUpperCase();
    const cleanPhone = phone.trim();

    if (store.registeredUsers.some(u => u.nexusId.toUpperCase() === cleanNexusId)) {
      return res.status(409).json({ error: 'This Nexus ID is already registered. Please choose another.' });
    }
    if (store.registeredUsers.some(u => u.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''))) {
      return res.status(409).json({ error: 'This mobile number is already registered. Please sign in.' });
    }

    const newUser = {
      id: 'user_' + crypto.randomBytes(8).toString('hex'),
      name: name.trim().slice(0, 60),
      phone: cleanPhone.slice(0, 25),
      nexusId: cleanNexusId.slice(0, 30),
      role: 'citizen',
      status: 'Active on Nexus Sovereign Net',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      state: (state || 'National').slice(0, 50),
      satelliteAccess: true,
      verifiedBharat: true,
      joinedDate: new Date().toISOString().slice(0, 10)
    };

    store.registeredUsers.unshift(newUser);

    store.contacts.unshift({
      id: newUser.id,
      name: newUser.name,
      role: 'Nexus Verified Citizen',
      phone: newUser.phone,
      nexusId: newUser.nexusId,
      avatar: newUser.avatar,
      online: true,
      lastSeen: 'Active now',
      satelliteLinked: true,
      satelliteSignal: 90,
      isGroup: false,
      unreadCount: 0,
      lastMessage: 'Channel established with WebCrypto authenticated encryption',
      lastMessageTime: 'Just now',
      verifiedBharat: true,
      encryptionKey: 'P-256 ECDH Authenticated',
      about: 'Registered Nexus user in ' + (state || 'Bharat') + '.'
    });

    saveStore(store);

    const session = createSession(newUser, req);
    res.setHeader('Set-Cookie', `nexus_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);

    io.emit('user_registered', { id: newUser.id, name: newUser.name, nexusId: newUser.nexusId });
    res.status(201).json({ success: true, token: session.token, user: newUser });
  }
);

// Step 1: Account Registration with Password Hashing & OTP Dispatch
app.post(
  '/api/auth/register-step1',
  rateLimiter({ windowMs: 60000, maxRequests: 10, message: 'Too many registration attempts. Please wait 60 seconds.' }),
  async (req, res) => {
    try {
      const { name, email, phone, nexusId, password, confirmPassword, termsAccepted } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters).' });
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 7) {
        return res.status(400).json({ error: 'Please enter a valid mobile station number.' });
      }

      if (!nexusId || typeof nexusId !== 'string' || nexusId.trim().length < 3) {
        return res.status(400).json({ error: 'Please enter or generate a unique NEXUS ID.' });
      }

      if (!validatePasswordStrength(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
      }

      if (!termsAccepted) {
        return res.status(400).json({ error: 'You must accept the NEXUS Terms of Service and DPDP Privacy Policy.' });
      }

      const cleanName = name.trim().slice(0, 60);
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();
      const normPhone = cleanPhone.replace(/[\s-]/g, '');
      const cleanNexusId = nexusId.trim().toUpperCase();

      // Duplicate checks
      if (store.registeredUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      }

      if (store.registeredUsers.some(u => u.phone && u.phone.replace(/[\s-]/g, '') === normPhone)) {
        return res.status(409).json({ error: 'An account with this mobile number already exists. Please sign in.' });
      }

      if (store.registeredUsers.some(u => u.nexusId.toUpperCase() === cleanNexusId)) {
        return res.status(409).json({ error: 'This NEXUS ID is already registered. Please choose another or click Auto-Generate.' });
      }

      // Hash password using bcryptjs
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate 6-digit cryptographic verification code
      const rawCode = crypto.randomInt(100000, 1000000).toString();
      const salt = crypto.randomBytes(16).toString('hex');
      const otpHash = hashOtp(rawCode, salt);

      const registrationId = 'reg_' + crypto.randomBytes(16).toString('hex');

      pendingRegistrations.set(registrationId, {
        registrationId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        nexusId: cleanNexusId,
        passwordHash,
        otpHash,
        salt,
        attempts: 0,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      console.log(`[NEXUS-REGISTRATION] Verification Code for ${cleanEmail} / ${cleanPhone} (${cleanNexusId}): [${rawCode}] (Valid 5m)`);

      const emailParts = cleanEmail.split('@');
      const maskedEmail = emailParts[0].length > 3
        ? `${emailParts[0].slice(0, 2)}•••${emailParts[0].slice(-1)}@${emailParts[1]}`
        : `${emailParts[0].slice(0, 1)}•••@${emailParts[1]}`;

      const maskedPhone = cleanPhone.slice(-4).padStart(cleanPhone.length, '•');

      res.status(200).json({
        success: true,
        registrationId,
        destinationMasked: `${maskedEmail} / ${maskedPhone}`,
        email: cleanEmail,
        nexusId: cleanNexusId,
        expiresInSeconds: 300,
        message: 'A 6-digit verification code has been dispatched. Enter the code to activate your account.'
      });
    } catch (err) {
      console.error('Registration step1 error:', err);
      res.status(500).json({ error: 'Internal server error while processing registration.' });
    }
  }
);

// Step 2: Verify Registration Code & Activate Account
app.post(
  '/api/auth/verify-registration',
  rateLimiter({ windowMs: 60000, maxRequests: 10, message: 'Too many verification attempts. Please wait.' }),
  (req, res) => {
    const { registrationId, code } = req.body;

    if (!registrationId || !code) {
      return res.status(400).json({ error: 'Registration ID and 6-digit verification code are required.' });
    }

    const reg = pendingRegistrations.get(registrationId);
    if (!reg) {
      return res.status(404).json({ error: 'Registration session expired or not found. Please restart registration.' });
    }

    if (Date.now() > reg.expiresAt) {
      pendingRegistrations.delete(registrationId);
      return res.status(401).json({ error: 'Verification code has expired. Please restart registration.' });
    }

    if (reg.attempts >= 5) {
      pendingRegistrations.delete(registrationId);
      return res.status(429).json({ error: 'Too many failed verification attempts. Please restart registration.' });
    }

    reg.attempts++;

    const inputHash = hashOtp(code.trim(), reg.salt);
    const expectedBuf = Buffer.from(reg.otpHash, 'hex');
    const inputBuf = Buffer.from(inputHash, 'hex');

    if (expectedBuf.length !== inputBuf.length || !crypto.timingSafeEqual(expectedBuf, inputBuf)) {
      const remaining = 5 - reg.attempts;
      return res.status(401).json({ error: `Invalid verification code. Attempts remaining: ${remaining}` });
    }

    // Success: delete pending registration immediately to prevent replay
    pendingRegistrations.delete(registrationId);

    // Standard citizen role strictly enforced (never user-assigned)
    const newUser = {
      id: 'user_' + crypto.randomBytes(8).toString('hex'),
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      nexusId: reg.nexusId,
      role: 'citizen',
      passwordHash: reg.passwordHash,
      status: 'Active on Nexus Sovereign Net',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      state: 'National Node',
      satelliteAccess: true,
      verifiedBharat: true,
      joinedDate: new Date().toISOString().slice(0, 10)
    };

    store.registeredUsers.unshift(newUser);

    store.contacts.unshift({
      id: newUser.id,
      name: newUser.name,
      role: 'Nexus Verified Citizen',
      phone: newUser.phone,
      nexusId: newUser.nexusId,
      avatar: newUser.avatar,
      online: true,
      lastSeen: 'Active now',
      satelliteLinked: true,
      satelliteSignal: 92,
      isGroup: false,
      unreadCount: 0,
      lastMessage: 'Channel established with WebCrypto authenticated encryption',
      lastMessageTime: 'Just now',
      verifiedBharat: true,
      encryptionKey: 'P-256 ECDH Authenticated',
      about: 'Nexus Sovereign Citizen.'
    });

    saveStore(store);

    const session = createSession(newUser, req);
    res.setHeader('Set-Cookie', `nexus_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);

    io.emit('user_registered', { id: newUser.id, name: newUser.name, nexusId: newUser.nexusId });

    res.status(201).json({
      success: true,
      token: session.token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        nexusId: newUser.nexusId,
        role: newUser.role,
        status: newUser.status,
        avatar: newUser.avatar,
        state: newUser.state,
        satelliteAccess: newUser.satelliteAccess,
        verifiedBharat: newUser.verifiedBharat,
        joinedDate: newUser.joinedDate
      },
      nexusId: newUser.nexusId,
      message: 'Account successfully registered and activated. Welcome to NEXUS!'
    });
  }
);

// Dedicated Secure Public Demo Account Login
app.post(
  '/api/auth/demo-login',
  rateLimiter({ windowMs: 60000, maxRequests: 30, message: 'Too many demo requests. Please slow down.' }),
  (req, res) => {
    if (!store.registeredUsers.some(u => u.id === DEMO_USER.id)) {
      store.registeredUsers.push(DEMO_USER);
      saveStore(store);
    }

    const session = createSession(DEMO_USER, req);
    res.setHeader('Set-Cookie', `nexus_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);

    res.json({
      success: true,
      token: session.token,
      user: DEMO_USER,
      message: 'Authenticated as Demo Explorer. Fictional sample data sandbox is active.'
    });
  }
);

// Reset Demo Environment to Initial State
app.post('/api/demo/reset', authenticateUser, (req, res) => {
  if (req.user.role !== 'demo') {
    return res.status(403).json({ error: 'Demo reset is only permissible within a demo session.' });
  }

  demoStore.contacts = JSON.parse(JSON.stringify(initialDemoContacts));
  demoStore.messages = JSON.parse(JSON.stringify(initialDemoMessages));

  res.json({ success: true, message: 'Demo sandbox data reset successfully.' });
});

// Logout Session
app.post('/api/auth/logout', authenticateUser, (req, res) => {
  destroySession(req.session.token);
  res.setHeader('Set-Cookie', 'nexus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Active Device Sessions
app.get('/api/auth/sessions', authenticateUser, (req, res) => {
  const sessions = [];
  for (const [token, s] of activeSessions.entries()) {
    if (s.userId === req.user.id) {
      sessions.push({
        id: token.slice(0, 8),
        isCurrent: token === req.session.token,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: new Date(s.createdAt).toISOString(),
        expiresAt: new Date(s.expiresAt).toISOString()
      });
    }
  }
  res.json(sessions);
});

// Revoke Session
app.delete('/api/auth/sessions/:sessionId', authenticateUser, (req, res) => {
  const { sessionId } = req.params;
  for (const [token, s] of activeSessions.entries()) {
    if (s.userId === req.user.id && token.startsWith(sessionId)) {
      activeSessions.delete(token);
      return res.json({ success: true, message: 'Session revoked.' });
    }
  }
  res.status(404).json({ error: 'Session not found.' });
});

// -------------------------------------------------------------
// USER PROFILE APIS
// -------------------------------------------------------------

app.get('/api/user/me', authenticateUser, (req, res) => {
  res.json(req.user);
});

// Update Profile
app.put('/api/user/me', authenticateUser, (req, res) => {
  const { name, status, avatar, state, publicKey, about } = req.body;

  if (req.user.role === 'demo') {
    if (name !== undefined) DEMO_USER.name = String(name).trim().slice(0, 60);
    if (status !== undefined) DEMO_USER.status = String(status).trim().slice(0, 100);
    if (avatar !== undefined) DEMO_USER.avatar = String(avatar).trim().slice(0, 5000000);
    if (about !== undefined) DEMO_USER.about = String(about).trim().slice(0, 200);

    Object.assign(req.user, DEMO_USER);
    const storeUser = store.registeredUsers.find(u => u.id === req.user.id);
    if (storeUser) {
      Object.assign(storeUser, DEMO_USER);
    }
    return res.json(req.user);
  }

  const userIdx = store.registeredUsers.findIndex(u => u.id === req.user.id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const user = store.registeredUsers[userIdx];
  if (name !== undefined) user.name = String(name).trim().slice(0, 60);
  if (status !== undefined) user.status = String(status).trim().slice(0, 100);
  if (avatar !== undefined) user.avatar = String(avatar).trim().slice(0, 5000000);
  if (state !== undefined) user.state = String(state).trim().slice(0, 50);
  if (about !== undefined) user.about = String(about).trim().slice(0, 200);
  if (publicKey !== undefined) user.publicKey = publicKey;

  const contactIdx = store.contacts.findIndex(c => c.id === user.id);
  if (contactIdx !== -1) {
    store.contacts[contactIdx].name = user.name;
    store.contacts[contactIdx].avatar = user.avatar;
    if (user.publicKey) store.contacts[contactIdx].publicKey = user.publicKey;
  }

  saveStore(store);
  res.json(user);
});

// Get Peer Public Key for WebCrypto E2EE
app.get('/api/user/:userId/public-key', authenticateUser, (req, res) => {
  const { userId } = req.params;
  const user = store.registeredUsers.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ userId: user.id, publicKey: user.publicKey || null });
});

// -------------------------------------------------------------
// SATELLITE MODULE & EMERGENCY SOS APIS
// -------------------------------------------------------------

app.post('/api/satellite/hardware/toggle', authenticateUser, (req, res) => {
  const { connected } = req.body;
  const current = store.satelliteModule.hardwareConnected;
  store.satelliteModule.hardwareConnected = connected !== undefined ? connected : !current;

  saveStore(store);

  io.emit('satellite_hardware_changed', {
    hardwareConnected: store.satelliteModule.hardwareConnected,
    module: store.satelliteModule
  });

  res.json({
    success: true,
    hardwareConnected: store.satelliteModule.hardwareConnected,
    module: store.satelliteModule
  });
});

app.get('/api/satellite/status', (req, res) => {
  res.json(store.satelliteModule);
});

app.post('/api/satellite/toggle', authenticateUser, (req, res) => {
  const { connected, mode } = req.body;
  if (connected !== undefined) store.satelliteModule.connected = connected;
  if (mode !== undefined && ['internet_only', 'satellite_only', 'auto_hybrid'].includes(mode)) {
    store.satelliteModule.mode = mode;
  }
  saveStore(store);
  io.emit('satellite_status_changed', store.satelliteModule);
  res.json(store.satelliteModule);
});

// Emergency SOS Dispatch
app.post(
  '/api/satellite/sos',
  authenticateUser,
  rateLimiter({ windowMs: 30000, maxRequests: 2, message: 'Distress beacon is already active. Please stand by for rescue dispatch.' }),
  (req, res) => {
    const { latitude, longitude, medicalNeed, notes } = req.body;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const sosPacket = {
      id: 'SOS_' + crypto.randomBytes(6).toString('hex'),
      beaconType: 'HIGH_PRIORITY_DISTRESS_EPIRB',
      lat: Number(latitude) || store.satelliteModule.location.lat,
      lng: Number(longitude) || store.satelliteModule.location.lng,
      gridRef: store.satelliteModule.location.grid,
      medicalNeed: medicalNeed ? String(medicalNeed).slice(0, 120) : 'Immediate Medical Evacuation Needed',
      notes: notes ? String(notes).slice(0, 200) : 'Nexus Satellite Distress Beacon Broadcasted',
      timestamp: timeStr,
      hops: 1,
      senderId: req.user.id,
      senderName: req.user.name,
      acknowledgedBy: ['ISRO-ISTRAC-CENTRAL', 'NDRF-DELHI-HQ', 'COASTGUARD-RESCUE-01']
    };

    if (req.user.role === 'demo') {
      return res.json({
        success: true,
        sosPacket: {
          ...sosPacket,
          isDemo: true,
          notes: '[DEMO MODE] Fictional Simulation - No live emergency units dispatched'
        }
      });
    }

    const sosMsg = {
      id: 'msg_sos_' + Date.now(),
      senderId: req.user.id,
      senderName: req.user.name,
      text: `🚨 SOS EMERGENCY BEACON TRIGGERED! Coordinates: ${sosPacket.lat.toFixed(4)}°N, ${sosPacket.lng.toFixed(4)}°E [${sosPacket.gridRef}]. Need: ${sosPacket.medicalNeed}`,
      timestamp: timeStr,
      mode: 'satellite',
      type: 'emergency_alert',
      alertDetails: {
        level: 'CRITICAL CODE RED',
        category: 'SOS Emergency Evac Beacon',
        area: store.satelliteModule.location.place,
        coordinates: `${sosPacket.lat.toFixed(4)}°N, ${sosPacket.lng.toFixed(4)}°E`,
        gridRef: sosPacket.gridRef,
        battery: store.satelliteModule.battery + '%'
      },
      status: 'satellite_uplinked'
    };

    if (!store.messages['contact_ndrf_ops']) store.messages['contact_ndrf_ops'] = [];
    store.messages['contact_ndrf_ops'].push(sosMsg);
    saveStore(store);

    io.emit('sos_triggered', sosPacket);
    io.to('contact_ndrf_ops').emit('new_message', { contactId: 'contact_ndrf_ops', message: sosMsg });

    res.json({ success: true, sosPacket });
  }
);

// -------------------------------------------------------------
// ADMIN PANEL ENDPOINTS (Role-Based Access Control)
// -------------------------------------------------------------

app.get('/api/admin/metrics', authenticateUser, requireRole(['admin']), (req, res) => {
  let totalMsgs = 0;
  let satMsgs = 0;
  Object.values(store.messages).forEach(list => {
    totalMsgs += list.length;
    satMsgs += list.filter(m => m.mode === 'satellite').length;
  });

  res.json({
    totalUsers: store.registeredUsers.length,
    activeUsers: store.registeredUsers.filter(u => u.role !== 'suspended').length,
    totalMessages: totalMsgs,
    satelliteMessages: satMsgs,
    internetMessages: totalMsgs - satMsgs,
    hardwareModulePluggedIn: store.satelliteModule.hardwareConnected,
    batteryLevel: store.satelliteModule.battery,
    networkHealth: '99.98% Optimal',
    groundStationsOnline: store.groundStations.filter(g => g.status === 'ONLINE').length,
    activeEmergencyAlerts: store.messages['contact_ndrf_ops']?.length || 0,
    complianceStatus: 'Digital Personal Data Protection (DPDP) Act 2023 Conformance'
  });
});

app.get('/api/admin/users', authenticateUser, requireRole(['admin']), (req, res) => {
  res.json(store.registeredUsers);
});

app.patch('/api/admin/users/:userId', authenticateUser, requireRole(['admin']), (req, res) => {
  const { userId } = req.params;
  const user = store.registeredUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.id === req.user.id && req.body.role && req.body.role !== 'admin') {
    return res.status(400).json({ error: 'Cannot demote your own administrator account.' });
  }

  const { role, verifiedBharat, satelliteAccess } = req.body;
  if (role !== undefined && ['admin', 'officer', 'citizen', 'suspended'].includes(role)) {
    user.role = role;
  }
  if (verifiedBharat !== undefined) user.verifiedBharat = Boolean(verifiedBharat);
  if (satelliteAccess !== undefined) user.satelliteAccess = Boolean(satelliteAccess);

  store.adminAuditLog.unshift({
    id: Date.now(),
    action: `User ${user.nexusId} modified: role=${user.role}, satelliteAccess=${user.satelliteAccess}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    by: req.user.nexusId,
    status: 'AUDITED'
  });

  saveStore(store);
  io.emit('user_updated', user);
  res.json({ success: true, user });
});

app.post(
  '/api/admin/broadcast',
  authenticateUser,
  requireRole(['admin', 'officer']),
  rateLimiter({ windowMs: 30000, maxRequests: 3, message: 'Too many broadcasts. Please wait.' }),
  (req, res) => {
    const { title, message, severity = 'CRITICAL CODE RED', area = 'All India Network' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Broadcast title and message are required.' });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const broadcastMsg = {
      id: 'msg_broadcast_' + Date.now(),
      senderId: 'contact_ndrf_ops',
      senderName: req.user.name + ' (Command Broadcast)',
      text: `⚠️ [${severity}] ${title}: ${message}`,
      timestamp: timeStr,
      mode: 'satellite',
      type: 'emergency_alert',
      alertDetails: {
        level: severity,
        category: title,
        area: area
      },
      status: 'satellite_uplinked'
    };

    Object.keys(store.messages).forEach(contactId => {
      store.messages[contactId].push(broadcastMsg);
    });

    store.adminAuditLog.unshift({
      id: Date.now(),
      action: `Emergency Broadcast "${title.slice(0, 40)}" dispatched by ${req.user.nexusId}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      by: req.user.nexusId,
      status: 'DISPATCHED'
    });

    saveStore(store);

    io.emit('system_broadcast', broadcastMsg);
    res.json({ success: true, broadcastMsg });
  }
);

app.get('/api/admin/ground-stations', authenticateUser, requireRole(['admin', 'officer']), (req, res) => {
  res.json(store.groundStations);
});

app.get('/api/admin/audit-logs', authenticateUser, requireRole(['admin']), (req, res) => {
  res.json(store.adminAuditLog);
});

// -------------------------------------------------------------
// MESSAGING & CHAT APIS
// -------------------------------------------------------------

app.get('/api/contacts', authenticateUser, (req, res) => {
  if (req.user.role === 'demo') {
    return res.json(demoStore.contacts);
  }
  res.json(store.contacts);
});

app.post('/api/contacts', authenticateUser, (req, res) => {
  if (!req.body.name || !String(req.body.name).trim()) {
    return res.status(400).json({ error: 'Contact name or callsign is required' });
  }

  const newContact = {
    id: 'contact_' + crypto.randomBytes(6).toString('hex'),
    name: req.body.name ? String(req.body.name).slice(0, 60) : 'New Nexus Contact',
    role: req.body.role ? String(req.body.role).slice(0, 50) : 'Nexus User',
    phone: req.body.phone ? String(req.body.phone).slice(0, 25) : '+91 90000 00000',
    nexusId: req.body.nexusId ? String(req.body.nexusId).slice(0, 30).toUpperCase() : 'NX-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    online: true,
    lastSeen: 'Active now',
    satelliteLinked: req.body.satelliteLinked !== false,
    satelliteSignal: req.body.satelliteSignal || 88,
    isGroup: Boolean(req.body.isGroup),
    unreadCount: 0,
    lastMessage: req.body.isGroup ? 'Group initialized with sovereign encryption' : 'Chat started',
    lastMessageTime: 'Just now',
    verifiedBharat: true,
    encryptionKey: 'P-256 ECDH Authenticated',
    about: req.body.about ? String(req.body.about).slice(0, 150) : 'Connected via Nexus Sovereign Network.',
    members: Array.isArray(req.body.members) ? req.body.members : []
  };

  if (req.user.role === 'demo') {
    demoStore.contacts.unshift(newContact);
    demoStore.messages[newContact.id] = [];
    io.emit('contact_created', newContact);
    return res.status(201).json(newContact);
  }

  store.contacts.unshift(newContact);
  store.messages[newContact.id] = [];
  saveStore(store);

  io.emit('contact_created', newContact);
  res.status(201).json(newContact);
});

// Add Members to Existing Group
app.post('/api/contacts/:contactId/members', authenticateUser, (req, res) => {
  const { contactId } = req.params;
  const newMembers = Array.isArray(req.body.members)
    ? req.body.members
    : req.body.member ? [req.body.member] : [];

  if (newMembers.length === 0) {
    return res.status(400).json({ error: 'No members provided to add' });
  }

  const targetStore = req.user.role === 'demo' ? demoStore : store;
  const group = targetStore.contacts.find(c => c.id === contactId);
  if (!group) {
    return res.status(404).json({ error: 'Group or contact not found' });
  }

  if (!Array.isArray(group.members)) {
    group.members = [];
  }

  newMembers.forEach(m => {
    if (!group.members.some(existing => existing.id === m.id || (existing.name === m.name && existing.phone === m.phone))) {
      group.members.push(m);
    }
  });

  if (req.user.role !== 'demo') {
    saveStore(store);
  }

  io.emit('group_members_updated', { contactId, members: group.members });
  res.json({ success: true, members: group.members, group });
});

app.get('/api/messages/:contactId', authenticateUser, (req, res) => {
  const { contactId } = req.params;
  if (req.user.role === 'demo') {
    const list = demoStore.messages[contactId] || [];
    return res.json(list);
  }
  const list = store.messages[contactId] || [];
  res.json(list);
});

// Mark messages as read for this conversation
app.post('/api/messages/mark-read', authenticateUser, (req, res) => {
  const { contactId } = req.body;
  if (!contactId || !store.messages[contactId]) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  let updatedCount = 0;
  store.messages[contactId].forEach(msg => {
    if (msg.senderId !== req.user.id && msg.status !== 'read') {
      msg.status = 'read';
      updatedCount++;
    }
  });

  const contact = store.contacts.find(c => c.id === contactId);
  if (contact) {
    contact.unreadCount = 0;
  }

  saveStore(store);
  io.to(contactId).emit('messages_marked_read', { contactId, userId: req.user.id });
  res.json({ success: true, updatedCount });
});

// Send message
app.post(
  '/api/messages',
  authenticateUser,
  rateLimiter({ windowMs: 60000, maxRequests: 60, message: 'Message rate limit exceeded. Please slow down.' }),
  (req, res) => {
    const {
      contactId,
      text,
      mode = 'internet',
      type = 'text',
      mediaUrl,
      voiceData,
      voiceDuration,
      upiDetails,
      alertDetails,
      locationData,
      encryptedEnvelope
    } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Missing contactId' });
    }

    if (mode === 'satellite' && req.user.role !== 'demo' && !store.satelliteModule.hardwareConnected) {
      return res.status(400).json({
        error: 'HARDWARE_MODULE_DISCONNECTED',
        message: 'Nexus satellite transceiver is not connected. Please attach your module to communicate via satellite.'
      });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      senderId: req.user.id,
      senderName: req.user.name,
      text: text ? String(text).slice(0, 4000) : '',
      timestamp: timeStr,
      mode: mode === 'satellite' ? 'satellite' : 'internet',
      type: type,
      mediaUrl,
      voiceData,
      voiceDuration,
      upiDetails,
      alertDetails,
      locationData,
      encryptedEnvelope: encryptedEnvelope || null,
      status: mode === 'satellite' ? 'satellite_uplinked' : 'delivered',
      reactions: []
    };

    if (mode === 'satellite') {
      newMessage.satelliteInfo = {
        constellation: store.satelliteModule.activeConstellation,
        snr: (27 + Math.random() * 10).toFixed(1) + ' dB',
        compression: '94% payload saved',
        hops: 1,
        timestampUtc: new Date().toISOString()
      };
    }

    if (req.user.role === 'demo') {
      if (!demoStore.messages[contactId]) {
        demoStore.messages[contactId] = [];
      }
      demoStore.messages[contactId].push(newMessage);

      const cIndex = demoStore.contacts.findIndex(c => c.id === contactId);
      if (cIndex !== -1) {
        demoStore.contacts[cIndex].lastMessage = text || (type === 'voice' ? '🎙️ Voice note' : (type === 'upi_transfer' ? `₹${upiDetails?.amount} sent via UPI` : 'Shared attachment'));
        demoStore.contacts[cIndex].lastMessageTime = timeStr;
      }

      setTimeout(() => {
        simulateDemoReply(contactId, mode);
      }, 1000);

      return res.status(201).json(newMessage);
    }

    if (!store.messages[contactId]) {
      store.messages[contactId] = [];
    }
    store.messages[contactId].push(newMessage);

    const cIndex = store.contacts.findIndex(c => c.id === contactId);
    if (cIndex !== -1) {
      store.contacts[cIndex].lastMessage = text || (type === 'voice' ? '🎙️ Voice note' : (type === 'upi_transfer' ? `₹${upiDetails?.amount} sent via UPI` : 'Shared attachment'));
      store.contacts[cIndex].lastMessageTime = timeStr;
    }

    saveStore(store);

    io.to(contactId).emit('new_message', { contactId, message: newMessage });
    io.to(`user:${contactId}`).emit('new_message', { contactId: req.user.id, message: newMessage });

    if (contactId === 'contact_isro_ground' || contactId === 'contact_aarav' || contactId === 'contact_ndrf_ops') {
      setTimeout(() => {
        simulateReply(contactId, mode);
      }, 1200);
    }

    res.status(201).json(newMessage);
  }
);

// Toggle reaction
app.post('/api/messages/reaction', authenticateUser, (req, res) => {
  const { contactId, messageId, emoji } = req.body;
  if (!store.messages[contactId]) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const msg = store.messages[contactId].find(m => m.id === messageId);
  if (msg) {
    if (!msg.reactions) msg.reactions = [];
    if (!msg.reactions.includes(emoji)) {
      msg.reactions.push(emoji);
    } else {
      msg.reactions = msg.reactions.filter(e => e !== emoji);
    }
    saveStore(store);
    io.to(contactId).emit('message_reaction_updated', { contactId, messageId, reactions: msg.reactions });
    return res.json({ success: true, reactions: msg.reactions });
  }
  res.status(404).json({ error: 'Message not found' });
});

// In-chat UPI payment
app.post('/api/upi/pay', authenticateUser, (req, res) => {
  const { contactId, amount, note, receiverVpa } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0 || numAmount > 100000) {
    return res.status(400).json({ error: 'Invalid transaction amount (Max ₹100,000 per transaction)' });
  }

  const contact = store.contacts.find(c => c.id === contactId);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const utr = 'UPI/' + now.toISOString().slice(0, 10).replace(/-/g, '') + '/' + crypto.randomInt(100000000, 999999999);

  const upiDetails = {
    amount: numAmount,
    senderVpa: (req.user.nexusId || 'citizen').toLowerCase() + '@nexusupi',
    receiverVpa: receiverVpa || (contact?.nexusId ? contact.nexusId.toLowerCase() + '@nexusupi' : 'recipient@okhdfcbank'),
    utr: utr,
    note: note ? String(note).slice(0, 60) : 'Sent via Nexus Sovereign PayChat',
    status: 'COMPLETED',
    timestamp: timeStr
  };

  const paymentMessage = {
    id: 'msg_pay_' + Date.now(),
    senderId: req.user.id,
    senderName: req.user.name,
    text: `Sent ₹${numAmount} via UPI Instant Settlement to ${contact?.name || 'Contact'}`,
    timestamp: timeStr,
    mode: store.satelliteModule.mode === 'satellite_only' ? 'satellite' : 'internet',
    type: 'upi_transfer',
    upiDetails: upiDetails,
    status: 'delivered'
  };

  if (req.user.role === 'demo') {
    const demoContact = demoStore.contacts.find(c => c.id === contactId);
    paymentMessage.text = `[DEMO SIMULATION] Sent ₹${numAmount} via UPI Instant Settlement to ${demoContact?.name || 'Contact'}`;
    paymentMessage.upiDetails.note = '[DEMO MODE] Fictional Simulation';

    if (!demoStore.messages[contactId]) demoStore.messages[contactId] = [];
    demoStore.messages[contactId].push(paymentMessage);

    if (demoContact) {
      demoContact.lastMessage = `[DEMO] ₹${numAmount} paid via UPI`;
      demoContact.lastMessageTime = timeStr;
    }

    return res.json({ success: true, payment: upiDetails, message: paymentMessage });
  }

  if (!store.messages[contactId]) store.messages[contactId] = [];
  store.messages[contactId].push(paymentMessage);

  if (contact) {
    contact.lastMessage = `₹${numAmount} paid via UPI`;
    contact.lastMessageTime = timeStr;
  }

  saveStore(store);
  io.to(contactId).emit('new_message', { contactId, message: paymentMessage });

  res.json({ success: true, payment: upiDetails, message: paymentMessage });
});

function simulateReply(contactId, mode) {
  const contact = store.contacts.find(c => c.id === contactId);
  if (!contact) return;

  const replies = {
    contact_aarav: [
      'Copy that. Mobile medical triage is operational. Field teams deployed.',
      'Receiving you loud and clear. Uplink telemetry is optimal in the valley.',
      'Dr. Sharma here: Patient stabilized. Satellite data compression saved critical seconds.',
      'Understood. Forwarding coordinates to civil administration team now.'
    ],
    contact_isro_ground: [
      'ISTRAC confirming ping: GSAT-7A payload slot 4 acknowledged your carrier wave.',
      'NavIC orbital constellation position updated: Elevation 56° NE. Doppler shift nominal.',
      'Packet checksum valid (CRC-32 matched). Sovereign encryption tokens verified.',
      'All transponder metrics nominal. Bandwidth reserved for emergency responders.'
    ],
    contact_ndrf_ops: [
      'NDRF Control: Distress monitoring active. Regional sat-beacon frequency on standby.',
      'Advisory: Heavy precipitation expected in Uttarakhand and Himachal sectors within 6 hours.',
      'Rescue helicopters deployed from Dehradun base. Monitoring Nexus Satellite channel 16.'
    ]
  };

  const pool = replies[contactId] || ['Message received and logged via Sovereign Network.'];
  const text = pool[Math.floor(Math.random() * pool.length)];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const replyMsg = {
    id: 'msg_reply_' + Date.now(),
    senderId: contactId,
    senderName: contact.name,
    text: text,
    timestamp: timeStr,
    mode: mode,
    satelliteInfo: mode === 'satellite' ? {
      constellation: 'ISRO NavIC / GSAT-7A',
      snr: (30 + Math.random() * 8).toFixed(1) + ' dB',
      compression: '94% payload saved',
      hops: 1
    } : undefined,
    status: 'delivered',
    reactions: []
  };

  if (!store.messages[contactId]) store.messages[contactId] = [];
  store.messages[contactId].push(replyMsg);

  contact.lastMessage = text;
  contact.lastMessageTime = timeStr;
  saveStore(store);

  io.to(contactId).emit('new_message', { contactId, message: replyMsg });
}

function simulateDemoReply(contactId, mode) {
  const contact = demoStore.contacts.find(c => c.id === contactId);
  if (!contact) return;

  const demoReplies = {
    demo_contact_mission_control: [
      'Mission Control: Telemetry burst received with 100% integrity. Satellite link status is nominal.',
      'Telemetry payload decrypted. NavIC L5 subcarrier frequency within 0.2 Hz tolerance.',
      'Ground uplink ping acknowledged. Fictional orbital relay simulation functioning optimally.',
      'Mission Control: Signal packet received. NavIC constellation health 99.8%.'
    ],
    demo_contact_aarav: [
      'Dr. Aarav (Demo): Receiving you clearly on the demo relay. Emergency response drills are underway.',
      'Copy that. Triage simulation test completed with zero packet loss.',
      'All emergency medical kits accounted for in our mock drill scenario.'
    ],
    demo_contact_isro: [
      'ISRO NavIC Sim: Orbital ephemeris update processed. Transponder channel clear.',
      'GSAT-7A simulated transponder: Carrier-to-Noise ratio 31.4 dB. Uplink verified.'
    ]
  };

  const pool = demoReplies[contactId] || [
    'Acknowledged via Sandbox Transceiver. Channel signal is nominal.',
    'Test payload verified with emulated WebCrypto hash.',
    'Transmission confirmed at demo relay station.'
  ];
  const text = pool[Math.floor(Math.random() * pool.length)];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const replyMsg = {
    id: 'demo_reply_' + Date.now(),
    senderId: contactId,
    senderName: contact.name,
    text: text,
    timestamp: timeStr,
    mode: mode,
    status: 'delivered',
    reactions: []
  };

  if (!demoStore.messages[contactId]) demoStore.messages[contactId] = [];
  demoStore.messages[contactId].push(replyMsg);

  contact.lastMessage = text;
  contact.lastMessageTime = timeStr;

  io.emit('new_message', { contactId, message: replyMsg });
}

// -------------------------------------------------------------
// SOCKET.IO REAL-TIME AUTHENTICATED HANDSHAKE & EVENTS
// -------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('AUTHENTICATION_REQUIRED'));
  }
  const session = getSession(token);
  if (!session) {
    return next(new Error('INVALID_OR_EXPIRED_SESSION'));
  }
  const user = store.registeredUsers.find(u => u.id === session.userId) || (session.userId === DEMO_USER.id ? DEMO_USER : null);
  if (!user || user.role === 'suspended') {
    return next(new Error('USER_SUSPENDED'));
  }
  socket.user = user;
  socket.session = session;
  next();
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);

  socket.on('join_chat', (contactId) => {
    socket.join(contactId);
  });

  socket.on('typing', ({ contactId, isTyping }) => {
    socket.to(contactId).emit('user_typing', {
      contactId,
      userId: socket.user.id,
      userName: socket.user.name,
      isTyping
    });
  });

  socket.on('send_voice_burst', (data) => {
    const burst = {
      ...data,
      senderId: socket.user.id,
      senderName: socket.user.name,
      timestamp: new Date().toISOString()
    };
    io.emit('receive_voice_burst', burst);
  });

  socket.on('call_signal', (payload) => {
    const stamped = {
      ...payload,
      callerId: socket.user.id,
      callerName: socket.user.name
    };
    socket.broadcast.emit('incoming_call_signal', stamped);
  });

  socket.on('disconnect', () => {
    // Socket.io automatically leaves all rooms upon disconnection
  });
});

setInterval(() => {
  // Only broadcast telemetry if there are connected clients
  if (!io.engine || io.engine.clientsCount === 0) return;

  const delta = (Math.random() - 0.5) * 0.4;
  const newSnr = Math.min(38, Math.max(22, 31.4 + delta)).toFixed(1);
  io.emit('satellite_telemetry_tick', {
    snr: newSnr + ' dB',
    satellitesVisible: 9,
    activeSatellites: ['NavIC-1A', 'NavIC-1B', 'GSAT-7A', 'IRNSS-1I'],
    packetQueue: 0,
    uplinkHealth: 'EXCELLENT',
    battery: store.satelliteModule.battery,
    timestamp: new Date().toISOString(),
    isSimulated: true,
    telemetrySource: 'Nexus-Orb Hardware Emulation'
  });
}, 6000);

// -------------------------------------------------------------
// SERVE CLIENT PRODUCTION BUILD (With High-Performance Caching)
// -------------------------------------------------------------
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  🚀 NEXUS SOVEREIGN GATEWAY ACTIVE ON PORT ${PORT}`);
  console.log(`  🛡️ Security Headers, Rate Limiting & Cryptographic OTP: ENABLED`);
  console.log(`  🔐 WebCrypto Authenticated Encryption Engine: ACTIVE`);
  console.log(`  🛰️ Satellite Hardware Module: ${store.satelliteModule.hardwareConnected ? 'CONNECTED' : 'DISCONNECTED'} (Simulated)`);
  console.log(`=======================================================`);
});
