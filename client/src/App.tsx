import React, { useState, useEffect } from 'react';
import { MobileFrameWrapper } from './components/MobileFrameWrapper';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { AuthScreen } from './components/AuthScreen';

// Code-split secondary views & modals for mobile bundle optimization
const SatelliteStatusView = React.lazy(() => import('./components/SatelliteStatusView').then(m => ({ default: m.SatelliteStatusView })));
const SosView = React.lazy(() => import('./components/SosView').then(m => ({ default: m.SosView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const CallsView = React.lazy(() => import('./components/CallsView').then(m => ({ default: m.CallsView })));

const OnboardingModal = React.lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const UpiPayModal = React.lazy(() => import('./components/UpiPayModal').then(m => ({ default: m.UpiPayModal })));
const CallModal = React.lazy(() => import('./components/CallModal').then(m => ({ default: m.CallModal })));
const WalkieTalkieModal = React.lazy(() => import('./components/WalkieTalkieModal').then(m => ({ default: m.WalkieTalkieModal })));
const StatusModal = React.lazy(() => import('./components/StatusModal').then(m => ({ default: m.StatusModal })));
const ProfileModal = React.lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const NewChatModal = React.lazy(() => import('./components/NewChatModal').then(m => ({ default: m.NewChatModal })));
const AdminPanelModal = React.lazy(() => import('./components/AdminPanelModal').then(m => ({ default: m.AdminPanelModal })));
const ContactInfoModal = React.lazy(() => import('./components/ContactInfoModal').then(m => ({ default: m.ContactInfoModal })));

const ViewLoadingFallback = () => (
  <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-surface">
    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);
import { 
  Contact, Message, CurrentUser, SatelliteModuleState, MessageMode, GroupMember 
} from './types';
import { 
  fetchContacts, fetchMessages, 
  fetchSatelliteStatus, sendMessageApi, toggleMessageReaction, 
  toggleHardwareModule, socket, fetchCurrentUser, logoutApi, updateProfile, getAuthToken,
  resetDemoDataApi, addGroupMembers, clearAuthToken, FALLBACK_DEMO_USER, FALLBACK_DEMO_CONTACTS 
} from './services/api';
import { getOrCreateLocalIdentity, encryptMessagePayload } from './services/cryptoEngine';
import { sounds } from './services/soundEffects';

export function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [satelliteState, setSatelliteState] = useState<SatelliteModuleState | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiTargetContact, setUpiTargetContact] = useState<Contact | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callTargetContact, setCallTargetContact] = useState<Contact | null>(null);
  const [isWalkieTalkieOpen, setIsWalkieTalkieOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatModalInitialTab, setNewChatModalInitialTab] = useState<'contacts' | 'add'>('contacts');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [contactInfoTarget, setContactInfoTarget] = useState<Contact | null>(null);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);

  const handleOpenAddContact = () => {
    setNewChatModalInitialTab('add');
    setIsNewChatModalOpen(true);
  };

  const handleOpenNewChat = () => {
    setNewChatModalInitialTab('contacts');
    setIsNewChatModalOpen(true);
  };

  const handleOpenContactInfo = (contact: Contact) => {
    setContactInfoTarget(contact);
    setIsContactInfoOpen(true);
  };

  const handleAddGroupMembers = async (contactId: string, newMembers: GroupMember[]) => {
    try {
      const updated = await addGroupMembers(contactId, newMembers);
      const finalMembers = (updated && updated.members) ? updated.members : newMembers;
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === contactId) {
            const existing = c.members || [];
            const merged = [...existing];
            for (const m of finalMembers) {
              if (!merged.some((em) => em.id === m.id)) {
                merged.push(m);
              }
            }
            return { ...c, members: merged };
          }
          return c;
        })
      );
      setContactInfoTarget((prev) => {
        if (!prev || prev.id !== contactId) return prev;
        const existing = prev.members || [];
        const merged = [...existing];
        for (const m of finalMembers) {
          if (!merged.some((em) => em.id === m.id)) {
            merged.push(m);
          }
        }
        return { ...prev, members: merged };
      });
      sounds.playSentSound();
    } catch (err) {
      console.error('Failed to add group members:', err);
    }
  };


  // Validate server session on startup
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }

    fetchCurrentUser()
      .then(async (user) => {
        setCurrentUser(user);
        try {
          localStorage.setItem('nexus_user', JSON.stringify(user));
        } catch {}

        // Initialize local WebCrypto identity and publish public key
        try {
          const identity = await getOrCreateLocalIdentity();
          if (identity.publicKeyJwk && !user.publicKey) {
            await updateProfile({ publicKey: identity.publicKeyJwk }).catch(() => {});
          }
        } catch (e) {
          console.warn('E2EE key registration deferred', e);
        }
      })
      .catch((err) => {
        if (token.includes('demo') || token.startsWith('nexus_demo')) {
          setCurrentUser(FALLBACK_DEMO_USER);
          return;
        }
        console.warn('Session verification failed, requesting login', err);
        setCurrentUser(null);
        try {
          localStorage.removeItem('nexus_user');
          clearAuthToken();
        } catch {}
      });
  }, []);

  // Load contacts and satellite status when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    async function init() {
      try {
        const [contactList, satStatus] = await Promise.all([
          fetchContacts().catch(() => []),
          fetchSatelliteStatus().catch(() => null)
        ]);

        if (contactList && contactList.length > 0) {
          setContacts(contactList);
          if (!activeContactId) {
            setActiveContactId(contactList[0].id);
          }
          const initialMsgs = await fetchMessages(contactList[0].id).catch(() => []);
          setMessages((prev) => ({ ...prev, [contactList[0].id]: initialMsgs }));
        }
        if (satStatus) setSatelliteState(satStatus);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    init();
  }, [currentUser]);

  // Load messages when active contact changes
  useEffect(() => {
    if (!activeContactId) return;

    if (!messages[activeContactId]) {
      fetchMessages(activeContactId)
        .then((msgList) => {
          setMessages((prev) => ({ ...prev, [activeContactId]: msgList }));
        })
        .catch((err) => console.error(err));
    }
  }, [activeContactId]);

  // Real-time Socket.IO Listeners
  useEffect(() => {
    socket.on('new_message', ({ contactId, message }: { contactId: string; message: Message }) => {
      setMessages((prev) => {
        const currentList = prev[contactId] || [];
        if (currentList.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          [contactId]: [...currentList, message]
        };
      });

      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === contactId) {
            return {
              ...c,
              lastMessage: message.text || (message.type === 'voice' ? '🎙️ Voice note' : 'Attachment'),
              lastMessageTime: message.timestamp,
              unreadCount: c.id !== activeContactId ? (c.unreadCount || 0) + 1 : 0
            };
          }
          return c;
        })
      );

      if (message.senderId !== currentUser?.id) {
        if (message.mode === 'satellite') {
          sounds.playSatelliteChirp();
        } else {
          sounds.playReceivedSound();
        }
      }
    });

    socket.on('message_reaction_updated', ({ contactId, messageId, reactions }: any) => {
      setMessages((prev) => {
        const list = prev[contactId] || [];
        return {
          ...prev,
          [contactId]: list.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        };
      });
    });

    socket.on('satellite_status_changed', (state: SatelliteModuleState) => {
      setSatelliteState(state);
    });

    socket.on('satellite_hardware_changed', ({ module }: any) => {
      setSatelliteState(module);
    });

    socket.on('contact_created', (newContact: Contact) => {
      setContacts((prev) => [newContact, ...prev]);
    });

    socket.on('group_members_updated', ({ contactId, members }: { contactId: string; members: GroupMember[] }) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, members } : c))
      );
      setContactInfoTarget((prev) => {
        if (!prev || prev.id !== contactId) return prev;
        return { ...prev, members };
      });
    });

    socket.on('sos_triggered', () => {
      sounds.playSosAlert();
    });

    return () => {
      socket.off('new_message');
      socket.off('message_reaction_updated');
      socket.off('satellite_status_changed');
      socket.off('satellite_hardware_changed');
      socket.off('contact_created');
      socket.off('group_members_updated');
      socket.off('sos_triggered');
    };
  }, [activeContactId, currentUser]);

  const handleAuthSuccess = async (user: CurrentUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('nexus_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    try {
      const identity = await getOrCreateLocalIdentity();
      if (identity.publicKeyJwk) {
        await updateProfile({ publicKey: identity.publicKeyJwk }).catch(() => {});
      }
    } catch (e) {
      console.warn('Identity keypair init warning', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {}
    try {
      localStorage.removeItem('nexus_user');
      clearAuthToken();
    } catch {}
    setCurrentUser(null);
    setContacts([]);
    setMessages({});
    sounds.playSentSound();
  };

  const [isResettingDemo, setIsResettingDemo] = useState(false);

  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    sounds.playSatelliteChirp();
    try {
      await resetDemoDataApi();
      const updatedContacts = await fetchContacts().catch(() => []);
      setContacts(updatedContacts);
      if (updatedContacts.length > 0) {
        setActiveContactId(updatedContacts[0].id);
        const msgs = await fetchMessages(updatedContacts[0].id).catch(() => []);
        setMessages({ [updatedContacts[0].id]: msgs });
      }
      sounds.playSentSound();
    } catch (e: any) {
      alert(e.message || 'Failed to reset demo data');
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleSendMessage = async (payload: {
    contactId: string;
    text?: string;
    mode: MessageMode;
    type?: string;
    mediaUrl?: string;
    voiceData?: string;
    voiceDuration?: number;
    upiDetails?: any;
    alertDetails?: any;
    locationData?: any;
  }) => {
    try {
      const targetContact = contacts.find((c) => c.id === payload.contactId);
      let envelope: any = undefined;

      if (payload.text) {
        try {
          const enc = await encryptMessagePayload(payload.text, targetContact?.publicKey);
          if (enc) {
            envelope = enc;
          }
        } catch (e) {
          console.warn('E2EE envelope generation skipped', e);
        }
      }

      await sendMessageApi({
        ...payload,
        encryptedEnvelope: envelope
      });
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeContactId) return;
    try {
      await toggleMessageReaction(activeContactId, messageId, emoji);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setShowMobileChat(true);

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleConnectHardwareModule = async () => {
    try {
      const res = await toggleHardwareModule(true);
      setSatelliteState(res.module);
      sounds.playSatelliteChirp();
    } catch (e) {
      console.error(e);
    }
  };

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const activeContact = contacts.find((c) => c.id === activeContactId) || null;
  const activeMessages = activeContactId ? messages[activeContactId] || [] : [];

  // If user is not logged in, show AuthScreen in the exact same phone frame layout
  if (!currentUser) {
    return (
      <MobileFrameWrapper satelliteState={satelliteState}>
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          onEmergencyBypass={() => {
            handleAuthSuccess({
              id: 'emergency_bypass_guest',
              name: 'Tactical Guest Operator',
              phone: '+91 99999 00000',
              nexusId: 'NX-EMERGENCY',
              role: 'officer',
              status: 'Emergency SOS Bypass Session',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              state: 'Emergency SAR Network',
              satelliteAccess: true,
              verifiedBharat: true
            });
            setActiveTab('sos');
          }}
        />
      </MobileFrameWrapper>
    );
  }

  // App Inner Content depending on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'calls':
        return (
          <CallsView
            contacts={contacts}
            currentUser={currentUser}
            onStartVoiceCall={(c) => {
              setCallTargetContact(c);
              setCallType('voice');
              setIsCallModalOpen(true);
            }}
            onStartVideoCall={(c) => {
              setCallTargetContact(c);
              setCallType('video');
              setIsCallModalOpen(true);
            }}
            onOpenWalkieTalkie={() => setIsWalkieTalkieOpen(true)}
            onOpenSos={() => setActiveTab('sos')}
            onOpenAddContact={handleOpenAddContact}
            onOpenContactInfo={handleOpenContactInfo}
          />
        );

      case 'satellite':
        return (
          <SatelliteStatusView
            satelliteState={satelliteState}
            onUpdateState={(updated) => setSatelliteState(updated)}
            onOpenSos={() => setActiveTab('sos')}
          />
        );

      case 'sos':
        return <SosView onBack={() => setActiveTab('chats')} currentUser={currentUser} />;

      case 'settings':
        return (
          <SettingsView
            currentUser={currentUser}
            satelliteState={satelliteState}
            onLogout={handleLogout}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onUpdateSatelliteState={(updated) => setSatelliteState(updated)}
            onOpenSos={() => setActiveTab('sos')}
          />
        );

      case 'chats':
      default:
        if (showMobileChat && activeContact) {
          return (
            <div className="w-full h-full flex flex-col overflow-hidden">
              <ChatWindow
                contact={activeContact}
                messages={activeMessages}
                currentUser={currentUser}
                satelliteState={satelliteState}
                onSendMessage={handleSendMessage}
                onToggleReaction={handleToggleReaction}
                onStartVoiceCall={(c) => {
                  setCallTargetContact(c);
                  setCallType('voice');
                  setIsCallModalOpen(true);
                }}
                onStartVideoCall={(c) => {
                  setCallTargetContact(c);
                  setCallType('video');
                  setIsCallModalOpen(true);
                }}
                onOpenUpiPay={(c) => {
                  setUpiTargetContact(c);
                  setIsUpiModalOpen(true);
                }}
                onOpenWalkieTalkie={() => setIsWalkieTalkieOpen(true)}
                onConnectHardwareModule={handleConnectHardwareModule}
                onBack={() => setShowMobileChat(false)}
                onOpenContactInfo={handleOpenContactInfo}
                isMobileChassis={true}
              />
            </div>
          );
        }

        return (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <Sidebar
              contacts={contacts}
              activeContactId={activeContactId}
              onSelectContact={(id) => {
                handleSelectContact(id);
                setShowMobileChat(true);
              }}
              currentUser={currentUser}
              satelliteState={satelliteState}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenStatus={() => setIsStatusModalOpen(true)}
              onOpenNewChat={handleOpenNewChat}
              onOpenAddContact={handleOpenAddContact}
              onOpenWalkieTalkie={() => setIsWalkieTalkieOpen(true)}
              onOpenContactInfo={handleOpenContactInfo}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              onLogout={handleLogout}
              soundMuted={soundMuted}
              onToggleSound={() => {
                const next = !soundMuted;
                setSoundMuted(next);
                sounds.setSoundEnabled(!next);
              }}
            />
          </div>
        );
    }
  };

  return (
    <MobileFrameWrapper satelliteState={satelliteState}>
      {/* DEMO MODE PERSISTENT NOTICE BANNER */}
        {currentUser?.role === 'demo' && (
          <div className="w-full bg-amber-500/15 dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-amber-500/15 dark:to-amber-500/20 border-b border-amber-600/30 dark:border-amber-500/40 px-3 py-1.5 flex items-center justify-between gap-1.5 z-40 text-amber-950 dark:text-amber-300 text-xs font-mono shrink-0 shadow-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse shrink-0" />
              <span className="font-bold text-amber-900 dark:text-amber-400 tracking-wide text-[11px] truncate">
                DEMO MODE • Isolated Sandbox
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isResettingDemo}
                onClick={handleResetDemo}
                className="h-6 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-600/30 dark:border-amber-500/40 active:scale-95 transition-all"
                title="Reset demo contacts and messages to initial sample state"
              >
                <span className={`material-symbols-outlined text-[13px] ${isResettingDemo ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="h-6 px-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-[10px] font-semibold flex items-center gap-1 border border-surface-container-highest active:scale-95 transition-all"
                title="Exit Demo Mode and Return to Sign In"
              >
                <span className="material-symbols-outlined text-[13px]">logout</span>
                <span>Exit</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab View Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full">
          <React.Suspense fallback={<ViewLoadingFallback />}>
            {renderTabContent()}
          </React.Suspense>
        </div>

        {/* Bottom Persistent Navigation Bar: visible across all 5 tabs, hidden only when inside an open chat conversation */}
        {!(activeTab === 'chats' && showMobileChat) && (
          <div className="w-full flex-shrink-0">
            <BottomNavBar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setShowMobileChat(false);
                sounds.playSentSound();
              }}
              unreadCount={totalUnread}
            />
          </div>
        )}

      {/* ON-DEMAND LAZY MODALS */}
      <React.Suspense fallback={null}>
        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            onComplete={() => {
              setIsOnboardingOpen(false);
              setActiveTab('chats');
            }}
            onEmergencyBypass={() => {
              setIsOnboardingOpen(false);
              setActiveTab('sos');
            }}
          />
        )}

        {isAdminPanelOpen && (
          <AdminPanelModal
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            currentUser={currentUser}
          />
        )}

        {isUpiModalOpen && (
          <UpiPayModal
            isOpen={isUpiModalOpen}
            onClose={() => setIsUpiModalOpen(false)}
            contact={upiTargetContact}
            onPaymentSuccess={() => {}}
          />
        )}

        {isCallModalOpen && (
          <CallModal
            isOpen={isCallModalOpen}
            onClose={() => setIsCallModalOpen(false)}
            contact={callTargetContact}
            callType={callType}
          />
        )}

        {isWalkieTalkieOpen && (
          <WalkieTalkieModal
            isOpen={isWalkieTalkieOpen}
            onClose={() => setIsWalkieTalkieOpen(false)}
          />
        )}

        {isStatusModalOpen && (
          <StatusModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            onReplyToStatus={(text) => {
              if (activeContactId) {
                handleSendMessage({
                  contactId: activeContactId,
                  text,
                  mode: satelliteState?.mode === 'satellite_only' ? 'satellite' : 'internet'
                });
              }
            }}
          />
        )}

        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={currentUser}
            satelliteState={satelliteState}
            onUpdateProfile={async (data) => {
              const updated = await updateProfile(data);
              setCurrentUser(updated);
              try {
                localStorage.setItem('nexus_user', JSON.stringify(updated));
              } catch {}
            }}
            onOpenSettings={() => {
              setIsProfileModalOpen(false);
              setActiveTab('settings');
            }}
            onLogout={handleLogout}
          />
        )}

        {isContactInfoOpen && (
          <ContactInfoModal
            isOpen={isContactInfoOpen}
            onClose={() => setIsContactInfoOpen(false)}
            contact={contactInfoTarget}
            allContacts={contacts}
            onOpenChat={(c) => {
              setIsContactInfoOpen(false);
              setActiveContactId(c.id);
              setShowMobileChat(true);
              setActiveTab('chats');
            }}
            onStartVoiceCall={(c) => {
              setIsContactInfoOpen(false);
              setCallTargetContact(c);
              setCallType('voice');
              setIsCallModalOpen(true);
            }}
            onStartVideoCall={(c) => {
              setIsContactInfoOpen(false);
              setCallTargetContact(c);
              setCallType('video');
              setIsCallModalOpen(true);
            }}
            onOpenUpiPay={(c) => {
              setIsContactInfoOpen(false);
              setUpiTargetContact(c);
              setIsUpiModalOpen(true);
            }}
            onAddMembers={handleAddGroupMembers}
          />
        )}

        {isNewChatModalOpen && (
          <NewChatModal
            isOpen={isNewChatModalOpen}
            onClose={() => setIsNewChatModalOpen(false)}
            existingContacts={contacts}
            initialTab={newChatModalInitialTab}
            onContactCreated={(newC) => {
              setContacts((prev) => {
                const exists = prev.some((c) => c.id === newC.id || (c.nexusId && c.nexusId === newC.nexusId));
                if (exists) return prev;
                return [newC, ...prev];
              });
              setActiveContactId(newC.id);
              setShowMobileChat(true);
              setActiveTab('chats');
              setMessages((prev) => {
                if (prev[newC.id]) return prev;
                return { ...prev, [newC.id]: [] };
              });
            }}
          />
        )}
      </React.Suspense>
    </MobileFrameWrapper>
  );
}

export default App;
