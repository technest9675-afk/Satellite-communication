import React from 'react';
import { useTranslation } from '../services/i18n';

export type TabType = 'chats' | 'calls' | 'satellite' | 'sos' | 'settings';

interface BottomNavBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = React.memo(({
  activeTab,
  onSelectTab,
  unreadCount = 0
}) => {
  const { t } = useTranslation();

  return (
    <nav className="sticky bottom-0 z-40 w-full bg-surface/95 backdrop-blur-xl border-t border-surface-container-high/60 pb-safe select-none shadow-[0_-2px_16px_rgba(0,0,0,0.15)] flex-shrink-0">
      <div className="w-full grid grid-cols-5 h-16 items-center px-1">
        {/* Tab 1: Chats */}
        <button
          type="button"
          onClick={() => onSelectTab('chats')}
          className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 transition-colors h-full overflow-hidden w-full ${
            activeTab === 'chats' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center relative shrink-0">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: activeTab === 'chats' ? "'FILL' 1" : "'FILL' 0" }}
            >
              chat_bubble
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-primary text-[8px] font-mono font-bold text-on-primary shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate max-w-full text-center px-0.5">
            {t('nav_chats', 'Chats')}
          </span>
          {activeTab === 'chats' && (
            <span className="absolute bottom-1 w-5 sm:w-6 h-0.5 bg-primary rounded-full shadow-sm" />
          )}
        </button>

        {/* Tab 2: Calls */}
        <button
          type="button"
          onClick={() => onSelectTab('calls')}
          className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 transition-colors h-full overflow-hidden w-full ${
            activeTab === 'calls' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center relative shrink-0">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: activeTab === 'calls' ? "'FILL' 1" : "'FILL' 0" }}
            >
              call
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight truncate max-w-full text-center px-0.5">
            {t('nav_calls', 'Calls')}
          </span>
          {activeTab === 'calls' && (
            <span className="absolute bottom-1 w-5 sm:w-6 h-0.5 bg-primary rounded-full shadow-sm" />
          )}
        </button>

        {/* Tab 3: Satellite */}
        <button
          type="button"
          onClick={() => onSelectTab('satellite')}
          className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 transition-colors h-full overflow-hidden w-full ${
            activeTab === 'satellite' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center relative shrink-0">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: activeTab === 'satellite' ? "'FILL' 1" : "'FILL' 0" }}
            >
              satellite_alt
            </span>
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-secondary ring-1 ring-surface-dim" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight truncate max-w-full text-center px-0.5">
            {t('nav_satellite', 'Satellite')}
          </span>
          {activeTab === 'satellite' && (
            <span className="absolute bottom-1 w-5 sm:w-6 h-0.5 bg-primary rounded-full shadow-sm" />
          )}
        </button>

        {/* Tab 4: SOS */}
        <button
          type="button"
          onClick={() => onSelectTab('sos')}
          className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 transition-colors h-full overflow-hidden w-full ${
            activeTab === 'sos' ? 'text-error' : 'text-error/80 hover:text-error'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center relative shrink-0">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sos
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error animate-ping opacity-60" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-error" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight uppercase truncate max-w-full text-center px-0.5">
            {t('nav_sos', 'SOS')}
          </span>
          {activeTab === 'sos' && (
            <span className="absolute bottom-1 w-5 sm:w-6 h-0.5 bg-error rounded-full shadow-sm" />
          )}
        </button>

        {/* Tab 5: Settings */}
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 transition-colors h-full overflow-hidden w-full ${
            activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center relative shrink-0">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: activeTab === 'settings' ? "'FILL' 1" : "'FILL' 0" }}
            >
              tune
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium tracking-tight truncate max-w-full text-center px-0.5">
            {t('nav_settings', 'Settings')}
          </span>
          {activeTab === 'settings' && (
            <span className="absolute bottom-1 w-5 sm:w-6 h-0.5 bg-primary rounded-full shadow-sm" />
          )}
        </button>
      </div>
    </nav>
  );
});
