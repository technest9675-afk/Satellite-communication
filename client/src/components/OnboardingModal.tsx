import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onEmergencyBypass?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onEmergencyBypass
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDevice, setSelectedDevice] = useState<string>('Nexus Pocket Device');
  const [isSearchingDevices, setIsSearchingDevices] = useState(false);
  const [isPingRunning, setIsPingRunning] = useState(false);
  const [pingDelivered, setPingDelivered] = useState(false);
  const [isSirenModalOpen, setIsSirenModalOpen] = useState(false);
  const [isChirping, setIsChirping] = useState(false);

  if (!isOpen) return null;

  const handleDeviceRescan = () => {
    setIsSearchingDevices(true);
    sounds.playSatelliteChirp();
    setTimeout(() => {
      setIsSearchingDevices(false);
    }, 1200);
  };

  const handleSelectDevice = (name: string) => {
    setSelectedDevice(name);
    sounds.playSentSound();
  };

  const handleTriggerPing = () => {
    if (isPingRunning) return;
    setIsPingRunning(true);
    setPingDelivered(false);
    sounds.playSatelliteChirp();

    setTimeout(() => {
      setPingDelivered(true);
      setIsPingRunning(false);
      sounds.playReceivedSound();
    }, 1500);
  };

  const simulateAcousticPulse = () => {
    setIsChirping(true);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      sounds.playSosAlert();
    }

    setTimeout(() => {
      setIsChirping(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-[390px] min-h-screen sm:min-h-0 sm:my-8 bg-surface sm:rounded-2xl sm:border sm:border-surface-container-high shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60 pt-safe">
          <div className="h-16 px-margin flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              {step > 1 ? (
                <button
                  type="button"
                  aria-label="Back"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface active:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface active:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
              <div className="flex flex-col">
                <span className="font-headline-sm text-sm font-semibold text-on-surface">
                  {step === 1 && 'Welcome to Nexus'}
                  {step === 2 && 'Pair Your Device'}
                  {step === 3 && 'Constellation Sync'}
                </span>
                <span className="font-telemetry-xs text-[10px] text-primary uppercase tracking-wider">
                  Step {step} of 3
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-6 bg-primary' : 'w-2 bg-surface-container-highest'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-6 bg-primary' : 'w-2 bg-surface-container-highest'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step === 3 ? 'w-6 bg-primary' : 'w-2 bg-surface-container-highest'}`} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-margin py-space-md flex flex-col justify-between overflow-y-auto">
          {/* STEP 1: WELCOME & ONBOARDING */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center">
              {/* Central Hero Branding Area */}
              <div className="relative w-32 h-32 flex items-center justify-center my-space-xs">
                {/* Decorative Concentric Radar Waves */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-container/15 via-secondary-container/10 to-transparent blur-xl" />
                <svg className="absolute inset-0 w-full h-full text-outline-variant/30 pointer-events-none" fill="none" viewBox="0 0 144 144">
                  <circle cx="72" cy="72" opacity="0.6" r="68" stroke="currentColor" strokeDasharray="3 4" strokeWidth="1" />
                  <circle cx="72" cy="72" opacity="0.3" r="54" stroke="currentColor" strokeWidth="1" />
                  <circle cx="72" cy="72" opacity="0.5" r="40" stroke="currentColor" strokeWidth="1" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" x1="72" x2="72" y1="4" y2="18" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" x1="72" x2="72" y1="126" y2="140" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" x1="4" x2="18" y1="72" y2="72" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" x1="126" x2="140" y1="72" y2="72" />
                </svg>
                {/* Central Hero Logo Emblem */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center shadow-lg border border-primary/30">
                  <span className="material-symbols-outlined text-[36px] text-primary">satellite_alt</span>
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs mt-2">
                <div className="inline-flex items-center gap-1.5">
                  <h1 className="font-headline-lg text-2xl font-bold text-on-surface tracking-[0.18em]">NEXUS</h1>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[9px] text-secondary uppercase font-semibold">v2.4</span>
                </div>
                <p className="font-headline-sm text-sm text-primary font-semibold">
                  Always connected. Anywhere on Earth.
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  The first hybrid messenger combining direct orbital satellite links with terrestrial cellular &amp; Wi-Fi mesh.
                </p>
              </div>

              {/* Value Proposition Micro-Cards */}
              <div className="flex flex-col gap-2.5 my-space-md w-full text-left">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/60">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">cell_tower</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-on-surface">Global Satellite Uplink</span>
                      <span className="font-mono text-[9px] text-primary uppercase">No SIM Req.</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      Send encrypted text, high-res GPS coordinates, and ping check-ins without cellular infrastructure.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/60">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">encrypted</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-on-surface">Zero-Trust Mesh Encryption</span>
                      <span className="font-mono text-[9px] text-secondary uppercase">Local ECDSA</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      Hardware-secured keys stay in your transceiver flash. Messages hop encrypted across local peer nodes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/60">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary-container shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-on-surface">One-Touch Emergency SOS</span>
                      <span className="font-mono text-[9px] text-tertiary-container uppercase">COSPAS-SARSAT</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      Instant high-power distress packet relayed directly to Search &amp; Rescue centers during total blackouts.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2.5 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-12 rounded-xl bg-primary-container hover:bg-primary-fixed text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                >
                  <span>Get Started</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-10 rounded-xl bg-surface-container-high text-on-surface font-headline-sm text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:bg-surface-variant transition-colors"
                >
                  <span>I already have a tactical key pair</span>
                </button>

                <button
                  type="button"
                  onClick={onEmergencyBypass || onClose}
                  className="group flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-error-container/20 text-error active:bg-error-container/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-error animate-pulse">crisis_alert</span>
                  <span className="font-mono text-[10px] tracking-wider text-error uppercase font-bold">
                    Emergency Distress SOS Bypass (Zero Setup)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAIR YOUR DEVICE */}
          {step === 2 && (
            <div className="flex flex-col gap-space-md">
              <div>
                <h2 className="font-headline-md text-lg font-bold text-on-surface">Connect Your Device</h2>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  Turn on your Nexus device nearby to connect via Bluetooth.
                </p>
              </div>

              {/* Radar Scanner Graphic */}
              <div className="relative w-full rounded-xl bg-surface-container-lowest p-space-lg flex flex-col items-center justify-center overflow-hidden shadow-md border border-surface-container-high/60">
                <div className="relative w-36 h-36 flex items-center justify-center my-space-xs">
                  <div className={`absolute inset-0 rounded-full bg-surface-container-high/40 ${isSearchingDevices ? 'animate-ping' : 'animate-pulse'}`} />
                  <div className="absolute inset-4 rounded-full bg-surface-container/60" />
                  <div className="absolute inset-8 rounded-full bg-surface-container-high/30" />
                  <div className="relative z-10 w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center shadow-[0_0_24px_rgba(0,229,163,0.35)]">
                    <span className={`material-symbols-outlined text-[26px] text-primary ${isSearchingDevices ? 'animate-spin' : ''}`}>
                      bluetooth_searching
                    </span>
                  </div>
                  <div className="absolute top-4 right-6 flex items-center justify-center">
                    <span className="absolute w-5 h-5 rounded-full bg-primary/20 animate-ping" />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#00e5a3]" />
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-1 mt-space-xs text-center">
                  <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-primary font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>{isSearchingDevices ? 'Scanning sub-GHz & BLE...' : 'Searching for nearby devices...'}</span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    Make sure your device is powered on and within range
                  </span>
                </div>
              </div>

              {/* Tactical Hardware List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-space-xs">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Found Devices
                  </span>
                  <button
                    type="button"
                    onClick={handleDeviceRescan}
                    className="font-mono text-[10px] text-primary hover:underline flex items-center gap-1 active:opacity-75"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    <span>RESCAN</span>
                  </button>
                </div>

                {/* Primary Device Card */}
                <div
                  onClick={() => handleSelectDevice('Nexus Pocket Device')}
                  className={`relative rounded-xl p-3 flex items-center justify-between gap-space-sm transition-all cursor-pointer border ${
                    selectedDevice === 'Nexus Pocket Device'
                      ? 'bg-surface-container-high border-primary/50 shadow-md'
                      : 'bg-surface-container-low border-surface-container-high/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">satellite_alt</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-on-surface truncate">Nexus Pocket Device</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-semibold">Ready</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">battery_charging_full</span>
                        94% battery • Strong signal
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-8 px-3 rounded-lg bg-primary text-on-primary font-semibold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">bluetooth_connected</span>
                    <span>Connect</span>
                  </button>
                </div>

                {/* Phone Only Option */}
                <div
                  onClick={() => handleSelectDevice('Phone Satellite Radio')}
                  className={`relative rounded-xl p-3 flex items-center justify-between gap-space-sm transition-all cursor-pointer border ${
                    selectedDevice === 'Phone Satellite Radio'
                      ? 'bg-surface-container-high border-primary/50 shadow-md'
                      : 'bg-surface-container-low border-surface-container-high/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-[22px]">phone_android</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-on-surface truncate">Use phone only</span>
                      <span className="text-[11px] text-on-surface-variant truncate">Direct phone emergency satellite mode</span>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">Select</span>
                </div>
              </div>

              {/* QR Pairing & SOS Deck */}
              <div className="flex items-center justify-center py-1">
                <button
                  type="button"
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  <span>Can't find your device? Pair with QR code</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,229,163,0.3)] active:scale-[0.99] transition-transform"
                >
                  <span>Connect &amp; Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <div className="flex items-center justify-between px-1 text-on-surface-variant text-xs">
                  <button type="button" onClick={() => setStep(1)} className="hover:text-on-surface">
                    ← Back to Welcome
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="hover:text-primary">
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SETUP COMPLETE & SATELLITE TEST */}
          {step === 3 && (
            <div className="flex flex-col gap-space-md">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-high font-mono text-[10px] text-primary uppercase tracking-wider mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#6effc3]" />
                  <span>STEP 3 OF 3 • READY TO GO</span>
                </div>
                <h2 className="font-headline-lg text-xl font-bold text-on-surface">You're All Set!</h2>
                <p className="font-body-sm text-xs text-secondary mt-0.5">
                  Nexus works everywhere on Earth — even without cell service or Wi-Fi.
                </p>
              </div>

              {/* Orbital Visual Verification Card */}
              <div className="relative rounded-xl bg-surface-container p-4 overflow-hidden shadow-md border border-surface-container-high">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 bg-surface-container-lowest/80 px-2.5 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="font-mono text-[10px] text-primary font-semibold tracking-wider uppercase">
                      Connected to Satellite
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">
                    STRONG SIGNAL
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/70">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                      <span className="text-xs text-on-surface font-medium">Satellite connection</span>
                    </div>
                    <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/70">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                      <span className="text-xs text-on-surface font-medium">End-to-end privacy</span>
                    </div>
                    <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">PROTECTED</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high/70">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                      <span className="text-xs text-on-surface font-medium">Emergency SOS</span>
                    </div>
                    <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">READY</span>
                  </div>
                </div>
              </div>

              {/* Free Test Ping Card */}
              <div className="rounded-xl bg-surface-container p-4 space-y-2.5 shadow-md border border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">chat</span>
                  <h3 className="font-semibold text-xs text-on-surface">Try a Free Test Message</h3>
                </div>

                <div className="rounded-lg bg-surface-container-lowest p-3 space-y-2">
                  <div className="p-2 rounded bg-surface-container-high flex flex-col gap-1">
                    <div className="flex items-center justify-between text-secondary text-[11px]">
                      <span>Preview</span>
                      <span className="text-primary flex items-center">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      </span>
                    </div>
                    <p className="text-xs text-on-surface">
                      Hello from Nexus! My satellite connection is working.
                    </p>
                    {pingDelivered && (
                      <div className="mt-1 pt-1 border-t border-surface-container flex items-center justify-between text-primary font-mono text-[10px]">
                        <span className="font-bold">DELIVERED IN 1.2s</span>
                        <span>CONFIRMED ✓</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerPing}
                    className="w-full h-10 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-primary flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-[0.99]"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isPingRunning ? 'animate-spin' : ''}`}>
                      {isPingRunning ? 'progress_activity' : pingDelivered ? 'task_alt' : 'send'}
                    </span>
                    <span>
                      {isPingRunning ? 'Uplinking to Orbit (LEO-48)...' : pingDelivered ? 'Test Ping Successful! ✓' : 'Send Test Message'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-auto pt-2">
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(110,255,195,0.4)] active:scale-[0.99] transition-all"
                >
                  <span>Start Messaging</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSirenModalOpen(true)}
                  className="w-full h-10 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center gap-2 text-xs font-medium transition-all"
                >
                  <span className="material-symbols-outlined text-error text-[16px]">sos</span>
                  <span>Practice Emergency SOS (Safe Mode)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SOS Siren Practice Modal */}
        {isSirenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-4">
            <div className="w-full max-w-[390px] rounded-xl bg-surface-container-high p-5 space-y-4 shadow-2xl border border-surface-container-highest">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[22px]">crisis_alert</span>
                  <span className="font-bold text-sm">SOS Practice Test</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSirenModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-lowest text-center space-y-1">
                <span className="font-mono text-[10px] text-primary block">AUDIO &amp; STROBE SIMULATION</span>
                <p className="font-body-sm text-xs text-on-surface leading-relaxed">
                  In a true emergency, hold both volume buttons for 3 seconds to emit an audible 110dB acoustic chirp and strobe the LED flash.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={simulateAcousticPulse}
                  className={`w-full h-11 rounded-lg bg-error hover:bg-error-container text-on-error text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                    isChirping ? 'animate-pulse' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  <span>{isChirping ? 'Chirping Horn...' : 'Chirp Test Horn (3s)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSirenModalOpen(false)}
                  className="w-full h-9 rounded-lg bg-surface-container text-secondary text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
