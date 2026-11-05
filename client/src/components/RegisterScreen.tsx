import React, { useState, useEffect, useRef } from 'react';
import { CurrentUser } from '../types';
import { 
  generateNexusIdApi, 
  checkNexusIdAvailabilityApi, 
  registerStep1Api, 
  verifyRegistrationApi 
} from '../services/api';
import { sounds } from '../services/soundEffects';
import { NexusLogo } from './NexusLogo';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegistrationSuccess: (user: CurrentUser) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBackToLogin,
  onRegistrationSuccess
}) => {
  // Wizard Steps: 'form' -> 'otp' -> 'success'
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [nexusId, setNexusId] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Status & Validation State
  const [idAvailability, setIdAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Step 2 OTP State
  const [registrationId, setRegistrationId] = useState('');
  const [destinationMasked, setDestinationMasked] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Step 3 Success State
  const [createdUser, setCreatedUser] = useState<CurrentUser | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Password criteria checklist
  const passCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  };

  const score = Object.values(passCriteria).filter(Boolean).length;
  const isPasswordValid = score === 5;
  const doPasswordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = mobileNumber.replace(/\D/g, '').length >= 7;

  // Real-time NEXUS ID uniqueness check with debounce
  useEffect(() => {
    const cleanId = nexusId.trim().toUpperCase();
    if (!cleanId || cleanId.length < 3) {
      setIdAvailability('idle');
      return;
    }

    setIdAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await checkNexusIdAvailabilityApi(cleanId);
        setIdAvailability(res.available ? 'available' : 'taken');
      } catch {
        setIdAvailability('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nexusId]);

  // Resend countdown timer for Step 2
  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus OTP input on Step 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    }
  }, [step]);

  // Auto-generate Unique NEXUS ID
  const handleAutoGenerateId = async () => {
    setIsGeneratingId(true);
    sounds.playSatelliteChirp();
    try {
      const res = await generateNexusIdApi('NX');
      setNexusId(res.nexusId);
      setIdAvailability('available');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to auto-generate NEXUS ID');
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Step 1: Submit Registration Form
  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!nexusId.trim() || nexusId.trim().length < 3) {
      setErrorMessage('Please enter or auto-generate a valid NEXUS ID.');
      return;
    }
    if (idAvailability === 'taken') {
      setErrorMessage('This NEXUS ID is already taken. Please choose another.');
      return;
    }
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('Please ensure your password satisfies all 5 security criteria.');
      return;
    }
    if (!doPasswordsMatch) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Service & DPDP Privacy Policy.');
      return;
    }

    setIsLoading(true);
    sounds.playSatelliteChirp();

    try {
      const fullPhone = `${countryCode} ${mobileNumber.trim()}`;
      const res = await registerStep1Api({
        name: fullName.trim(),
        email: email.trim(),
        phone: fullPhone,
        nexusId: nexusId.trim().toUpperCase(),
        password,
        confirmPassword,
        termsAccepted
      });

      setRegistrationId(res.registrationId);
      setDestinationMasked(res.destinationMasked || `${email} / ${fullPhone}`);
      setStep('otp');
      setResendTimer(60);
      setOtpCode('');
      setInfoMessage(res.message || 'Verification code dispatched.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Registration Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    sounds.playSentSound();

    try {
      const res = await verifyRegistrationApi(registrationId, cleanOtp, true);
      if (res.user) {
        setCreatedUser(res.user);
        setStep('success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Assigned NEXUS ID
  const handleCopyId = () => {
    const idToCopy = createdUser?.nexusId || nexusId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      sounds.playSentSound();
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface text-on-surface font-sans text-sm selection:bg-primary-container selection:text-on-primary-container select-none overflow-hidden">
      {/* Header Bar */}
      <header className="sticky top-0 w-full z-40 bg-surface-dim/90 backdrop-blur-xl pt-safe border-b border-surface-container-high/60 shadow-sm flex-shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (step === 'otp') {
                  setStep('form');
                  setErrorMessage('');
                  setInfoMessage('');
                } else {
                  onBackToLogin();
                }
              }}
              className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container active:scale-95 transition-all shrink-0"
              title={step === 'otp' ? 'Back to registration details' : 'Back to Login'}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {step === 'form' ? 'Step 1' : step === 'otp' ? 'Step 2' : 'Done'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                {step === 'form' && 'Create Sovereign Account'}
                {step === 'otp' && 'Verify Phone Number'}
                {step === 'success' && 'Registration Confirmed'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] font-semibold">
              STEP {step === 'form' ? '1/2' : step === 'otp' ? '2/2' : 'DONE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 py-4 space-y-4 pb-8 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Top Status Telemetry Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low shadow-sm border border-surface-container-high/60">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00e5a3] shrink-0" />
            <span className="font-mono text-[11px] text-primary tracking-wide font-medium">
              SOVEREIGN ENROLMENT PROTOCOL ACTIVE
            </span>
            <span className="font-mono text-[9px] text-on-surface-variant shrink-0">• DPDP 2023</span>
          </div>

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'form' && (
            <div className="w-full bg-surface-container rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-md border border-surface-container-high/70">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-bold text-base text-on-surface flex items-center gap-2">
                  <span>Enrol New Citizen Station</span>
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Join the sovereign off-grid &amp; satellite communications network.
                </p>
              </div>

              <form onSubmit={handleRegisterStep1} className="flex flex-col gap-3.5">
                {/* 1. Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Full Legal Name / Operator Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Captain Yash Vardhan"
                      className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 pl-10 text-on-surface font-sans text-xs placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                    />
                    <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant pointer-events-none">
                      person
                    </span>
                  </div>
                </div>

                {/* 2. Unique NEXUS ID */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Unique NEXUS ID <span className="text-primary">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateId}
                      disabled={isGeneratingId}
                      className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span className={`material-symbols-outlined text-[13px] ${isGeneratingId ? 'animate-spin' : ''}`}>
                        magic_button
                      </span>
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={nexusId}
                      onChange={(e) => setNexusId(e.target.value.toUpperCase())}
                      placeholder="e.g. NX-YASH-01"
                      className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 pl-10 pr-24 text-on-surface font-mono text-xs uppercase placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                    />
                    <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant pointer-events-none">
                      badge
                    </span>
                    <div className="absolute right-2.5 flex items-center">
                      {idAvailability === 'checking' && (
                        <span className="text-[10px] font-mono text-outline animate-pulse">Checking...</span>
                      )}
                      {idAvailability === 'available' && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          <span>Available</span>
                        </span>
                      )}
                      {idAvailability === 'taken' && (
                        <span className="px-2 py-0.5 rounded bg-error/10 border border-error/30 text-error font-mono text-[10px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">cancel</span>
                          <span>Taken</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Official Email Address <span className="text-primary">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yash@nexus.internal"
                      className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 pl-10 text-on-surface font-sans text-xs placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                    />
                    <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant pointer-events-none">
                      mail
                    </span>
                    {email && (
                      <span className="absolute right-3">
                        <span className={`material-symbols-outlined text-[16px] ${isEmailValid ? 'text-primary' : 'text-outline'}`}>
                          {isEmailValid ? 'check_circle' : 'pending'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Mobile Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Mobile Station Number <span className="text-primary">*</span>
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
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="e.g. 98765 43210"
                        className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                      />
                      <span className="material-symbols-outlined absolute right-3 text-[18px] text-on-surface-variant pointer-events-none">
                        cell_tower
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Master Password <span className="text-primary">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 bg-surface-container-high rounded-xl px-3.5 pr-10 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border border-surface-container-highest/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 p-1 text-on-surface-variant hover:text-white transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Confirm Password <span className="text-primary">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-11 bg-surface-container-high rounded-xl px-3.5 pr-10 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:bg-surface-bright transition-all border ${
                          confirmPassword && !doPasswordsMatch
                            ? 'border-error/60'
                            : confirmPassword && doPasswordsMatch
                            ? 'border-primary/60'
                            : 'border-surface-container-highest/60'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 p-1 text-on-surface-variant hover:text-white transition-colors"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Match Status */}
                {confirmPassword && (
                  <div className="flex items-center gap-1.5 -mt-1 text-[11px] font-mono">
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        doPasswordsMatch ? 'text-primary' : 'text-error'
                      }`}
                    >
                      {doPasswordsMatch ? 'check_circle' : 'error'}
                    </span>
                    <span className={doPasswordsMatch ? 'text-primary font-medium' : 'text-error'}>
                      {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}

                {/* Interactive Password Strength Meter */}
                {password && (
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-highest/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant">
                        Security Strength
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold uppercase ${
                          score <= 2
                            ? 'text-error'
                            : score === 3
                            ? 'text-amber-400'
                            : score === 4
                            ? 'text-secondary'
                            : 'text-primary'
                        }`}
                      >
                        {score <= 2 && 'Weak'}
                        {score === 3 && 'Fair'}
                        {score === 4 && 'Good'}
                        {score === 5 && 'Strong'}
                      </span>
                    </div>

                    {/* Progress Bar Segments */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((seg) => (
                        <div
                          key={seg}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            score >= seg
                              ? score <= 2
                                ? 'bg-error'
                                : score === 3
                                ? 'bg-amber-400'
                                : score === 4
                                ? 'bg-secondary'
                                : 'bg-primary'
                              : 'bg-surface-bright'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria Checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px] font-mono">
                      <div className={`flex items-center gap-1 ${passCriteria.length ? 'text-primary' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {passCriteria.length ? 'check' : 'close'}
                        </span>
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passCriteria.uppercase ? 'text-primary' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {passCriteria.uppercase ? 'check' : 'close'}
                        </span>
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passCriteria.lowercase ? 'text-primary' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {passCriteria.lowercase ? 'check' : 'close'}
                        </span>
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passCriteria.number ? 'text-primary' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {passCriteria.number ? 'check' : 'close'}
                        </span>
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 col-span-2 ${passCriteria.special ? 'text-primary' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {passCriteria.special ? 'check' : 'close'}
                        </span>
                        <span>Special Symbol (!@#$%...)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Terms & DPDP Privacy Policy Checkbox */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded bg-surface-container-high border-surface-container-highest text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
                  />
                  <label htmlFor="terms-check" className="text-xs text-on-surface-variant leading-tight cursor-pointer">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-primary hover:underline font-semibold"
                    >
                      NEXUS Terms of Service
                    </button>{' '}
                    and the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-primary hover:underline font-semibold"
                    >
                      DPDP Privacy Policy
                    </button>{' '}
                    (Digital Personal Data Protection Act 2023).
                  </label>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-error-container/40 text-error text-xs flex items-center gap-2 border border-error/30 animate-shake">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Primary CTA: Create Account */}
                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !doPasswordsMatch || !termsAccepted || idAvailability === 'taken'}
                  className="w-full h-12 mt-1 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] shadow-[0_0_16px_rgba(0,229,163,0.35)] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                      <span>Hashing Credentials &amp; Requesting Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account &amp; Verify</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Already have an account link */}
              <div className="pt-2 text-center text-xs text-on-surface-variant border-t border-surface-container-highest/40">
                <span>Already registered on NEXUS? </span>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFICATION CODE (OTP) */}
          {step === 'otp' && (
            <div className="w-full bg-surface-container rounded-2xl p-5 flex flex-col gap-4 shadow-md border border-surface-container-high/70">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-on-surface">Enter Verification Code</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Dispatched to <span className="text-primary font-mono font-semibold">{destinationMasked}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  className="text-[11px] font-mono text-secondary hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">edit</span>
                  <span>Edit Details</span>
                </button>
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-xl bg-surface-container-high border border-surface-container-highest flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">lock_clock</span>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  Single-use code valid for 5 minutes. Check the server terminal output for your 6-digit verification code.
                </p>
              </div>

              {infoMessage && (
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary text-xs flex items-center gap-2 border border-primary/30">
                  <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                      onClick={(e) => handleRegisterStep1(e)}
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
                      <span>Activating Citizen Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Activate Account</span>
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: REGISTRATION SUCCESS CARD */}
          {step === 'success' && createdUser && (
            <div className="w-full bg-surface-container rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-5 shadow-lg border border-primary/40 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shadow-[0_0_24px_rgba(0,229,163,0.4)]">
                <span className="material-symbols-outlined text-[36px]">verified</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-on-surface">Account Created Successfully!</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Welcome to NEXUS Sovereign Mesh Communications, <span className="text-white font-semibold">{createdUser.name}</span>.
                </p>
              </div>

              {/* Assigned NEXUS ID Card */}
              <div className="w-full p-4 rounded-xl bg-surface-container-high border border-surface-container-highest flex flex-col gap-2.5 items-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Your Assigned Sovereign NEXUS ID
                </span>
                <div className="flex items-center justify-center gap-2 w-full">
                  <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-primary">
                    {createdUser.nexusId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-2 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-primary active:scale-95 transition-all border border-surface-container-highest/60"
                    title="Copy NEXUS ID"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedId ? 'done' : 'content_copy'}
                    </span>
                  </button>
                </div>
                {copiedId && (
                  <span className="text-[11px] font-mono text-primary font-semibold animate-fade-in">
                    Copied to clipboard!
                  </span>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[10px] font-semibold">
                    ROLE: CITIZEN
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] font-semibold">
                    STATUS: ACTIVE
                  </span>
                </div>
              </div>

              {/* Enter Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.playSentSound();
                  onRegistrationSuccess(createdUser);
                }}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] shadow-[0_0_16px_rgba(0,229,163,0.35)] transition-all"
              >
                <span>Continue to NEXUS Terminal</span>
                <span className="material-symbols-outlined text-[20px]">login</span>
              </button>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="flex flex-col items-center gap-1.5 pt-2 text-center w-full">
            <div className="flex items-center gap-1.5 text-outline">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span className="font-mono text-[9px] tracking-wider uppercase">
                Digital Personal Data Protection (DPDP) Act 2023 Conformance
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-outline">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span className="font-mono text-[9px] tracking-wider uppercase">
                Client-Side WebCrypto ECDH P-256 + AES-256-GCM
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Terms & Privacy Policy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl max-w-[390px] w-full p-5 border border-surface-container-high shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                <h3 className="font-bold text-sm text-on-surface">Terms of Service &amp; DPDP Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs text-on-surface-variant max-h-72 overflow-y-auto pr-1">
              <p>
                <strong>1. Sovereign Data Protection:</strong> NEXUS adheres strictly to the Digital Personal Data Protection (DPDP) Act 2023. No unencrypted private communication or biometric credentials are ever stored on centralized servers.
              </p>
              <p>
                <strong>2. Client-Side WebCrypto Encryption:</strong> All message envelopes, voice notes, and transactions are protected via WebCrypto ECDH P-256 key exchange and AES-256-GCM authenticated encryption.
              </p>
              <p>
                <strong>3. Tactical Satellite Interop:</strong> Emergency and hybrid packets routed over the ISRO NavIC / GSAT transponder network are compressed and cryptographically signed before uplink.
              </p>
              <p>
                <strong>4. Sovereign Citizen Role:</strong> All new self-registrations default strictly to verified Citizen status. Elevated command privileges require administrative sign-off by sovereign node controllers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTermsAccepted(true);
                setShowTermsModal(false);
              }}
              className="w-full h-10 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Accept &amp; Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
