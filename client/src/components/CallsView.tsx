import React, { useState, useEffect } from 'react';
import { Contact, CurrentUser } from '../types';
import { sounds } from '../services/soundEffects';
import { NexusLogo } from './NexusLogo';

interface CallsViewProps {
  contacts: Contact[];
  currentUser?: CurrentUser | null;
  onStartVoiceCall: (contact: Contact) => void;
  onStartVideoCall: (contact: Contact) => void;
  onOpenWalkieTalkie: () => void;
  onOpenSos: () => void;
  onOpenAddContact?: () => void;
}

interface CallRecord {
  id: string;
  contact: {
    id?: string;
    name: string;
    avatar: string;
    nexusId?: string;
    phone?: string;
    satelliteLinked?: boolean;
  };
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  mode: 'satellite' | 'internet';
  status: 'completed' | 'missed';
  duration: string;
}

export const CallsView: React.FC<CallsViewProps> = ({
  contacts,
  currentUser,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenWalkieTalkie,
  onOpenSos,
  onOpenAddContact
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');
  const [selectedCallType, setSelectedCallType] = useState<'voice' | 'video' | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const isDemo = currentUser?.role === 'demo';

  const [callHistory, setCallHistory] = useState<CallRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_call_history');
      if (saved) return JSON.parse(saved);
      if (isDemo && contacts.length > 0) {
        return [
          {
            id: 'c1',
            contact: {
              id: contacts[0]?.id || 'c1',
              name: contacts[0]?.name || 'Elena Rostova',
              avatar: contacts[0]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              nexusId: contacts[0]?.nexusId || 'NX-ELENA',
              satelliteLinked: true
            },
            type: 'voice',
            direction: 'incoming',
            timestamp: 'Today, 10:14 AM',
            mode: 'satellite',
            status: 'completed',
            duration: '02:45'
          },
          {
            id: 'c2',
            contact: {
              id: contacts[1]?.id || 'c2',
              name: contacts[1]?.name || 'Alpine SAR Ops',
              avatar: contacts[1]?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              nexusId: contacts[1]?.nexusId || 'NX-SAR-DISPATCH',
              satelliteLinked: false
            },
            type: 'video',
            direction: 'outgoing',
            timestamp: 'Yesterday, 04:30 PM',
            mode: 'internet',
            status: 'completed',
            duration: '08:12'
          }
        ];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Reload call history if storage updates
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('nexus_call_history');
        if (saved) setCallHistory(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleInitiateCall = (type: 'voice' | 'video') => {
    sounds.playClickSound();
    if (contacts.length === 0) {
      if (onOpenAddContact) {
        onOpenAddContact();
      } else {
        showToast('No contacts found. Add contacts first.');
      }
      return;
    }
    if (contacts.length === 1) {
      if (type === 'voice') onStartVoiceCall(contacts[0]);
      else onStartVideoCall(contacts[0]);
      return;
    }
    setSelectedCallType(type);
    setIsPickerOpen(true);
  };

  const handleSelectContactForCall = (contact: Contact) => {
    setIsPickerOpen(false);
    sounds.playSentSound();
    if (selectedCallType === 'video') {
      onStartVideoCall(contact);
    } else {
      onStartVoiceCall(contact);
    }
  };

  const filteredCalls = callHistory.filter((c) => activeTab === 'all' || c.status === 'missed');

  return (
    <div className="flex-1 w-full flex flex-col bg-surface select-none overflow-y-auto no-scrollbar relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-surface-container-highest border border-primary/40 text-on-surface text-xs font-mono shadow-2xl flex items-center gap-2 animate-fade-in max-w-[90vw]">
          <span className="material-symbols-outlined text-primary text-base">info</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 w-full z-40 pt-safe bg-surface-dim/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-sm flex-shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <NexusLogo size={36} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base font-bold tracking-tight text-on-surface">Nexus</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  CALLS
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">Low-Bandwidth Satellite Audio &amp; Video</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenWalkieTalkie}
              className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-bright text-secondary text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-base">radio</span>
              <span>PTT Radio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-4 space-y-4 pb-8">
        {/* Quick Action Tiles - 2x2 Grid with Identical Heights */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleInitiateCall('voice')}
            className="p-3.5 h-[110px] rounded-2xl bg-surface-container border border-surface-container-high hover:border-primary/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">call</span>
            </div>
            <div>
              <span className="font-semibold text-xs text-on-surface block leading-tight">Voice Call</span>
              <span className="font-mono text-[10px] text-on-surface-variant block mt-0.5">2.4kbps Sat-Codec</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleInitiateCall('video')}
            className="p-3.5 h-[110px] rounded-2xl bg-surface-container border border-surface-container-high hover:border-secondary/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">videocam</span>
            </div>
            <div>
              <span className="font-semibold text-xs text-on-surface block leading-tight">Video Link</span>
              <span className="font-mono text-[10px] text-on-surface-variant block mt-0.5">Adaptive Frame Flow</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenWalkieTalkie}
            className="p-3.5 h-[110px] rounded-2xl bg-surface-container border border-surface-container-high hover:border-amber-500/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">radio</span>
            </div>
            <div>
              <span className="font-semibold text-xs text-on-surface block leading-tight">Walkie-Talkie</span>
              <span className="font-mono text-[10px] text-on-surface-variant block mt-0.5">Instant PTT Burst</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenSos}
            className="p-3.5 h-[110px] rounded-2xl bg-surface-container border border-surface-container-high hover:border-error/40 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">sos</span>
            </div>
            <div>
              <span className="font-semibold text-xs text-on-surface block leading-tight">Distress Beacon</span>
              <span className="font-mono text-[10px] text-error font-medium block mt-0.5">Emergency SAR</span>
            </div>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Recent Calls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('missed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'missed'
                ? 'bg-error-container text-error'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Missed
          </button>
        </div>

        {/* Call Log List or Empty State */}
        {filteredCalls.length > 0 ? (
          <div className="flex flex-col divide-y divide-surface-container-high/60 bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden shadow-md">
            {filteredCalls.map((call) => (
              <div key={call.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      alt={call.contact?.name || 'Contact'}
                      src={call.contact?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      className="w-11 h-11 rounded-2xl object-cover ring-1 ring-surface-container-highest"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary text-[10px] border border-surface-container-high">
                      <span className="material-symbols-outlined text-[10px]">
                        {call.direction === 'missed' ? 'call_missed' : call.direction === 'incoming' ? 'call_received' : 'call_made'}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs text-on-surface truncate">
                      {call.contact?.name || 'Contact'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
                      <span className="font-mono">{call.timestamp}</span>
                      {call.mode === 'satellite' && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-secondary/15 text-secondary">
                          SAT
                        </span>
                      )}
                      {call.duration && call.duration !== '00:00' && (
                        <span className="font-mono text-[10px] opacity-75">• {call.duration}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSentSound();
                      const target = contacts.find((c) => c.id === call.contact?.id) || (call.contact as any);
                      onStartVoiceCall(target);
                    }}
                    className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-primary active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSentSound();
                      const target = contacts.find((c) => c.id === call.contact?.id) || (call.contact as any);
                      onStartVideoCall(target);
                    }}
                    className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-secondary active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">videocam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container/50 rounded-2xl border border-surface-container-high/60">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant border border-surface-container-highest">
              <span className="material-symbols-outlined text-3xl">phone_disabled</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-on-surface">No Recent Calls</h3>
              <p className="text-xs text-on-surface-variant max-w-[260px] leading-relaxed">
                Connect with field operators using encrypted 2.4kbps satellite voice or broadband video links.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Contact Picker Modal Sheet */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-[390px] bg-surface-container rounded-t-3xl sm:rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
            <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Select Contact for {selectedCallType === 'video' ? 'Video Link' : 'Voice Call'}
                </h3>
                <p className="text-[11px] text-on-surface-variant">Encrypted Direct Link</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-3 overflow-y-auto no-scrollbar space-y-2">
              {/* Quick Add Contact in Picker */}
              <button
                type="button"
                onClick={() => {
                  setIsPickerOpen(false);
                  if (onOpenAddContact) onOpenAddContact();
                }}
                className="w-full p-2.5 flex items-center justify-between gap-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-primary">Add New Contact</div>
                    <div className="text-[10px] text-on-surface-variant">Add peer for encrypted call</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary text-base">chevron_right</span>
              </button>

              <div className="divide-y divide-surface-container-high/60">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContactForCall(contact)}
                  className="w-full p-3 flex items-center justify-between gap-3 hover:bg-surface-container-high/60 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-on-surface truncate">{contact.name}</div>
                      <div className="text-[11px] font-mono text-outline">@{contact.nexusId}</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">
                      {selectedCallType === 'video' ? 'videocam' : 'call'}
                    </span>
                  </div>
                </button>
              ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
