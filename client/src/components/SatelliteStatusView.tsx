import React, { useState, useEffect } from 'react';
import { SatelliteModuleState } from '../types';
import { sounds } from '../services/soundEffects';
import { NexusLogo } from './NexusLogo';

interface SatelliteStatusViewProps {
  satelliteState: SatelliteModuleState | null;
  onUpdateState: (state: SatelliteModuleState) => void;
  onOpenSos: () => void;
  onOpenAdvancedConsole: () => void;
}

export const SatelliteStatusView: React.FC<SatelliteStatusViewProps> = ({
  satelliteState,
  onUpdateState,
  onOpenSos,
  onOpenAdvancedConsole
}) => {
  const [connectionMode, setConnectionMode] = useState<'auto' | 'satellite_only'>('auto');
  const [azimuthAngle, setAzimuthAngle] = useState(45);

  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isHardwareConnected = Boolean(satelliteState?.hardwareConnected);
  const battery = satelliteState?.battery;
  const isConnected = isHardwareConnected;

  const handleToggleMode = (mode: 'auto' | 'satellite_only') => {
    setConnectionMode(mode);
    sounds.playSatelliteChirp();
    if (satelliteState) {
      onUpdateState({
        ...satelliteState,
        mode: mode === 'auto' ? 'auto_hybrid' : 'satellite_only'
      });
    }
  };

  const handleNudgeAlignment = () => {
    setAzimuthAngle((prev) => (prev + 15) % 360);
    sounds.playRadioSquelch();
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-surface select-none overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <header className="sticky top-0 w-full z-40 pt-safe bg-surface-dim/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-sm flex-shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20 shrink-0">
                  ORBITAL
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">Satellite &amp; Mesh Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSos}
              aria-label="Emergency SOS"
              className="h-9 px-2.5 flex items-center gap-1 rounded-lg bg-error-container text-error hover:bg-error hover:text-on-error active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base animate-pulse">e911_emergency</span>
              <span className="font-mono text-[10px] font-bold tracking-wider">SOS</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdvancedConsole}
              title="Advanced Orbital Radar Console"
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">radar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stream */}
      <main className="flex-1 w-full px-4 py-4 space-y-4 pb-8">
        {/* Simulation Notice Banner */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
            <span className="material-symbols-outlined text-sky-400 text-sm shrink-0">info</span>
            <span className="text-[11px] truncate">Orbital azimuth &amp; SNR generated via demo emulation model.</span>
          </div>
          <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded shrink-0">
            ISRO NavIC L5
          </span>
        </div>

        {/* Top Grid: Connection Status & Sky Alignment */}
        <div className="flex flex-col gap-3.5">
          {/* Unified Connection Status Card */}
          <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-high shadow-md space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-2xl">
                      {isOnline || isConnected ? 'cloud_done' : 'cloud_off'}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-on-surface">
                      {isConnected && isOnline
                        ? 'Dual-Path Uplink Ready'
                        : isConnected
                        ? 'Satellite Only Uplink'
                        : isOnline
                        ? 'Terrestrial Broadband Ready'
                        : 'Offline Standby'}
                    </h2>
                    <p className="text-[11px] text-on-surface-variant">
                      {isConnected && isOnline
                        ? 'Hybrid satellite & broadband active'
                        : isConnected
                        ? 'Direct NavIC satellite channel'
                        : isOnline
                        ? 'Cellular / Wi-Fi route active'
                        : 'Local peer-to-peer mesh standby'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <span className={`w-2 h-2 rounded-full ${
                    isOnline || isConnected ? 'bg-primary animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span className="font-mono text-[10px] text-primary font-bold tracking-wider">
                    {isConnected && isOnline ? 'HYBRID' : isConnected ? 'SAT-ONLY' : isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${isOnline ? 'text-primary' : 'text-outline'}`}>
                    {isOnline ? 'wifi' : 'wifi_off'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">Broadband</p>
                    <p className="text-xs text-on-surface font-medium truncate">{isOnline ? '5G / Wi-Fi Active' : 'Offline'}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${isConnected ? 'text-secondary' : 'text-outline'}`}>
                    satellite_alt
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">Satellite</p>
                    <p className="text-xs text-on-surface font-medium truncate">
                      {isConnected
                        ? `Ready (${battery != null ? `${battery}% Bat` : 'External'})`
                        : 'Module Detached'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs text-on-surface-variant flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-primary text-base shrink-0">security</span>
              <span className="text-[11px] truncate">WebCrypto P-256 ECDH + AES-256-GCM authenticated</span>
            </div>
          </div>

          {/* Sky Alignment Helper Card */}
          <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-high shadow-md flex flex-col items-center text-center space-y-3">
            <div className="w-full flex items-center justify-between">
              <h3 className="font-semibold text-sm text-on-surface">Sky Alignment</h3>
              <span className="font-mono text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                Locked
              </span>
            </div>

            <div
              onClick={handleNudgeAlignment}
              title="Tap to calibrate antenna azimuth"
              className="relative w-32 h-32 rounded-full border border-primary/20 bg-surface-container-low flex items-center justify-center my-1 cursor-pointer group"
            >
              <div className="w-22 h-22 rounded-full border border-primary/40 bg-primary/5 flex items-center justify-center">
                <div
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-sm transition-transform duration-500"
                  style={{ transform: `rotate(${azimuthAngle}deg)` }}
                >
                  <span className="material-symbols-outlined text-2xl">navigation</span>
                </div>
              </div>
              <span className="absolute top-2 font-mono text-[10px] text-on-surface-variant font-bold">N</span>
              <span className="absolute top-3 left-6 w-2 h-2 rounded-full bg-primary animate-ping" />
            </div>

            <div>
              <p className="text-xs font-semibold text-on-surface">Locked to NavIC L5 (Orbital Sector 7)</p>
              <p className="font-mono text-[11px] text-on-surface-variant mt-0.5">Simulated SNR: 24dB • Azimuth: {azimuthAngle}°</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Connection Mode & Monthly Usage */}
        <div className="flex flex-col gap-3.5">
          {/* Effortless Connection Mode Card */}
          <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-high shadow-md space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-sm text-on-surface">Connection Mode</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Automatic intelligent switching is active</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container-low border border-surface-container-high/60 my-2">
              <button
                type="button"
                onClick={() => handleToggleMode('auto')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  connectionMode === 'auto'
                    ? 'bg-surface-container-high text-on-surface shadow-sm border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base text-primary">autorenew</span>
                <span>Smart Auto-Switch</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMode('satellite_only')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  connectionMode === 'satellite_only'
                    ? 'bg-surface-container-high text-secondary shadow-sm border border-secondary/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base text-secondary">satellite</span>
                <span>Satellite Only</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Automatically uses cellular or Wi-Fi, switching to satellite instantly when terrestrial signal drops.
            </p>
          </div>

          {/* Streamlined Monthly Usage Card */}
          <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-high shadow-md space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-on-surface">Monthly Data Quota</h3>
                <span className="font-mono text-[10px] text-on-surface-variant">Resets in 11 days</span>
              </div>

              <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border border-surface-container-high/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">sms</span>
                    Satellite Messages
                  </span>
                  <span className="font-mono font-semibold text-on-surface">840 / 1,000</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: '84%' }} />
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                  <span>160 remaining</span>
                  <span className="text-primary font-semibold">84%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 text-on-surface-variant pt-2">
              <span className="material-symbols-outlined text-base text-primary">verified_user</span>
              <p className="text-xs">Emergency SOS is always free &amp; unthrottled.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
