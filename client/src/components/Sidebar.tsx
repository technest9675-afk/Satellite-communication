import React, { useState } from 'react';
import { Contact, CurrentUser, SatelliteModuleState } from '../types';
import { sounds } from '../services/soundEffects';
import { NexusLogo } from './NexusLogo';
import { useTranslation } from '../services/i18n';

interface SidebarProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  currentUser: CurrentUser | null;
  satelliteState: SatelliteModuleState | null;
  onOpenContactInfo?: (contact: Contact) => void;
  onOpenProfile?: () => void;
  onOpenStatus: () => void;
  onOpenNewChat: () => void;
  onOpenAddContact?: () => void;
  onOpenWalkieTalkie: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  contacts,
  activeContactId,
  onSelectContact,
  currentUser,
  satelliteState,
  onOpenContactInfo,
  onOpenProfile,
  onOpenStatus,
  onOpenNewChat,
  onOpenAddContact,
  onOpenWalkieTalkie,
  onOpenAdminPanel,
  onLogout,
  soundMuted,
  onToggleSound
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'satellite' | 'dispatches'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nexusId && c.nexusId.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeFilter === 'direct') return !c.isGroup;
    if (activeFilter === 'satellite') return c.satelliteLinked;
    if (activeFilter === 'dispatches') return c.isGroup;
    return true;
  });

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const isSatConnected = satelliteState?.hardwareConnected ?? true;
  const batteryPct = satelliteState?.battery ?? 94;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="w-full h-full flex flex-col bg-surface select-none relative overflow-hidden">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 w-full bg-surface-dim/90 backdrop-blur-xl border-b border-surface-container-high/60 pt-safe shrink-0 shadow-sm">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          {/* Brand & Unified Nexus Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {currentUser?.role === 'admin' ? 'Admin' : 'Chats'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">{t("brand_chats_sub", "Sovereign Mesh Chats")}</p>
            </div>
          </div>

          {/* Clean Action Icons: Search, Profile Avatar, Options Menu */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Direct Add Contact Button */}
            <button
              type="button"
              aria-label="Add Contact"
              onClick={() => {
                if (onOpenAddContact) onOpenAddContact();
                else onOpenNewChat();
              }}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
              title="Add New Contact"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </button>

            {/* Search Button */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>

            {/* User Profile Avatar with Online Beacon */}
            <div
              className="relative cursor-pointer shrink-0 transition-transform active:scale-95 hover:opacity-90"
              onClick={() => {
                if (onOpenProfile) onOpenProfile();
                sounds.playClickSound();
              }}
              title="My Profile"
            >
              <img
                alt="User Profile"
                className="w-8 h-8 rounded-full object-cover ring-1.5 ring-primary/40 bg-surface-container"
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
            </div>

            {/* Options Menu Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Options Menu"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-10 w-52 bg-surface-container-high rounded-xl border border-surface-container-highest shadow-2xl p-1 z-50 flex flex-col space-y-0.5 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenProfile) onOpenProfile();
                        sounds.playClickSound();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-on-surface hover:bg-surface-container-highest transition text-left"
                    >
                      <span className="material-symbols-outlined text-base text-primary">account_circle</span>
                      <span className="font-medium">My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenAddContact) onOpenAddContact();
                        else onOpenNewChat();
                        sounds.playClickSound();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-primary font-semibold hover:bg-surface-container-highest transition text-left"
                    >
                      <span className="material-symbols-outlined text-base text-primary">person_add</span>
                      <span>{t("btn_add_contact", "Add New Contact")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenStatus();
                        sounds.playClickSound();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-on-surface hover:bg-surface-container-highest transition text-left"
                    >
                      <span className="material-symbols-outlined text-base text-primary">history_toggle_off</span>
                      <span>Status Updates</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWalkieTalkie();
                        sounds.playClickSound();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-on-surface hover:bg-surface-container-highest transition text-left"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">radio</span>
                      <span>Walkie-Talkie Radio</span>
                    </button>

                    {/* RBAC: Only show Admin Console if user is admin */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenAdminPanel();
                          sounds.playClickSound();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-tertiary font-semibold hover:bg-surface-container-highest transition text-left"
                      >
                        <span className="material-symbols-outlined text-base text-tertiary">admin_panel_settings</span>
                        <span>Admin Console</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onToggleSound();
                        sounds.playClickSound();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-on-surface hover:bg-surface-container-highest transition text-left border-t border-surface-container-highest/60 mt-1 pt-1.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-base text-on-surface-variant">
                          {soundMuted ? 'volume_off' : 'volume_up'}
                        </span>
                        <span>Sound Effects</span>
                      </div>
                      <span className="text-[10px] font-mono text-outline uppercase">
                        {soundMuted ? 'OFF' : 'ON'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-error hover:bg-surface-container-highest transition text-left border-t border-surface-container-highest/60 mt-0.5 pt-1.5"
                    >
                      <span className="material-symbols-outlined text-base text-error">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchVisible && (
          <div className="px-4 pb-3 animate-fade-in">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] absolute left-3">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("search_chats", "Search chats, callsigns, or messages...")}
                autoFocus
                className="w-full h-10 bg-surface-container-low rounded-xl pl-9 pr-8 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container border border-surface-container-highest/60 transition-all font-sans"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Segmented Filter Chips */}
        <div className="px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: t('filter_all_chats', 'All Chats'), count: contacts.length },
            { id: 'direct', label: t('filter_direct', 'Direct'), count: contacts.filter((c) => !c.isGroup).length },
            { id: 'satellite', label: t('filter_satellite', 'Satellite'), count: contacts.filter((c) => c.satelliteLinked).length },
            { id: 'dispatches', label: t('filter_groups', 'Groups'), count: contacts.filter((c) => c.isGroup).length }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'all' && totalUnread > 0 ? (
                <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-mono font-bold">
                  {totalUnread}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {/* CONTACTS CHAT LIST */}
      <main className="flex-1 overflow-y-auto no-scrollbar divide-y divide-surface-container-high/30">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-outline space-y-2.5">
            <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
            <p className="text-xs">No channels matching query</p>
            <button
              type="button"
              onClick={() => {
                if (onOpenAddContact) onOpenAddContact();
                else onOpenNewChat();
              }}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-primary text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Add New Contact</span>
            </button>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isActive = contact.id === activeContactId;
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors relative min-h-[64px] ${
                  isActive
                    ? 'bg-surface-container-high/90 border-l-4 border-primary'
                    : 'hover:bg-surface-container-low/70'
                }`}
              >
                {/* Avatar with Online or Satellite Beacon - Clicking Opens WhatsApp-Style Info Screen */}
                <div
                  className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenContactInfo) onOpenContactInfo(contact);
                  }}
                  title={contact.isGroup ? 'View Group Info' : 'View Contact Info'}
                >
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-surface-container-highest hover:ring-2 hover:ring-primary/60 transition-all"
                  />
                  {contact.online ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary ring-2 ring-surface" />
                  ) : contact.satelliteLinked ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary ring-2 ring-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[8px] text-black">satellite_alt</span>
                    </span>
                  ) : null}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-sm text-on-surface truncate">
                        {contact.name}
                      </span>
                      {contact.verifiedBharat && (
                        <span className="material-symbols-outlined text-[15px] text-primary shrink-0" title="Verified Sovereign Node">
                          verified
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-outline shrink-0">
                      {contact.lastMessageTime || ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-on-surface-variant truncate font-sans">
                      {contact.lastMessage || 'No messages yet'}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {contact.satelliteLinked && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary/10 text-secondary border border-secondary/20">
                          SAT
                        </span>
                      )}
                      {(contact.unreadCount || 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-mono font-bold">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Floating Action Button (FAB) for New Chat */}
      <button
        type="button"
        aria-label="New Encrypted Chat"
        onClick={onOpenNewChat}
        className="absolute bottom-5 right-4 z-30 w-13 h-13 p-3.5 rounded-2xl bg-primary text-on-primary shadow-[0_6px_20px_rgba(0,229,163,0.35)] flex items-center justify-center hover:bg-primary-fixed active:scale-95 transition-all"
        title="Start New Mesh Chat"
      >
        <span className="material-symbols-outlined text-[24px]">edit_square</span>
      </button>
    </div>
  );
};
