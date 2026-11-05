import React, { useState, useEffect } from 'react';
import { SatelliteModuleState } from '../types';

interface MobileFrameWrapperProps {
  isMobileFrame?: boolean;
  onToggleFrame?: () => void;
  satelliteState?: SatelliteModuleState | null;
  children: React.ReactNode;
}

export const MobileFrameWrapper: React.FC<MobileFrameWrapperProps> = ({
  satelliteState,
  children
}) => {
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formatted = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}`;
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isSatActive = satelliteState?.mode === 'satellite_only' || satelliteState?.hardwareConnected;

  return (
    <div className="w-full h-full min-h-[100dvh] bg-[#070b12] flex items-center justify-center select-none overflow-hidden p-0 sm:p-3">
      {/* Sovereign Phone Frame Container (Strict 390x844 Dimension) */}
      <div className="relative w-full max-w-[390px] h-full h-[100dvh] sm:h-[844px] sm:max-h-[92vh] bg-surface text-on-surface flex flex-col overflow-hidden sm:rounded-[48px] sm:border-[8px] sm:border-[#141d2b] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(0,229,163,0.08)] ring-1 ring-white/10">
        
        {/* iOS/Android Style Phone Status Bar */}
        <div className="w-full h-11 px-6 pt-2 pb-1 bg-surface-dim/95 backdrop-blur-md flex items-center justify-between text-xs z-50 shrink-0 border-b border-surface-container-high/40">
          {/* Time & Carrier */}
          <div className="flex items-center gap-1.5 min-w-[70px]">
            <span className="font-semibold text-xs text-on-surface tracking-tight">{currentTime}</span>
            <span className="text-[10px] text-primary/80 font-mono hidden min-[360px]:inline">NEXUS</span>
          </div>

          {/* Dynamic Island / Camera Notch */}
          <div className="w-24 h-5 bg-black rounded-full shadow-inner flex items-center justify-between px-2.5 shrink-0 mx-auto">
            <span className="w-2 h-2 rounded-full bg-[#111927] border border-slate-800" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] font-mono text-primary font-bold">ISRO</span>
            </div>
          </div>

          {/* Telemetry & Battery Indicator */}
          <div className="flex items-center gap-1.5 min-w-[70px] justify-end text-on-surface-variant">
            {isSatActive ? (
              <span className="flex items-center text-[10px] font-mono text-primary font-bold gap-0.5" title="NavIC Satellite Uplink">
                <span className="material-symbols-outlined text-[12px]">satellite_alt</span>
                <span>SAT</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-on-surface-variant font-semibold">5G</span>
            )}

            {/* Signal Strength */}
            <div className="flex items-end gap-[1.5px] h-2.5">
              <span className="w-[2px] h-1 bg-primary rounded-full" />
              <span className="w-[2px] h-1.5 bg-primary rounded-full" />
              <span className="w-[2px] h-2 bg-primary rounded-full" />
              <span className="w-[2px] h-2.5 bg-primary rounded-full" />
            </div>

            {/* Battery */}
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono text-on-surface font-medium">
                {satelliteState?.battery ? `${satelliteState.battery}%` : '98%'}
              </span>
              <div className="w-5 h-2.5 rounded-[3px] border border-on-surface/50 p-[1px] flex items-center">
                <div
                  className="h-full bg-primary rounded-[1.5px] transition-all"
                  style={{ width: `${satelliteState?.battery || 98}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inner Phone Screen Content */}
        <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative bg-surface">
          {children}
        </div>

        {/* Modern Home Indicator Pill */}
        <div className="w-full py-1.5 bg-surface-dim/95 backdrop-blur-md flex items-center justify-center shrink-0 z-20">
          <div className="w-32 h-1 bg-white/35 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default MobileFrameWrapper;
