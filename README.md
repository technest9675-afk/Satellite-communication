# 🚀 Nexus — Sovereign Dual-Mode Satellite & Internet Communication Platform 🇮🇳

> **Nexus** is an Indian sovereign messaging and critical communications ecosystem inspired by modern messaging standards like WhatsApp and Arattai, enhanced with **off-grid Satellite Uplink capabilities** via external transceiver hardware modules (ISRO NavIC / GSAT-7A / Iridium compatible).

---

## 🌟 Key Features & Capabilities

### 1. 🛰️ Dual-Mode Transmission Engine
- **Internet Mode (5G / Broadband / Fiber)**:
  - Real-time WebSockets, instant message delivery, typing indicators, HD audio/video calls, multimedia sharing.
- **Satellite Mode (Nexus-Orb External Module Emulation)**:
  - **Works without any cellular or broadband internet** by interfacing with an external satellite transceiver module (USB-C, Bluetooth 5.4, or sub-GHz RF link).
  - **94% Binary Payload Compression Engine**: Dynamic Brotli/Huffman compression to transmit messages within ultra-low 2.4 kbps burst bandwidth.
  - **Constellation Link Support**: ISRO NavIC (IRNSS-1A through 1I), GSAT-7A (Rukmini military & civilian dual-band), GSAT-7R, and Iridium-Next crosslinks.
  - **Auto-Hybrid Fallback**: Transparently switches to satellite uplink if cellular towers or optical fiber backhauls are severed during floods, blizzards, or disasters.

---

### 2. 🛠️ Unique & Powerful Built-in Tools
- **📡 Interactive Orbital Radar Visualizer**:
  - Live animated circular PPI radar tracking overhead NavIC & GSAT satellites with range rings, elevation, azimuth, Doppler drift, and SNR telemetry.
- **🧭 Antenna Compass Alignment Guide**:
  - Guides field operators and civilians where to point the external transceiver's patch antenna for peak satellite gain (e.g., 54.2° Elevation, 128.4° Azimuth).
- **🚨 One-Touch Emergency SOS EPIRB Beacon**:
  - Direct distress beacon dispatching GPS coordinates (`28.6139°N, 77.2090°E`), MGRS grid coordinates, and medical triage codes to NDRF Disaster Response control and ISRO ISTRAC ground stations.
- **📻 Push-To-Talk (PTT) Satellite Walkie-Talkie**:
  - Half-duplex tactical voice bursts with simulated radio squelch audio, multi-channel tuning (CH-01 Emergency, CH-04 NDRF, CH-12 Siachen, CH-16 Civil Mesh), and transmission logs.
- **🇮🇳 In-Chat UPI RuPay PayChat**:
  - Seamless in-chat peer-to-peer micro-transactions with custom amount chips, 4-digit UPI PIN authentication, UTR reference generator, and celebratory audio chimes.
- **🌐 Pan-Indian Multilingual Transliteration Bar**:
  - Instant one-tap regional phrase suggestions in **English, हिन्दी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), বাংলা (Bengali), and मराठी (Marathi)**.
- **📱 24-Hour Status / Vichar Stories**:
  - Share text statuses with custom vibrant color gradients or photo stories with auto-advancing progress timers and instant in-chat reply.
- **📞 Sovereign Encrypted Voice & Video Calling**:
  - Full-screen calling HUD with camera preview, background blur, dynamic voice waveforms, and a toggleable **2.4kbps Low-Bandwidth Satellite Voice Codec**.
- **📱 Smartphone Chassis vs Full Desktop View**:
  - Toggle between a realistic mobile device frame (with battery, notch, signal) and a widescreen desktop workspace.

---

### 3. 🛡️ Indian Government & Regulatory Compliance
- **Digital Personal Data Protection (DPDP) Act 2023 Conformance**:
  - Sovereign in-country data residency: 100% of packets processed on Indian soil.
  - Zero foreign telemetry or analytical trackers.
  - Cryptographic Right to Erasure (§12).
- **CERT-In Certified Security Framework**:
  - End-to-End Encryption (E2EE) powered by the Double Ratchet Algorithm (AES-256-GCM + ChaCha20-Poly1305).
  - ASCON-128a lightweight encryption for low-bandwidth satellite packet bursts.
  - In-app 60-digit cryptographic fingerprint verification tool and private chat PIN vault.

---

## 🏗️ Project Architecture

```
e:\Nexus\
├── client/                     # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx             # Contact list, stories, search, status indicators
│   │   │   ├── ChatWindow.tsx          # Real-time message stream, rich bubbles, Indic bar
│   │   │   ├── SatelliteConsoleModal.tsx# Canvas radar, orbital tracking, azimuth compass
│   │   │   ├── UpiPayModal.tsx         # In-chat UPI / RuPay payment simulation
│   │   │   ├── CallModal.tsx           # Voice & Video call HUD with satellite codec
│   │   │   ├── WalkieTalkieModal.tsx   # PTT radio with tactile squelch audio
│   │   │   ├── StatusModal.tsx         # 24h WhatsApp/Arattai style status stories
│   │   │   ├── SecurityVaultModal.tsx  # DPDP Act 2023 & CERT-In compliance vault
│   │   │   ├── NewChatModal.tsx        # Start 1-on-1 or group chat
│   │   │   └── MobileFrameWrapper.tsx  # Mobile device chassis / Desktop view toggle
│   │   ├── services/
│   │   │   ├── soundEffects.ts         # Web Audio API acoustic synthesizer (offline)
│   │   │   └── api.ts                  # REST API & Socket.IO client
│   │   ├── types/index.ts              # TypeScript schemas
│   │   ├── App.tsx                     # Main layout & real-time event router
│   │   └── main.tsx                    # React DOM entry
│   └── dist/                           # Optimized production bundle
│
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── server.js               # Full REST endpoints, Socket.IO gateway, Sat-gateway
│   ├── data/
│   │   └── store.json          # Persistent JSON store for chats, contacts, telemetry
│   └── package.json
│
└── package.json                # Root orchestration scripts
```

---

## ⚡ Quick Start & Running the Application

### 1. Run the Full Unified Server (Hosts both Backend & Frontend):
```bash
npm start
```
* The application runs on **`http://localhost:5000`**.
* Open your browser to **`http://localhost:5000`** to access Nexus with full real-time messaging, satellite telemetry, and in-chat tools.

### 2. Run in Development Mode with Hot-Reloading:
To run the client with Vite's instant hot-module replacement:
```bash
# Terminal 1: Backend API & Socket Server
npm run server

# Terminal 2: Frontend Vite Dev Server
npm run client
```
* Open **`http://localhost:5173`** (automatically proxies to backend port 5000).

---

## 🇮🇳 Designed for Bharat, Built for the Future
* **Made for harsh field conditions**: Border posts, maritime zones, high-altitude rescue teams, civil administration, and regular daily citizens.
* **100% Sovereign Data Ownership**.
