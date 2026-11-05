import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Usb } from 'lucide-react';
import { SatelliteModuleState } from '../types';
import { toggleHardwareModule } from '../services/api';
import { sounds } from '../services/soundEffects';

interface HardwareModuleBannerProps {
  satelliteState: SatelliteModuleState | null;
  onUpdateState: (newState: SatelliteModuleState) => void;
  onOpenConsole: () => void;
}

export const HardwareModuleBanner: React.FC<HardwareModuleBannerProps> = ({
  satelliteState,
  onUpdateState,
  onOpenConsole
}) => {
  const [connecting, setConnecting] = useState(false);
  const [showHandshakeModal, setShowHandshakeModal] = useState(false);
  const isConnected = satelliteState?.hardwareConnected ?? true;

  const handleToggleHardware = async () => {
    setConnecting(true);
    setShowHandshakeModal(true);

    try {
      setTimeout(async () => {
        const nextState = !isConnected;
        const res = await toggleHardwareModule(nextState);
        onUpdateState(res.module);
        setConnecting(false);
        if (nextState) {
          sounds.playSatelliteChirp();
        } else {
          sounds.playPttSquelch(false);
        }
        setTimeout(() => setShowHandshakeModal(false), 800);
      }, 1000);
    } catch (e) {
      console.error(e);
      setConnecting(false);
      setShowHandshakeModal(false);
    }
  };

  return (
    <>
      {/* Slim Top Hardware Bar */}
      <div className={`px-3 py-1.5 flex items-center justify-between text-xs transition-colors border-b shrink-0 ${
        isConnected
          ? 'bg-sky-950/40 border-sky-800/40 text-sky-300'
          : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
      }`}>
        <div className="flex items-center space-x-2 truncate">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping flex-shrink-0" />
              <span className="truncate text-[11px] font-medium flex items-center gap-1.5">
                <span>Nexus-Orb Module Connected</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-200 text-[9px] font-mono font-semibold uppercase">
                  Simulated NavIC L5
                </span>
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate text-[11px] font-medium text-amber-300">
                Satellite Transceiver Disconnected (Operating in terrestrial cellular mode)
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleToggleHardware}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all flex items-center space-x-1 ${
              isConnected
                ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow'
            }`}
          >
            <Usb className="w-3 h-3" />
            <span>{isConnected ? 'Disconnect' : 'Plug In Module'}</span>
          </button>

          {isConnected && (
            <button
              onClick={onOpenConsole}
              title="Open Satellite Diagnostics Radar"
              className="text-[10px] font-mono text-sky-400 hover:underline hidden sm:inline"
            >
              Radar &amp; Compass →
            </button>
          )}
        </div>
      </div>

      {/* Hardware Handshake Simulation Modal */}
      {showHandshakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b121c] border border-sky-500/40 rounded-2xl p-6 max-w-[390px] w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
              {connecting ? (
                <RefreshCw className="w-7 h-7 animate-spin" />
              ) : isConnected ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <Usb className="w-7 h-7" />
              )}
            </div>

            <div>
              <h4 className="font-bold text-base text-white">
                {connecting
                  ? 'Establishing USB-C Serial Handshake...'
                  : isConnected
                  ? 'Nexus-Orb Module Locked'
                  : 'Module Disconnected'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {connecting
                  ? 'Testing sub-GHz RF transceiver & ISRO NavIC carrier emulation'
                  : isConnected
                  ? 'Ready for simulated off-grid satellite burst communications'
                  : 'Switched back to terrestrial network mode'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
