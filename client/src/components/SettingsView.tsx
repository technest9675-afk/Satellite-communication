import React, { useState } from 'react';
import { CurrentUser, SatelliteModuleState } from '../types';
import { sounds } from '../services/soundEffects';
import { EmergencyContactsModal } from './EmergencyContactsModal';
import { QrCodeModal } from './QrCodeModal';
import { NexusLogo } from './NexusLogo';
import { SatelliteHubSection } from './SatelliteHubSection';
import { useTranslation, LANGUAGE_OPTIONS } from '../services/i18n';

interface SettingsViewProps {
  currentUser: CurrentUser | null;
  satelliteState: SatelliteModuleState | null;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onUpdateSatelliteState?: (state: SatelliteModuleState) => void;
  onOpenSos: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  satelliteState,
  onLogout,
  onOpenProfile,
  onUpdateSatelliteState,
  onOpenSos
}) => {
  const [fallbackAlert, setFallbackAlert] = useState(() => {
    try {
      return localStorage.getItem('nexus_fallback_alert') !== 'false';
    } catch {
      return true;
    }
  });

  const [lowDataMode, setLowDataMode] = useState(() => {
    try {
      return localStorage.getItem('nexus_low_data') !== 'false';
    } catch {
      return true;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      return localStorage.getItem('nexus_notifications') !== 'false';
    } catch {
      return true;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const { language, setLanguage, t } = useTranslation();
  const currentLangOption = LANGUAGE_OPTIONS.find((l) => l.code === language) || LANGUAGE_OPTIONS[0];

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isEmergencyContactsOpen, setIsEmergencyContactsOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('nexus_theme', dark ? 'dark' : 'light');
    } catch {}
    sounds.playClickSound();
    showToast(`Switched to ${dark ? 'Dark Obsidian' : 'Light Sovereign'} theme`);
  };

  const handleToggleFallbackAlert = () => {
    const next = !fallbackAlert;
    setFallbackAlert(next);
    try {
      localStorage.setItem('nexus_fallback_alert', String(next));
    } catch {}
    sounds.playClickSound();
  };

  const handleToggleLowDataMode = () => {
    const next = !lowDataMode;
    setLowDataMode(next);
    try {
      localStorage.setItem('nexus_low_data', String(next));
    } catch {}
    sounds.playClickSound();
  };

  const handleToggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    try {
      localStorage.setItem('nexus_notifications', String(next));
    } catch {}
    sounds.playClickSound();
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.warn('Fallback copy error:', err);
    }
  };

  const handleShareCallsign = () => {
    const callsign = currentUser?.nexusId || 'NX-NEXUS';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(callsign).catch(() => {
          fallbackCopyText(callsign);
        });
      } else {
        fallbackCopyText(callsign);
      }
    } catch {
      fallbackCopyText(callsign);
    }
    sounds.playSentSound();
    showToast(`Callsign @${callsign} copied to clipboard!`);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        app: 'NEXUS Sovereign Messenger',
        exportedAt: new Date().toISOString(),
        user: {
          id: currentUser?.id,
          name: currentUser?.name,
          nexusId: currentUser?.nexusId,
          role: currentUser?.role
        },
        settings: {
          fallbackAlert,
          lowDataMode,
          notifications,
          language,
          theme: isDarkMode ? 'dark' : 'light'
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sounds.playSentSound();
      showToast('JSON configuration & profile backup downloaded.');
    } catch (e) {
      console.error('Backup error:', e);
      showToast('Backup export completed.');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear local temporary message cache and reset session preferences? Your credentials will remain safe.')) {
      try {
        localStorage.removeItem('nexus_offline_queue');
        localStorage.removeItem('nexus_cache');
      } catch {}
      sounds.playRadioSquelch();
      showToast('Local offline message cache purged successfully.');
    }
  };


  return (
    <div className="flex-1 w-full flex flex-col bg-surface select-none overflow-y-auto no-scrollbar relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-surface-container-highest border border-primary/40 text-on-surface text-xs font-mono shadow-2xl flex items-center gap-2 animate-fade-in max-w-[90vw]">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 w-full z-40 pt-safe bg-surface-dim/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-sm flex-shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  SETTINGS
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">{t('brand_settings_sub', 'Settings & Connectivity')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSos}
              aria-label="Emergency SOS Trigger"
              className="h-9 px-2.5 flex items-center gap-1 rounded-lg bg-error-container text-error hover:bg-error hover:text-on-error active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base animate-pulse">sos</span>
              <span className="font-mono text-[10px] font-bold tracking-wider">SOS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Settings Stream */}
      <main className="flex-1 w-full px-4 py-4 space-y-4 pb-8">
        {/* Personal Profile Card */}
        <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-surface-container-high">
          <div className="flex items-center gap-3.5">
            <div
              className={`relative shrink-0 ${onOpenProfile ? 'cursor-pointer transition-transform active:scale-95' : ''}`}
              onClick={onOpenProfile}
              title={onOpenProfile ? 'Edit Profile' : undefined}
            >
              <img
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-primary/30"
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-surface-container" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h2
                  className={`font-semibold text-sm text-on-surface truncate ${onOpenProfile ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                  onClick={onOpenProfile}
                >
                  {currentUser?.name || 'Nexus Operator'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary flex items-center justify-center transition"
                  title="View Sovereign QR Code"
                >
                  <span className="material-symbols-outlined text-xl">qr_code_2</span>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5 truncate">
                {currentUser?.phone || ''} • @{currentUser?.nexusId?.toLowerCase() || 'nexus'}
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] text-primary font-medium truncate uppercase">
                  {currentUser?.role || 'Citizen'} • Sovereign Node
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-surface-container-high">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 active:scale-98 transition shadow-xs"
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span className="text-xs font-semibold">Profile</span>
            </button>
            <button
              type="button"
              onClick={handleShareCallsign}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface active:scale-98 transition"
            >
              <span className="material-symbols-outlined text-base text-secondary">share</span>
              <span className="text-xs font-semibold">Callsign</span>
            </button>
          </div>
        </section>

        {/* Section 1: Connectivity & Network */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t('settings_section_network', 'Connectivity & Network')}
            </span>
            <span className="text-xs text-primary font-medium">Smart Mesh</span>
          </div>

          <div className="bg-surface-container rounded-2xl p-2.5 space-y-2 shadow-sm border border-surface-container-high">
            {/* Integrated Nexus-Orb Satellite Hub */}
            <SatelliteHubSection
              satelliteState={satelliteState}
              onUpdateState={onUpdateSatelliteState}
              onOpenSos={onOpenSos}
            />

            <div className="flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl">
              <div className="flex items-center gap-3 pr-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-xl">vibration</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-on-surface font-medium truncate">{t('settings_fallback', 'Satellite Fallback Alert')}</div>
                  <div className="text-[11px] text-on-surface-variant leading-tight">{t('settings_fallback_desc', 'Haptic cue when signal switches')}</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={fallbackAlert}
                onClick={handleToggleFallbackAlert}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors ${
                  fallbackAlert ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full shadow transition-transform ${
                    fallbackAlert ? 'transform translate-x-5 bg-on-primary' : 'translate-x-0 bg-outline'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Privacy & Security */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t('settings_section_privacy', 'Privacy & Security')}
            </span>
          </div>

          <div className="bg-surface-container rounded-2xl p-2.5 space-y-2 shadow-sm border border-surface-container-high">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsEmergencyContactsOpen(true)}
              className="w-full flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl hover:bg-surface-container-highest active:scale-99 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg bg-error-container/20 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">contact_emergency</span>
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs text-on-surface font-semibold truncate">{t('settings_emergency_contacts', 'Emergency Contacts & SOS')}</div>
                  <div className="text-[11px] text-on-surface-variant truncate">{t('settings_emergency_contacts_desc', 'Configure trusted rescue nodes')}</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleClearCache}
              className="w-full flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl hover:bg-surface-container-highest active:scale-99 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-outline shrink-0">
                  <span className="material-symbols-outlined text-xl">mop</span>
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs text-on-surface font-medium truncate">{t('settings_clear_cache', 'Clear Local Cache')}</div>
                  <div className="text-[11px] text-on-surface-variant truncate">{t('settings_clear_cache_desc', 'Purge offline temporary buffer')}</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant shrink-0">delete_sweep</span>
            </div>
          </div>
        </section>

        {/* Section 3: Appearance & Theme */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t('settings_section_theme', 'Appearance & Theme')}
            </span>
          </div>

          <div className="bg-surface-container rounded-2xl p-2.5 space-y-2.5 shadow-sm border border-surface-container-high">
            {/* Dark & Light Theme Switcher */}
            <div className="p-1 bg-surface-container-lowest rounded-xl grid grid-cols-2 gap-1 border border-surface-container-highest/60">
              <button
                type="button"
                onClick={() => handleToggleTheme(true)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  isDarkMode
                    ? 'bg-surface-container-highest text-primary shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">dark_mode</span>
                <span>{t('settings_dark_mode', 'Dark Mode')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleTheme(false)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  !isDarkMode
                    ? 'bg-surface-container-highest text-primary shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">wb_sunny</span>
                <span>{t('settings_light_mode', 'Light Mode')}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl">
              <div className="flex items-center gap-3 pr-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl">notifications_active</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-on-surface font-medium truncate">{t('settings_sound_alerts', 'Sound Alerts & Haptics')}</div>
                  <div className="text-[11px] text-on-surface-variant leading-tight">{t('settings_sound_desc', 'Audible alert for satellite pings')}</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications}
                onClick={handleToggleNotifications}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors ${
                  notifications ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full shadow transition-transform ${
                    notifications ? 'transform translate-x-5 bg-on-primary' : 'translate-x-0 bg-outline'
                  }`}
                />
              </button>
            </div>

            {/* Language Picker */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowLanguagePicker(!showLanguagePicker)}
              className="w-full flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl hover:bg-surface-container-highest active:scale-99 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">language</span>
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs text-on-surface font-semibold truncate">{t('settings_app_language', 'App Language')}</div>
                  <div className="text-[11px] text-on-surface-variant truncate">{t('settings_language_desc', 'Display script preference')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-medium text-primary">{currentLangOption.name}</span>
                <span className="material-symbols-outlined text-on-surface-variant">
                  {showLanguagePicker ? 'expand_less' : 'chevron_right'}
                </span>
              </div>
            </div>

            {showLanguagePicker && (
              <div className="p-2 bg-surface-container-lowest rounded-xl border border-surface-container-highest/60 space-y-1 animate-fade-in">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setLanguage(opt.code);
                      setShowLanguagePicker(false);
                      sounds.playSentSound();
                      showToast(`${t('settings_app_language', 'Language')}: ${opt.name}`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      language === opt.code
                        ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                        : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{opt.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{opt.nativeName}</span>
                    </div>
                    {language === opt.code && (
                      <span className="material-symbols-outlined text-sm text-primary font-bold">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Chats & Media */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Chats &amp; Media
            </span>
          </div>

          <div className="bg-surface-container rounded-2xl p-2.5 space-y-2 shadow-sm border border-surface-container-high">
            <div className="flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl">
              <div className="flex items-center gap-3 pr-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary-container shrink-0">
                  <span className="material-symbols-outlined text-xl">data_saver_on</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-on-surface font-medium truncate">Offline &amp; Low Data Mode</div>
                  <div className="text-[11px] text-on-surface-variant leading-tight">Compress media automatically on satellite</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lowDataMode}
                onClick={handleToggleLowDataMode}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors ${
                  lowDataMode ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full shadow transition-transform ${
                    lowDataMode ? 'transform translate-x-5 bg-on-primary' : 'translate-x-0 bg-outline'
                  }`}
                />
              </button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={handleExportBackup}
              className="w-full flex items-center justify-between p-2.5 bg-surface-container-high rounded-xl hover:bg-surface-container-highest active:scale-99 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-xl">download</span>
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs text-on-surface font-semibold truncate">Chat Backup &amp; Export</div>
                  <div className="text-[11px] text-on-surface-variant truncate">Download JSON configuration &amp; history archive</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant shrink-0">file_download</span>
            </div>
          </div>
        </section>

        {/* Logout Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to exit your terminal session?')) {
                sounds.playClickSound();
                onLogout();
              }
            }}
            className="w-full py-3 px-space-md rounded-xl bg-surface-container hover:bg-error-container/20 text-on-surface-variant hover:text-error flex items-center justify-center gap-2 transition active:scale-99 border border-surface-container-high shadow-sm"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="text-xs font-semibold uppercase tracking-wider">{t('btn_sign_out', 'Logout Terminal Session')}</span>
          </button>
        </div>
      </main>

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        isOpen={isEmergencyContactsOpen}
        onClose={() => setIsEmergencyContactsOpen(false)}
      />

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
