import React, { useState, useEffect, useRef } from 'react';
import { CurrentUser, SatelliteModuleState } from '../types';
import { sounds } from '../services/soundEffects';
import { getOrCreateLocalIdentity } from '../services/cryptoEngine';
import { NexusLogo } from './NexusLogo';
import { QrCodeModal } from './QrCodeModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  satelliteState?: SatelliteModuleState | null;
  onUpdateProfile?: (data: Partial<CurrentUser>) => Promise<void>;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  satelliteState,
  onUpdateProfile,
  onOpenSettings,
  onLogout
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutInput, setAboutInput] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('Computing WebCrypto NIST P-256 Digest...');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setNameInput(currentUser.name || '');
      setAboutInput(currentUser.about || 'Available on NavIC / GSAT-7A • Sovereign E2EE Terminal');
      setIsEditingName(false);
      setIsEditingAbout(false);

      getOrCreateLocalIdentity()
        .then((id) => {
          if (id.fingerprint) setDeviceFingerprint(id.fingerprint);
        })
        .catch(() => setDeviceFingerprint('LOCAL-KEY-AUTHENTICATED'));
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyNexusId = () => {
    const id = currentUser.nexusId || 'NX-NEXUS';
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    sounds.playSentSound();
    showToast('NEXUS ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard?.writeText(deviceFingerprint);
    setCopiedFingerprint(true);
    sounds.playSentSound();
    showToast('Safety fingerprint copied to clipboard');
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === currentUser.name) {
      setIsEditingName(false);
      return;
    }
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ name: nameInput.trim() });
      }
      sounds.playSentSound();
      showToast('Name updated successfully');
      setIsEditingName(false);
    } catch {
      showToast('Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    if (aboutInput.trim() === currentUser.about) {
      setIsEditingAbout(false);
      return;
    }
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ about: aboutInput.trim() });
      }
      sounds.playSentSound();
      showToast('Status updated successfully');
      setIsEditingAbout(false);
    } catch {
      showToast('Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Profile Picture Directly from Device Gallery Only
  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    setIsSaving(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setIsSaving(false);
      showToast('Failed to read image file');
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setIsSaving(false);
        showToast('Failed to load image');
      };
      img.onload = async () => {
        try {
          // Downscale and center crop to 400x400 square for fast, crisp avatar rendering
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable');

          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          if (onUpdateProfile) {
            await onUpdateProfile({ avatar: compressedDataUrl });
            sounds.playSentSound();
            showToast('Profile photo updated from gallery!');
          }
        } catch (err) {
          console.error('Gallery image upload error:', err);
          showToast('Failed to update profile photo');
        } finally {
          setIsSaving(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so same photo can be picked again if desired
    e.target.value = '';
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-fade-in select-none">
        <div className="relative w-full max-w-[390px] max-h-[90dvh] bg-surface dark:bg-[#0b121c] rounded-2xl border border-surface-container-highest dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-on-surface">
          {/* Header */}
          <header className="px-4 py-3 bg-surface-dim dark:bg-[#0e1724] border-b border-surface-container-highest dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Back to Chats"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <NexusLogo size={28} className="shrink-0" glow />
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-on-surface dark:text-white truncate">Profile</h2>
                <p className="text-[10px] text-on-surface-variant dark:text-slate-400 font-mono truncate">Sovereign Identity Node</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary dark:bg-slate-800 dark:text-slate-300 dark:hover:text-primary dark:hover:bg-slate-700 transition-colors"
                title="View Sovereign QR Code"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          {/* Toast Notification */}
          {toastMsg && (
            <div className="px-4 py-1.5 bg-primary-container text-on-primary-container dark:bg-emerald-950/90 dark:text-emerald-300 border-b border-primary/20 dark:border-emerald-500/40 text-xs flex items-center justify-center gap-1.5 shrink-0 animate-fade-in font-medium">
              <span className="material-symbols-outlined text-sm text-primary dark:text-emerald-400">check_circle</span>
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {/* HERO AVATAR SECTION */}
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                title="Click to choose profile picture from device gallery"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={currentUser.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/40 shadow-xl bg-surface-container-highest dark:bg-slate-900 group-hover:opacity-90 transition-opacity"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary ring-2 ring-surface dark:ring-[#0b121c]" />

                {/* Camera / Gallery Trigger Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-primary text-on-primary hover:bg-primary-fixed ring-2 ring-surface dark:ring-[#0b121c] flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Upload from Device Gallery"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                </button>
              </div>

              {/* Hidden Native File Input for Gallery Selection Only */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryImageUpload}
              />

              {/* Explicit 'Choose from Gallery' Action Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px] text-primary">photo_library</span>
                <span>{isSaving ? 'Processing Photo...' : 'Choose from Gallery'}</span>
              </button>

              {/* Name Display & In-place Edit */}
              <div className="w-full">
                {isEditingName ? (
                  <div className="flex items-center justify-center gap-1.5 max-w-xs mx-auto">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="bg-surface-container-lowest dark:bg-slate-900 border border-primary rounded-lg px-2.5 py-1 text-sm text-on-surface dark:text-white font-bold text-center focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveName}
                      className="p-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed transition-colors"
                      title="Save Name"
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(currentUser.name || '');
                        setIsEditingName(false);
                      }}
                      className="p-1.5 rounded-lg bg-surface-container-high dark:bg-slate-800 text-on-surface-variant hover:text-on-surface dark:text-slate-400 dark:hover:text-white transition-colors"
                      title="Cancel"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <h1 className="font-bold text-base text-on-surface dark:text-white truncate">{currentUser.name}</h1>
                    <span className="material-symbols-outlined text-[17px] text-primary" title="Sovereign Verified">
                      verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-on-surface-variant hover:text-primary dark:text-slate-500 dark:hover:text-primary transition-colors"
                      title="Edit Name"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                )}

                {/* Role & Verification Tag */}
                <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-primary-container text-on-primary-container border border-primary/20">
                    {currentUser.role === 'admin' ? 'Commanding Officer (Admin)' : 'Verified Citizen Node'}
                  </span>

                </div>
              </div>
            </div>

            {/* IDENTITY DETAILS CARD */}
            <div className="p-3.5 bg-surface-container dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-3 shadow-sm">
              {/* Unique NEXUS ID with Copy */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-on-surface-variant dark:text-slate-400 uppercase font-semibold">Unique Sovereign NEXUS ID</p>
                  <p className="text-sm font-mono font-bold text-primary truncate mt-0.5">
                    @{currentUser.nexusId || 'NX-NEXUS'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNexusId}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest dark:bg-slate-800 dark:hover:bg-slate-700 text-on-surface dark:text-slate-300 text-xs font-mono flex items-center gap-1 shrink-0 transition-colors border border-surface-container-highest/60"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedId ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Mobile Phone Number */}
              <div className="pt-2 border-t border-surface-container-highest dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-on-surface-variant dark:text-slate-400 uppercase font-semibold">Registered Mobile</p>
                  <p className="text-xs font-mono font-semibold text-on-surface dark:text-white mt-0.5">
                    {currentUser.phone || '+91 90000 00000'}
                  </p>
                </div>
                <span className="text-[10px] text-primary font-mono flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-xs">shield</span>
                  <span>Verified</span>
                </span>
              </div>

              {/* About / Status */}
              <div className="pt-2 border-t border-surface-container-highest dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-mono text-on-surface-variant dark:text-slate-400 uppercase font-semibold">Status / Tactical Bio</p>
                  {!isEditingAbout && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAbout(true)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingAbout ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={aboutInput}
                      onChange={(e) => setAboutInput(e.target.value)}
                      className="w-full bg-surface-container-lowest dark:bg-[#070b12] border border-primary rounded-xl p-2 text-xs text-on-surface dark:text-white placeholder:text-outline focus:outline-none"
                      rows={2}
                      maxLength={180}
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAboutInput(currentUser.about || '');
                          setIsEditingAbout(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveAbout}
                        className="px-3 py-1 rounded-lg bg-primary text-on-primary text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed italic">
                    "{aboutInput || 'Available on NavIC / GSAT-7A • Sovereign E2EE Terminal'}"
                  </p>
                )}
              </div>
            </div>

            {/* HARDWARE & WEBCRYPTO DETAILS */}
            <div className="p-3.5 bg-surface-container dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary text-base">key</span>
                  <span className="text-xs font-bold text-on-surface dark:text-white">NIST P-256 WebCrypto Safety Number</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyFingerprint}
                  className="text-[10px] text-primary hover:underline font-mono flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-xs">
                    {copiedFingerprint ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedFingerprint ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-surface-container-lowest dark:bg-black/60 rounded-xl border border-surface-container-highest/60 dark:border-slate-800/80 font-mono text-[10px] text-primary dark:text-emerald-400 tracking-wider break-all text-center select-all">
                {deviceFingerprint}
              </div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant dark:text-slate-400 pt-1">
                <span>Satellite Transceiver:</span>
                <span className="font-mono text-primary font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span>NavIC / GSAT-7A ({satelliteState?.battery || 94}% Bat)</span>
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="w-full p-3 rounded-xl bg-surface-container hover:bg-surface-container-high dark:bg-slate-900 dark:hover:bg-slate-800 border border-surface-container-highest dark:border-slate-800 flex items-center justify-between text-left transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">qr_code_2</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface dark:text-white truncate">My Sovereign QR Code</p>
                    <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate">Instant peer scan &amp; verification</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
              </button>
            </div>

            {/* SETTINGS & LOGOUT */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onOpenSettings) onOpenSettings();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high dark:bg-slate-900 dark:hover:bg-slate-800 border border-surface-container-highest dark:border-slate-800 flex items-center justify-between text-xs text-on-surface dark:text-slate-300 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">tune</span>
                  <span className="font-semibold">Open Application Settings</span>
                </div>
                <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-error-container/40 hover:bg-error-container/70 border border-error/30 flex items-center justify-center gap-2 text-xs text-error font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out of Terminal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
};
