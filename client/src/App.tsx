import React, { useState, useEffect } from 'react';
import { MobileFrameWrapper } from './components/MobileFrameWrapper';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { SatelliteStatusView } from './components/SatelliteStatusView';
import { SosView } from './components/SosView';
import { SettingsView } from './components/SettingsView';
import { CallsView } from './components/CallsView';
import { OnboardingModal } from './components/OnboardingModal';
import { SatelliteConsoleModal } from './components/SatelliteConsoleModal';
import { UpiPayModal } from './components/UpiPayModal';
import { CallModal } from './components/CallModal';
import { WalkieTalkieModal } from './components/WalkieTalkieModal';
import { StatusModal } from './components/StatusModal';
import { SecurityVaultModal } from './components/SecurityVaultModal';
import { NewChatModal } from './components/NewChatModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthScreen } from './components/AuthScreen';
import { 
  Contact, Message, CurrentUser, SatelliteModuleState, MessageMode 
} from './types';
import { 
  fetchContacts, fetchMessages, 
  fetchSatelliteStatus, sendMessageApi, toggleMessageReaction, 
  toggleHardwareModule, socket, fetchCurrentUser, logoutApi, updateProfile, getAuthToken,
  resetDemoDataApi 
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
  const [isSatModalOpen, setIsSatModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiTargetContact, setUpiTargetContact] = useState<Contact | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callTargetContact, setCallTargetContact] = useState<Contact | null>(null);
  const [isWalkieTalkieOpen, setIsWalkieTalkieOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatModalInitialTab, setNewChatModalInitialTab] = useState<'contacts' | 'add'>('contacts');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const handleOpenAddContact = () => {
    setNewChatModalInitialTab('add');
    setIsNewChatModalOpen(true);
  };

  const handleOpenNewChat = () => {
    setNewChatModalInitialTab('contacts');
    setIsNewChatModalOpen(true);
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
        console.warn('Session verification failed, requesting login', err);
        setCurrentUser(null);
        try {
          localStorage.removeItem('nexus_user');
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

    socket.on('sos_triggered', () => {
      sounds.playSosAlert();
    });

    return () => {
      socket.off('new_message');
      socket.off('message_reaction_updated');
      socket.off('satellite_status_changed');
      socket.off('satellite_hardware_changed');
      socket.off('contact_created');
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
          />
        );

      case 'satellite':
        return (
          <SatelliteStatusView
            satelliteState={satelliteState}
            onUpdateState={(updated) => setSatelliteState(updated)}
            onOpenSos={() => setActiveTab('sos')}
            onOpenAdvancedConsole={() => setIsSatModalOpen(true)}
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
            onOpenVault={() => setIsVaultModalOpen(true)}
            onOpenSatelliteConsole={() => setIsSatModalOpen(true)}
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
                onOpenSatelliteConsole={() => setIsSatModalOpen(true)}
                onOpenVault={() => setIsVaultModalOpen(true)}
                onConnectHardwareModule={handleConnectHardwareModule}
                onBack={() => setShowMobileChat(false)}
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
              onOpenSatelliteConsole={() => setIsSatModalOpen(true)}
              onOpenVault={() => setIsVaultModalOpen(true)}
              onOpenStatus={() => setIsStatusModalOpen(true)}
              onOpenNewChat={handleOpenNewChat}
              onOpenAddContact={handleOpenAddContact}
              onOpenWalkieTalkie={() => setIsWalkieTalkieOpen(true)}
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
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/20 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-between gap-1.5 z-40 text-amber-300 text-xs font-mono shrink-0 shadow-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-bold text-amber-400 tracking-wide text-[11px] truncate">
                DEMO MODE • Isolated Sandbox
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isResettingDemo}
                onClick={handleResetDemo}
                className="h-6 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-500/40 active:scale-95 transition-all"
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
          {renderTabContent()}
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

      {/* MODALS */}
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

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUser={currentUser}
      />

      <SatelliteConsoleModal
        isOpen={isSatModalOpen}
        onClose={() => setIsSatModalOpen(false)}
        satelliteState={satelliteState}
        onUpdateState={(updated) => setSatelliteState(updated)}
      />

      <UpiPayModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        contact={upiTargetContact}
        onPaymentSuccess={() => {}}
      />

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        contact={callTargetContact}
        callType={callType}
      />

      <WalkieTalkieModal
        isOpen={isWalkieTalkieOpen}
        onClose={() => setIsWalkieTalkieOpen(false)}
      />

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

      <SecurityVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

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
    </MobileFrameWrapper>
  );
}

export default App;
