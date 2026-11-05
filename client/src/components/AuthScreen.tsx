import React, { useState, useEffect, useRef } from 'react';
import { CurrentUser } from '../types';
import { requestOtpApi, verifyOtpApi, loginDemoApi } from '../services/api';
import { sounds } from '../services/soundEffects';
import { OnboardingModal } from './OnboardingModal';
import { RegisterScreen } from './RegisterScreen';
import { NexusLogo } from './NexusLogo';

interface AuthScreenProps {
  onAuthSuccess: (user: CurrentUser) => void;
  onEmergencyBypass?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onEmergencyBypass }) => {
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  const [authMode, setAuthMode] = useState<'phone' | 'operator'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [destinationDisplay, setDestinationDisplay] = useState('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Resend countdown timer
  useEffect(() => {
    if (authStep !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [authStep, resendTimer]);

  // Focus OTP input when transitioning to OTP step
  useEffect(() => {
    if (authStep === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    }
  }, [authStep]);

  const getFullIdentifier = () => {
    if (authMode === 'phone') {
      const cleanPhone = phoneNumber.trim();
      if (!cleanPhone) return '';
      return `${countryCode} ${cleanPhone}`;
    }
    return operatorId.trim().toUpperCase();
  };

  // Step 1: Request Real OTP from Server
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const identifier = getFullIdentifier();
    if (!identifier) {
      setErrorMessage(
        authMode === 'phone'
          ? 'Please enter your mobile phone number.'
          : 'Please enter your tactical Operator ID / Callsign.'
      );
      return;
    }

    setIsLoading(true);
    sounds.playSatelliteChirp();

    try {
      const res = await requestOtpApi(identifier);
      setDestinationDisplay(res.destination || identifier);
      setAuthStep('otp');
      setResendTimer(res.cooldownSeconds || 60);
      setOtpCode('');
      setInfoMessage(res.message || 'Verification OTP dispatched.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request verification code. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Real OTP against PBKDF2 Server Hash
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    sounds.playSentSound();

    try {
      const identifier = getFullIdentifier();
      const res = await verifyOtpApi(identifier, cleanOtp, rememberTerminal);
      if (res.user) {
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Genuine WebAuthn platform authenticator check
  const handlePasskeyAuth = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (typeof window.PublicKeyCredential === 'undefined') {
      setErrorMessage('WebAuthn / Passkeys are not supported in this browser environment.');
      return;
    }

    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setErrorMessage('No biometric platform authenticator (Windows Hello / Touch ID / Face ID) detected.');
        return;
      }
      setInfoMessage('Biometric hardware detected. Please authenticate via OTP first to register this device key.');
    } catch (err: any) {
      setErrorMessage('Biometric check error: ' + (err.message || 'Access denied'));
    }
  };

  // Quick dev seed fillers for rapid testing
  const fillTestAccount = (phone: string, mode: 'phone' | 'operator') => {
    setAuthMode(mode);
    setCountryCode('+91');
    if (mode === 'phone') {
      setPhoneNumber(phone);
    } else {
      setOperatorId(phone);
    }
    setErrorMessage('');
  };

  // Dedicated Public Explore Demo Handler
  const handleExploreDemo = async () => {
    setIsDemoLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    sounds.playSatelliteChirp();
    try {
      const res = await loginDemoApi();
      if (res.user) {
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start demo session.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  if (viewMode === 'register') {
    return (
      <RegisterScreen
        onBackToLogin={() => setViewMode('login')}
        onRegistrationSuccess={(user) => onAuthSuccess(user)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface text-on-surface font-sans text-sm selection:bg-primary-container selection:text-on-primary-container select-none overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 w-full z-40 bg-surface-dim/90 backdrop-blur-xl pt-safe border-b border-surface-container-high/60 shadow-sm flex-shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {authStep === 'otp' && (
              <button
                type="button"
                onClick={() => {
                  setAuthStep('credentials');
                  setErrorMessage('');
                  setInfoMessage('');
                }}
                className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container active:scale-95 transition-all shrink-0"
                title="Change phone or callsign"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            )}
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {authStep === 'otp' ? 'OTP' : 'Auth'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                {authStep === 'otp' ? 'Dual-Factor Verification' : 'Tactical Sovereign Gateway'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              aria-label="Authentication Help and Diagnostics"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary active:scale-95 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 w-full px-4 py-4 space-y-4 pb-8 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Top Status Telemetry Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low shadow-sm border border-surface-container-high/60">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00e5a3] shrink-0" />
            <span className="font-mono text-[11px] text-primary tracking-wide font-medium">
              {authStep === 'otp' ? 'PBKDF2 AUTH PROTOCOL ACTIVE' : 'SECURE SESSION GATEWAY READY'}
            </span>
            <span className="font-mono text-[9px] text-on-surface-variant shrink-0">• E2EE</span>
          </div>

          {/* Orbital Icon & Brand Hero Header */}
          <div className="flex flex-col items-center text-center gap-1">
            <NexusLogo size={56} glow className="mb-1" />
            <div className="flex flex-col items-center">
              <span className="font-headline-lg text-2xl text-on-surface tracking-tight font-bold">NEXUS</span>
              <p className="font-body-sm text-xs text-on-surface-variant max-w-[280px] mt-0.5">
                {authStep === 'otp'
                  ? 'Cryptographic One-Time Code Verification'
                  : 'Sovereign Off-Grid & Terrestrial Communications'}
              </p>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="w-full flex items-center justify-center gap-2 text-[11px] font-mono text-outline">
            <span>Quick Fill:</span>
            <button
              type="button"
              onClick={() => fillTestAccount('98765 43210', 'phone')}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-primary hover:underline border border-surface-container-highest/60"
            >
              Admin (+91 98765 43210)
            </button>
            <button
              type="button"
              onClick={() => fillTestAccount('98112 34567', 'phone')}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-secondary hover:underline border border-surface-container-highest/60"
            >
              Officer Neha
            </button>
          </div>

          {/* STEP 1: CREDENTIALS INPUT */}
          {authStep === 'credentials' && (
            <div className="w-full bg-surface-container rounded-2xl p-4 flex flex-col gap-4 shadow-md border border-surface-container-high/70">
              {/* Input Switch Tabs (Phone vs Operator ID) */}
              <div className="flex p-1 bg-surface-container-lowest rounded-xl w-full border border-surface-container-highest/40">
                <button
                  type="button"
                  onClick={() => setAuthMode('phone')}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'phone'
                      ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">smartphone</span>
                  <span>PHONE NUMBER</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('operator')}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'operator'
                      ? 'bg-surface-container-high text-secondary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  <span>OPERATOR ID</span>
                </button>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-3.5" onSubmit={handleRequestOtp}>
                {/* Phone Input Block */}
                {authMode === 'phone' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Mobile Station Number
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCountryCode((c) => (c === '+91' ? '+1' : '+91'))}
                        className="h-11 px-3 bg-surface-container-high rounded-xl flex items-center gap-1 text-on-surface font-mono text-xs active:bg-surface-bright transition-colors border border-surface-container-highest/60 shrink-0"
                        title="Click to toggle country code"
                      >
                        <span>{countryCode}</span>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
                      </button>
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter your phone number..."
                          autoFocus
                          className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                        />
                        <span className="material-symbols-outlined absolute right-3 text-[18px] text-primary shrink-0 pointer-events-none">cell_tower</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Operator ID Block */}
                {authMode === 'operator' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Tactical Callsign / Nexus ID
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={operatorId}
                        onChange={(e) => setOperatorId(e.target.value)}
                        placeholder="e.g. NX-CAPTAIN-YASH"
                        autoFocus
                        className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 text-on-surface font-mono text-xs uppercase placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                      />
                      <span className="material-symbols-outlined absolute right-3 text-[18px] text-secondary shrink-0 pointer-events-none">satellite_alt</span>
                    </div>
                  </div>
                )}

                {/* Session Persistence Switch */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col pr-3">
                    <span className="font-body-sm text-xs text-on-surface font-medium">Keep Terminal Session Active</span>
                    <span className="font-mono text-[9px] text-outline">Maintains cryptographically signed session token</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rememberTerminal}
                    onClick={() => setRememberTerminal(!rememberTerminal)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                      rememberTerminal ? 'bg-primary-container' : 'bg-surface-bright'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm transition duration-200 ${
                        rememberTerminal ? 'translate-x-5 bg-on-primary-container' : 'translate-x-0 bg-outline'
                      }`}
                    />
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-error-container/40 text-error text-xs flex items-center gap-2 border border-error/30 animate-shake">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {infoMessage && (
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary text-xs flex items-center gap-2 border border-primary/30">
                    <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
                    <span>{infoMessage}</span>
                  </div>
                )}

                {/* Primary CTA: Request OTP & Continue */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-1 rounded-xl bg-primary-container hover:bg-primary-fixed text-on-primary-container font-headline-sm text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] shadow-[0_0_16px_rgba(0,229,163,0.3)] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-on-primary-container border-t-transparent animate-spin" />
                      <span>Requesting Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Verification Code</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </>
                  )}
                </button>

                {/* New to NEXUS? Create an account link */}
                <div className="pt-2 text-center text-xs text-on-surface-variant flex items-center justify-center gap-1.5 border-t border-surface-container-highest/40">
                  <span>New to NEXUS?</span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSentSound();
                      setViewMode('register');
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Create an account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* OPTION 3: Dedicated Public Explore Demo Button */}
          {authStep === 'credentials' && (
            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-px bg-surface-container-highest" />
                <span className="font-mono text-[9px] text-outline uppercase tracking-widest shrink-0">
                  or explore sandbox
                </span>
                <div className="flex-1 h-px bg-surface-container-highest" />
              </div>

              <button
                type="button"
                disabled={isDemoLoading || isLoading}
                onClick={handleExploreDemo}
                className="w-full h-12 px-4 bg-surface-container hover:bg-surface-container-high rounded-2xl flex items-center justify-between text-secondary border border-secondary/35 active:scale-[0.99] transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">science</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-headline-sm text-xs font-bold text-on-surface">
                      {isDemoLoading ? 'Entering Sandbox...' : 'Explore Demo'}
                    </span>
                    <span className="font-mono text-[9px] text-on-surface-variant">
                      Instant Access • Fictional Multi-Tenant Data
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-semibold">
                    Public Sandbox
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-secondary group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {authStep === 'otp' && (
            <div className="w-full bg-surface-container rounded-2xl p-5 flex flex-col gap-4 shadow-md border border-surface-container-high/70">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-on-surface">Enter 6-Digit Code</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Dispatched to <span className="text-primary font-mono font-semibold">{destinationDisplay}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('credentials');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  className="text-[11px] font-mono text-secondary hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">edit</span>
                  <span>Edit</span>
                </button>
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-xl bg-surface-container-high border border-surface-container-highest flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">lock_clock</span>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  Single-use code expires in 5 minutes. (Check server terminal output for generated verification code in local testing).
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* 6 Digit Display Boxes */}
                <div className="relative">
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2 w-full">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const char = otpCode[index] || '';
                      const isFocused = otpCode.length === index || (index === 5 && otpCode.length === 6);
                      return (
                        <div
                          key={index}
                          className={`w-full aspect-square max-h-14 rounded-xl flex items-center justify-center font-mono text-base sm:text-xl font-bold transition-all border ${
                            char
                              ? 'bg-surface-container-high border-primary text-primary shadow-sm'
                              : isFocused
                              ? 'bg-surface-container-high border-primary/60 text-on-surface ring-2 ring-primary/20'
                              : 'bg-surface-container-lowest border-surface-container-highest/60 text-outline'
                          }`}
                        >
                          {char || (isFocused ? <span className="w-1.5 h-4 bg-primary animate-pulse" /> : '•')}
                        </div>
                      );
                    })}
                  </div>

                  {/* Hidden Real Input */}
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      if (val.length === 6) {
                        sounds.playSentSound();
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-on-surface-variant">Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="text-outline">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      className="text-primary hover:underline font-semibold"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-error-container/40 text-error text-xs flex items-center gap-2 border border-error/30 animate-shake">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit OTP */}
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] shadow-[0_0_16px_rgba(0,229,163,0.35)] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                      <span>Validating Hash...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Enter Nexus</span>
                      <span className="material-symbols-outlined text-[20px]">login</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Genuine Biometric / Passkey Hardware Option */}
          <div className="w-full bg-surface-container-low rounded-2xl p-3.5 flex items-center justify-between shadow-sm border border-surface-container-high/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[22px]">fingerprint</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-on-surface truncate">Platform Biometrics</span>
                <span className="font-mono text-[10px] text-on-surface-variant truncate">WebAuthn / Passkey</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePasskeyAuth}
              className="h-8 px-3.5 bg-surface-container-high hover:bg-surface-bright rounded-lg text-primary font-mono text-[11px] font-semibold transition-colors active:scale-95 shrink-0 border border-primary/20"
            >
              DETECT
            </button>
          </div>

          {/* Tactical Fallback Divider */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-container-highest" />
            <span className="font-mono text-[9px] text-outline uppercase tracking-widest shrink-0">
              emergency fallback
            </span>
            <div className="flex-1 h-px bg-surface-container-highest" />
          </div>

          {/* SOS Emergency Bypass Button */}
          <button
            type="button"
            onClick={() => {
              if (onEmergencyBypass) {
                onEmergencyBypass();
              }
            }}
            className="w-full h-11 px-3.5 bg-error-container/40 hover:bg-error-container/60 rounded-xl flex items-center justify-between text-error active:scale-[0.99] transition-all border border-error/30"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-error">sos</span>
              <span className="font-mono text-[11px] font-bold tracking-wide">EMERGENCY SOS BYPASS</span>
            </div>
            <span className="font-mono text-[9px] uppercase bg-error-container text-error px-2 py-0.5 rounded font-semibold">
              NO LOGIN REQUIRED
            </span>
          </button>

          {/* Footer Links & Security Assurance */}
          <div className="flex flex-col items-center gap-1.5 pt-1 text-center w-full">
            <div className="flex items-center gap-1 font-body-sm text-xs">
              <span className="text-on-surface-variant">Need new citizen credentials?</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playSentSound();
                  setViewMode('register');
                }}
                className="text-primary font-semibold hover:underline"
              >
                Create Account
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-outline mt-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span className="font-mono text-[9px] tracking-wider uppercase">
                Zero-Knowledge E2EE • P-256 ECDH + AES-256-GCM
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 3-Step Interactive Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setAuthMode('phone');
          setPhoneNumber('98765 43210');
          handleRequestOtp();
        }}
        onEmergencyBypass={onEmergencyBypass}
      />
    </div>
  );
};
