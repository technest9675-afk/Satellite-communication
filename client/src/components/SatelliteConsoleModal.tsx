import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, X, Compass, Zap, Shield, AlertTriangle, 
  Satellite, RefreshCw, Cpu, Activity, Signal, Battery, CheckCircle
} from 'lucide-react';
import { SatelliteModuleState } from '../types';
import { toggleSatelliteModule, dispatchSosBeacon } from '../services/api';
import { sounds } from '../services/soundEffects';

interface SatelliteConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  satelliteState: SatelliteModuleState | null;
  onUpdateState: (newState: SatelliteModuleState) => void;
}

export const SatelliteConsoleModal: React.FC<SatelliteConsoleModalProps> = ({
  isOpen,
  onClose,
  satelliteState,
  onUpdateState
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedSat, setSelectedSat] = useState<string>('NavIC-1A');
  const [sosSent, setSosSent] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [localMode, setLocalMode] = useState<'internet_only' | 'satellite_only' | 'auto_hybrid'>(
    satelliteState?.mode || 'auto_hybrid'
  );

  // Satellites for radar simulation
  const satellites = [
    { id: 'NavIC-1A', name: 'ISRO NavIC-1A (IRNSS)', dist: 0.35, angle: 45, snr: '34.2 dB', freq: '1176.45 MHz (L5)', status: 'LOCKED' },
    { id: 'NavIC-1B', name: 'ISRO NavIC-1B (IRNSS)', dist: 0.55, angle: 120, snr: '31.8 dB', freq: '2492.02 MHz (S-Band)', status: 'TRACKING' },
    { id: 'GSAT-7A', name: 'GSAT-7A (Rukmini Transponder)', dist: 0.75, angle: 210, snr: '36.5 dB', freq: 'Ku-Band Military/Civil', status: 'LOCKED' },
    { id: 'GSAT-7R', name: 'GSAT-7R Coastal Uplink', dist: 0.65, angle: 305, snr: '29.1 dB', freq: 'UHF Tactical Burst', status: 'STANDBY' },
    { id: 'Iridium-Next', name: 'Iridium-Next Interop 142', dist: 0.85, angle: 165, snr: '28.0 dB', freq: '1621.25 MHz L-Band', status: 'POLAR PASS' }
  ];

  // Draw Radar Canvas
  useEffect(() => {
    if (!isOpen) return;

    let animFrame: number;
    let angle = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      // Clear with dark tactical blue-black background
      ctx.fillStyle = '#060a10';
      ctx.fillRect(0, 0, width, height);

      // Draw concentric radar range rings
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();

        // Range labels
        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.fillText(`${i * 9000}km`, centerX + 4, centerY - (radius / 4) * i + 10);
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Cardinal direction letters
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('N', centerX - 4, centerY - radius + 12);
      ctx.fillText('S', centerX - 4, centerY + radius - 4);
      ctx.fillText('E', centerX + radius - 14, centerY + 4);
      ctx.fillText('W', centerX - radius + 4, centerY + 4);

      // Draw sweeping radar beam with gradient
      angle = (angle + 0.02) % (Math.PI * 2);

      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle - 0.35, angle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Leading beam line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Draw Satellites
      satellites.forEach(sat => {
        const rad = (sat.angle * Math.PI) / 180;
        const satR = radius * sat.dist;
        const sx = centerX + Math.cos(rad) * satR;
        const sy = centerY + Math.sin(rad) * satR;

        const isSelected = selectedSat === sat.id;

        // Satellite glow
        ctx.beginPath();
        ctx.arc(sx, sy, isSelected ? 8 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#38bdf8' : '#10b981';
        ctx.shadowColor = isSelected ? '#38bdf8' : '#10b981';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Satellite ring if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Sat label
        ctx.fillStyle = isSelected ? '#f8fafc' : '#94a3b8';
        ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
        ctx.fillText(sat.id, sx + 8, sy - 4);
      });

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isOpen, selectedSat]);

  if (!isOpen) return null;

  const handleModeChange = async (mode: 'internet_only' | 'satellite_only' | 'auto_hybrid') => {
    setLocalMode(mode);
    try {
      const updated = await toggleSatelliteModule(true, mode);
      onUpdateState(updated);
      sounds.playSatelliteChirp();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerSos = async () => {
    setIsTransmitting(true);
    sounds.playSosAlert();
    try {
      await dispatchSosBeacon({
        medicalNeed: 'Medical Evacuation & Emergency Satellite Uplink',
        notes: 'High-Priority Distress Beacon Broadcasted from Nexus Handheld'
      });
      setSosSent(true);
      setTimeout(() => {
        setIsTransmitting(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsTransmitting(false);
    }
  };

  const currentSatObj = satellites.find(s => s.id === selectedSat) || satellites[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0b121c] border border-sky-500/30 rounded-2xl w-full max-w-[390px] max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl sat-glow">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0e1724] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Satellite className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-bold text-sm text-white truncate">
                  Nexus-Orb Satellite Hub
                </h2>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 shrink-0 font-mono">
                  NavIC / GSAT-7A
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Off-Grid Satellite Transceiver Emulation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* Top Diagnostic Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#121c2a] p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                <Signal className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-mono truncate">Signal Quality</p>
                <p className="text-xs font-bold text-sky-300 truncate">
                  {satelliteState?.signalStrength || 92}% (34.2 dB)
                </p>
              </div>
            </div>

            <div className="bg-[#121c2a] p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Battery className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-mono truncate">Module Battery</p>
                <p className="text-xs font-bold text-emerald-300 truncate">
                  {satelliteState?.battery || 89}% (14h Active)
                </p>
              </div>
            </div>

            <div className="bg-[#121c2a] p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-mono truncate">Antenna Aim</p>
                <p className="text-xs font-bold text-amber-300 truncate">
                  Az: 128° • El: 54°
                </p>
              </div>
            </div>

            <div className="bg-[#121c2a] p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-mono truncate">Compression</p>
                <p className="text-xs font-bold text-purple-300 truncate">
                  94% Saved
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Radar & Tracking Section */}
          <div className="flex flex-col gap-3">
            {/* Canvas Radar Visualizer */}
            <div className="flex flex-col items-center bg-[#070b12] p-3 rounded-2xl border border-slate-800 relative">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-sky-400 flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
                  <span className="truncate">LIVE ORBITAL RADAR (ISRO NavIC)</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400 shrink-0 ml-1">
                  28.6°N • 77.2°E
                </span>
              </div>

              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="w-[220px] h-[220px] aspect-square rounded-full shadow-inner border border-sky-950 mx-auto"
              />

              <div className="flex items-center space-x-1.5 mt-2.5 overflow-x-auto w-full justify-center no-scrollbar">
                {satellites.map(sat => (
                  <button
                    key={sat.id}
                    onClick={() => setSelectedSat(sat.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all shrink-0 ${
                      selectedSat === sat.id
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sat.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Satellite Pass Telemetry */}
            <div className="bg-[#0e1622] p-3 rounded-2xl border border-slate-800 space-y-2.5">
              <h3 className="font-bold text-xs text-white flex items-center justify-between">
                <span>Selected Transponder</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  {currentSatObj.status}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Constellation ID</p>
                  <p className="font-semibold text-sky-300 truncate">{currentSatObj.name}</p>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Frequency</p>
                  <p className="font-semibold text-slate-200 truncate">{currentSatObj.freq}</p>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">SNR</p>
                  <p className="font-bold text-emerald-400">{currentSatObj.snr}</p>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Bitrate</p>
                  <p className="font-bold text-white">2.4 kbps</p>
                </div>
              </div>

              <div className="p-2.5 bg-sky-950/40 rounded-xl border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed">
                <span className="font-bold">Antenna Tip:</span> Aim external module towards south-east horizon at 54° elevation angle.
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#0e1622] p-3 rounded-2xl border border-slate-800 space-y-2.5">
            <h3 className="font-bold text-xs text-white">
              Transmission Routing Policy
            </h3>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleModeChange('auto_hybrid')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  localMode === 'auto_hybrid'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${localMode === 'auto_hybrid' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="font-bold text-xs text-white">Auto Hybrid (Recommended)</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-4">
                  Prioritizes 5G / Fiber; instantly falls back to Satellite module if off-grid.
                </p>
              </button>

              <button
                onClick={() => handleModeChange('satellite_only')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  localMode === 'satellite_only'
                    ? 'bg-sky-500/20 border-sky-500/50 text-white sat-glow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${localMode === 'satellite_only' ? 'bg-sky-400' : 'bg-slate-600'}`} />
                  <span className="font-bold text-xs text-white">Pure Satellite Only</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-4">
                  Zero internet required. 100% data compressed & beamed directly to NavIC/GSAT.
                </p>
              </button>

              <button
                onClick={() => handleModeChange('internet_only')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  localMode === 'internet_only'
                    ? 'bg-teal-500/20 border-teal-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${localMode === 'internet_only' ? 'bg-teal-400' : 'bg-slate-600'}`} />
                  <span className="font-bold text-xs text-white">Standard Internet Only</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-4">
                  Uses Wi-Fi and Cellular broadband only. Satellite radio powers down.
                </p>
              </button>
            </div>
          </div>

          {/* Emergency SOS Distress Beacon */}
          <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 p-3 rounded-2xl border border-rose-500/50 flex flex-col gap-2.5">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-rose-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                <span>One-Touch Emergency SOS Distress Uplink</span>
              </h3>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                Broadcasts an emergency EPIRB beacon with your sovereign GPS coordinates to NDRF Disaster Control and local military rescue responders via NavIC emergency channel.
              </p>
            </div>

            <button
              onClick={handleTriggerSos}
              disabled={isTransmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all flex items-center justify-center space-x-2 shrink-0 ${
                sosSent
                  ? 'bg-emerald-600 border border-emerald-400'
                  : 'bg-rose-600 hover:bg-rose-500 active:scale-95 shadow-rose-900/50 animate-pulse'
              }`}
            >
              {isTransmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uplinking SOS...</span>
                </>
              ) : sosSent ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>SOS Acknowledged</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Broadcast SOS Beacon</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2.5 bg-[#0e1622] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 gap-2">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate text-[11px] font-mono text-slate-300">NX-SAT-9912 (Active)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors shrink-0"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
