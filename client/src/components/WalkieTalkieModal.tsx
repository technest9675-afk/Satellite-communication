import React, { useState, useRef } from 'react';
import { Radio, X, Volume2, Shield, Activity, Users, Mic } from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface WalkieTalkieModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalkieTalkieModal: React.FC<WalkieTalkieModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedChannel, setSelectedChannel] = useState('CH-04 (NDRF Search & Rescue)');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [txDuration, setTxDuration] = useState(0);
  const [recentTransmissions, setRecentTransmissions] = useState([
    { id: 1, callsign: 'RESCUE-LEAD-7', time: '18:31', channel: 'CH-04', duration: '4s' },
    { id: 2, callsign: 'NAVIC-ORBIT-2', time: '18:14', channel: 'CH-04', duration: '6s' },
    { id: 3, callsign: 'HIMALAYA-SENTINEL', time: '17:50', channel: 'CH-12', duration: '3s' }
  ]);

  const timerRef = useRef<any>(null);

  if (!isOpen) return null;

  const channels = [
    { id: 'CH-01', name: 'CH-01 (National Disaster Primary 🚨)', freq: '1420.45 MHz' },
    { id: 'CH-04', name: 'CH-04 (NDRF Search & Rescue 🏔️)', freq: '1422.10 MHz' },
    { id: 'CH-08', name: 'CH-08 (Maritime & Coast Guard ⚓)', freq: '1425.80 MHz' },
    { id: 'CH-12', name: 'CH-12 (Himalayan Siachen Sentinel ❄️)', freq: '1428.30 MHz' },
    { id: 'CH-16', name: 'CH-16 (ISRO NavIC Civil Mesh 🛰️)', freq: '1432.00 MHz' }
  ];

  const startTransmitting = () => {
    setIsTransmitting(true);
    setTxDuration(0);
    sounds.playPttSquelch(true);
    timerRef.current = setInterval(() => {
      setTxDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTransmitting = () => {
    if (!isTransmitting) return;
    setIsTransmitting(false);
    clearInterval(timerRef.current);
    sounds.playPttSquelch(false);

    // Add to recent
    setRecentTransmissions(prev => [
      {
        id: Date.now(),
        callsign: 'NEXUS-ALPHA-1 (You)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: selectedChannel.slice(0, 5),
        duration: Math.max(1, txDuration) + 's'
      },
      ...prev.slice(0, 5)
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0b121a] border border-amber-500/40 rounded-3xl w-full max-w-[390px] max-h-[92dvh] overflow-y-auto no-scrollbar shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#101824] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <span>Satellite Walkie-Talkie (PTT)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  S-Band Sub-GHz
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Half-Duplex Instant Radio Burst</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="p-4 bg-[#080d14] border-b border-slate-800/80">
          <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1.5">
            Select Active Transponder Channel
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full bg-[#131b26] text-xs font-semibold text-amber-400 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            {channels.map(ch => (
              <option key={ch.id} value={ch.name}>
                {ch.name} — {ch.freq}
              </option>
            ))}
          </select>
        </div>

        {/* Big PTT Tactical Center */}
        <div className="p-8 flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-[#0b121a] to-[#070b12]">
          {/* Signal Indicator */}
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <span>SWR: 1.1:1 (TUNED)</span>
            <span>•</span>
            <span className="text-emerald-400">RSSI: -64 dBm</span>
          </div>

          {/* Large PTT Button */}
          <div className="relative">
            {isTransmitting && (
              <div className="absolute -inset-6 rounded-full bg-amber-500/30 blur-2xl animate-ping" />
            )}
            <button
              onMouseDown={startTransmitting}
              onMouseUp={stopTransmitting}
              onTouchStart={startTransmitting}
              onTouchEnd={stopTransmitting}
              onTouchCancel={stopTransmitting}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all select-none shadow-2xl relative z-10 border-4 active:scale-95 ${
                isTransmitting
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-400 border-white text-slate-950 scale-105'
                  : 'bg-gradient-to-tr from-slate-800 to-slate-700 border-amber-500/40 text-slate-200 hover:border-amber-400'
              }`}
            >
              <Mic className={`w-12 h-12 mb-2 ${isTransmitting ? 'text-slate-950 animate-bounce' : 'text-amber-400'}`} />
              <span className="font-extrabold text-sm uppercase tracking-wider text-center">
                {isTransmitting ? 'TRANSMITTING' : 'HOLD TO TALK'}
              </span>
              <span className="text-[10px] opacity-80 mt-1 font-mono">
                {isTransmitting ? `BURST: 0:0${txDuration}s` : 'Push-To-Talk'}
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center max-w-xs">
            Press and hold down the button while speaking. Your voice will be compressed into a high-priority 2.4kbps satellite RF burst.
          </p>
        </div>

        {/* Recent Burst Transmissions */}
        <div className="p-4 bg-[#0e1622] border-t border-slate-800">
          <h4 className="text-[11px] font-bold text-slate-300 uppercase font-mono mb-2 flex items-center justify-between">
            <span>Recent Satellite Voice Bursts</span>
            <Users className="w-3.5 h-3.5 text-slate-500" />
          </h4>

          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {recentTransmissions.map(tx => (
              <div
                key={tx.id}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-bold">{tx.callsign}</span>
                  <span className="text-[10px] text-slate-500">[{tx.channel}]</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  <span>{tx.duration}</span>
                  <span>{tx.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
