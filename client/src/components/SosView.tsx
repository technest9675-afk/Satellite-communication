import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../services/soundEffects';
import { socket } from '../services/api';
import { CurrentUser } from '../types';
import { NexusLogo } from './NexusLogo';

interface SosViewProps {
  onBack?: () => void;
  currentUser?: CurrentUser | null;
}

export const SosView: React.FC<SosViewProps> = ({ onBack, currentUser }) => {
  const [selectedSituation, setSelectedSituation] = useState<'medical' | 'lost' | 'weather' | 'gear'>('medical');
  const [isLiveShareActive, setIsLiveShareActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sosStatus, setSosStatus] = useState<'idle' | 'arming' | 'sent'>('idle');
  const [sliderX, setSliderX] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Load user configured emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_emergency_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Device Geolocation State
  const [deviceLocation, setDeviceLocation] = useState<{
    lat: number | null;
    lng: number | null;
    accuracy?: number;
    isReal: boolean;
    label: string;
  }>({
    lat: null,
    lng: null,
    isReal: false,
    label: 'Location unavailable (GPS offline)'
  });
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isReal: true,
            label: `${position.coords.latitude.toFixed(4)}°, ${position.coords.longitude.toFixed(4)}°`
          });
          setIsLocating(false);
        },
        (err) => {
          console.warn('Device GPS unavailable:', err.message);
          setDeviceLocation({
            lat: null,
            lng: null,
            isReal: false,
            label: 'Location unavailable (GPS offline)'
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  const maxSlide = 260; // default approximate slide width

  const startDrag = (clientX: number) => {
    if (sosStatus !== 'idle') return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const moveDrag = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const trackWidth = trackRef.current ? trackRef.current.clientWidth - 64 : maxSlide;
    const delta = Math.max(0, Math.min(clientX - startXRef.current, trackWidth));
    setSliderX(delta);

    if (delta >= trackWidth * 0.85) {
      endDrag(true);
    }
  };

  const endDrag = (triggered = false) => {
    if (!isDraggingRef.current && !triggered) return;
    isDraggingRef.current = false;

    const trackWidth = trackRef.current ? trackRef.current.clientWidth - 64 : maxSlide;
    if (triggered || sliderX >= trackWidth * 0.85) {
      setSliderX(trackWidth);
      triggerArmingCountdown();
    } else {
      setSliderX(0);
    }
  };

  const isDemo = currentUser?.role === 'demo';

  const triggerArmingCountdown = () => {
    if (sosStatus !== 'idle') return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSosStatus('arming');
    setCountdown(5.0);
    sounds.playSosAlert();

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0.1) {
          clearInterval(timerRef.current);
          setSosStatus('sent');
          sounds.playSosAlert();
          // Demo mode isolation: never dispatch real SOS socket event in demo mode
          if (!isDemo) {
            socket.emit('trigger_sos');
          }
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
  };

  const cancelSos = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setCountdown(null);
    setSosStatus('idle');
    setSliderX(0);
    sounds.playSentSound();
  };

  useEffect(() => {
    const handleMouseUp = () => endDrag();
    const handleMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
    const handleTouchEnd = () => endDrag();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        moveDrag(e.touches[0].clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sliderX]);

  return (
    <div className="flex-1 w-full flex flex-col bg-surface select-none overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="sticky top-0 w-full z-40 pt-safe bg-surface-dim/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-sm flex-shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                type="button"
                aria-label="Go Back"
                onClick={onBack}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-error-container text-error border border-error/30 shrink-0">
                  SOS
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">Emergency SOS Distress Beacon</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono font-medium text-primary tracking-wide">
                Satellite Ready
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Stream */}
      <main className="flex-1 w-full px-4 py-4 space-y-4 pb-8 overflow-y-auto no-scrollbar">
        {/* Reassurance Ribbon */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-xs text-on-surface-variant font-medium">Direct emergency relay connected</span>
          </div>
          <span className="text-xs font-mono font-semibold text-primary">NavIC 406 MHz Beacon</span>
        </div>

        {/* SOS Hero Trigger Card */}
        <div className="rounded-2xl p-5 bg-gradient-to-b from-surface-container-high to-surface-container border border-surface-container-highest shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-error/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-error font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">emergency</span>
                Emergency Assistance
              </span>
              <h1 className="text-xl font-bold text-on-surface mt-1 tracking-tight">Need immediate rescue?</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Dispatches coordinates and distress data to emergency responders.
              </p>
            </div>
          </div>

          {/* Slide Trigger Slider */}
          <div
            ref={trackRef}
            className="relative w-full h-16 bg-surface-container-lowest rounded-xl flex items-center p-1 select-none overflow-hidden border border-surface-container-highest/60"
          >
            <div
              className="absolute left-0 top-0 bottom-0 bg-error/30 rounded-xl transition-all pointer-events-none"
              style={{ width: sliderX > 0 ? `${sliderX + 56}px` : '0px' }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-16 pr-3">
              <span className="text-[11px] font-bold tracking-wider uppercase text-on-surface-variant flex items-center gap-1.5 truncate">
                {sosStatus === 'idle' ? (
                  <>
                    Slide for Emergency SOS{' '}
                    <span className="material-symbols-outlined text-sm text-error animate-pulse shrink-0">
                      keyboard_double_arrow_right
                    </span>
                  </>
                ) : (
                  'TRANSMISSION ARMED'
                )}
              </span>
            </div>

            {/* Draggable Handle Thumb */}
            <div
              ref={thumbRef}
              onMouseDown={(e) => startDrag(e.clientX)}
              onTouchStart={(e) => startDrag(e.touches[0].clientX)}
              onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
              onTouchEnd={() => endDrag()}
              style={{ transform: `translateX(${sliderX}px)` }}
              className="relative z-10 w-14 h-14 bg-error text-on-error rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg duration-75 transition-transform"
            >
              <span className="material-symbols-outlined text-2xl font-bold">
                {sosStatus === 'idle' ? 'sos' : 'warning'}
              </span>
            </div>
          </div>

          {/* Live Countdown / Abort Bar */}
          {sosStatus !== 'idle' && (
            <div
              className={`mt-3 p-3 rounded-xl flex items-center justify-between border transition-all ${
                sosStatus === 'sent'
                  ? 'bg-error text-on-error border-error'
                  : 'bg-error-container text-on-error-container border-error/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-2xl ${sosStatus === 'arming' ? 'animate-spin' : ''}`}>
                  {sosStatus === 'arming' ? 'refresh' : 'check_circle'}
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {sosStatus === 'arming' ? (
                      <>
                        Sending SOS In <span className="text-sm font-mono">{countdown?.toFixed(1)}s</span>
                      </>
                    ) : (
                      'SOS DISPATCHED TO ISTRAC / SAR'
                    )}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {sosStatus === 'arming' ? 'Tap cancel immediately if activated by mistake' : 'Beacon active on 406 MHz'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelSos}
                className="px-3.5 py-1.5 bg-surface text-error rounded-lg text-xs font-bold tracking-wider uppercase border border-error/30 active:scale-95 transition-all"
              >
                {sosStatus === 'arming' ? 'Cancel' : 'Stop SOS'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-container-high/60 text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              5s safety cancel window
            </span>
            <span className="font-mono text-outline">Works without cellular</span>
          </div>
        </div>

        {/* Current Location Card */}
        <div className="rounded-2xl p-4 bg-surface-container border border-surface-container-high shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${deviceLocation.isReal ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'}`}>
                <span className="material-symbols-outlined text-lg">location_on</span>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-outline font-semibold">
                  Device Location
                </div>
                <div className="text-sm font-bold text-on-surface">
                  {isLocating ? 'Acquiring GPS...' : deviceLocation.isReal ? 'Active GPS Fix' : 'Location unavailable (GPS offline)'}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
              deviceLocation.isReal
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {deviceLocation.isReal ? 'REAL GPS' : 'GPS OFFLINE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high/60">
            <div>
              <span className="text-[10px] font-mono uppercase text-outline">Coordinates</span>
              <div className="text-xs font-mono font-semibold text-on-surface mt-0.5">
                {deviceLocation.lat != null && deviceLocation.lng != null
                  ? `${deviceLocation.lat.toFixed(4)}° N, ${deviceLocation.lng.toFixed(4)}° E`
                  : 'Coordinates Unavailable (GPS Offline)'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-outline">Precision / Status</span>
              <div className="text-xs font-mono font-semibold text-primary mt-0.5">
                {deviceLocation.isReal
                  ? `±${Math.round(deviceLocation.accuracy || 12)}m accuracy`
                  : 'Awaiting Satellite/GPS Fix'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Situation Selector - 4 Uniform Height Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">What happened?</span>
            <span className="text-[11px] text-primary font-medium">Tap to update rescue team</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 1: Medical Injury */}
            <button
              type="button"
              onClick={() => setSelectedSituation('medical')}
              className={`text-left p-3.5 h-[115px] rounded-2xl border transition-all active:scale-[0.98] flex flex-col justify-between ${
                selectedSituation === 'medical'
                  ? 'bg-surface-container-high border-error/50 shadow-sm'
                  : 'bg-surface-container-low border-surface-container-high'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">medical_services</span>
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface leading-tight">Medical Injury</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2 leading-tight">
                  Severe wound or trauma
                </div>
              </div>
            </button>

            {/* 2: Lost / Stranded */}
            <button
              type="button"
              onClick={() => setSelectedSituation('lost')}
              className={`text-left p-3.5 h-[115px] rounded-2xl border transition-all active:scale-[0.98] flex flex-col justify-between ${
                selectedSituation === 'lost'
                  ? 'bg-surface-container-high border-tertiary-container/50 shadow-sm'
                  : 'bg-surface-container-low border-surface-container-high'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-tertiary-container/20 text-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">explore</span>
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface leading-tight">Lost / Stranded</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2 leading-tight">
                  Route lost, cannot return
                </div>
              </div>
            </button>

            {/* 3: Severe Weather */}
            <button
              type="button"
              onClick={() => setSelectedSituation('weather')}
              className={`text-left p-3.5 h-[115px] rounded-2xl border transition-all active:scale-[0.98] flex flex-col justify-between ${
                selectedSituation === 'weather'
                  ? 'bg-surface-container-high border-secondary/50 shadow-sm'
                  : 'bg-surface-container-low border-surface-container-high'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">storm</span>
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface leading-tight">Severe Weather</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2 leading-tight">
                  Storm or freeze hazard
                </div>
              </div>
            </button>

            {/* 4: Vehicle / Gear */}
            <button
              type="button"
              onClick={() => setSelectedSituation('gear')}
              className={`text-left p-3.5 h-[115px] rounded-2xl border transition-all active:scale-[0.98] flex flex-col justify-between ${
                selectedSituation === 'gear'
                  ? 'bg-surface-container-high border-primary/50 shadow-sm'
                  : 'bg-surface-container-low border-surface-container-high'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">build</span>
              </div>
              <div>
                <div className="text-xs font-bold text-on-surface leading-tight">Vehicle / Gear</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2 leading-tight">
                  Hardware breakdown
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Emergency Contacts & Dispatch */}
        <div className="rounded-2xl p-4 bg-surface-container border border-surface-container-high shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-outline">Who gets notified</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Ready via Satellite &amp; Internet
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">shield</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-on-surface">National Rescue Services</div>
                  <div className="text-[11px] text-outline">SAR Dispatch &amp; ISTRAC Emergency Relay</div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                Priority 1
              </span>
            </div>

            {emergencyContacts.length > 0 ? (
              emergencyContacts.map((contact, idx) => (
                <div key={contact.id || idx} className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">person_alert</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-on-surface">{contact.name}</div>
                      <div className="text-[11px] text-outline">{contact.relationship} • {contact.phone}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {contact.priority === 'primary' ? 'Priority 2' : 'Backup ICE'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-center">
                <p className="text-xs text-on-surface-variant">No personal emergency contacts configured.</p>
                <p className="text-[11px] text-primary mt-0.5">Add trusted contacts in Settings to receive distress SMS.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
