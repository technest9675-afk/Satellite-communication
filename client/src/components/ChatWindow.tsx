import React, { useState, useRef, useEffect } from 'react';
import { Contact, Message, CurrentUser, SatelliteModuleState, MessageMode } from '../types';
import { sounds } from '../services/soundEffects';

interface ChatWindowProps {
  contact: Contact | null;
  messages: Message[];
  currentUser: CurrentUser | null;
  satelliteState: SatelliteModuleState | null;
  onSendMessage: (payload: {
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
  }) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onStartVoiceCall: (contact: Contact) => void;
  onStartVideoCall: (contact: Contact) => void;
  onOpenUpiPay: (contact: Contact) => void;
  onOpenWalkieTalkie: () => void;
  onOpenSatelliteConsole: () => void;
  onOpenVault: () => void;
  onOpenContactInfo?: (contact: Contact) => void;
  onConnectHardwareModule: () => void;
  onBack: () => void;
  isMobileChassis?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  messages,
  currentUser,
  satelliteState,
  onSendMessage,
  onToggleReaction,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenUpiPay,
  onOpenWalkieTalkie,
  onOpenSatelliteConsole,
  onOpenVault,
  onOpenContactInfo,
  onConnectHardwareModule,
  onBack,
  isMobileChassis = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'ta' | 'te'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!contact) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center bg-surface select-none">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-primary mb-3 shadow-md">
          <span className="material-symbols-outlined text-[32px]">satellite_alt</span>
        </div>
        <h2 className="text-lg font-bold text-on-surface">Nexus Sovereign Messenger</h2>
        <p className="text-xs text-on-surface-variant max-w-sm mt-1">
          Select a chat to begin secure end-to-end encrypted messaging via hybrid internet &amp; satellite crosslink.
        </p>
      </div>
    );
  }

  const isSatMode = satelliteState?.mode === 'satellite_only';

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sounds.playSentSound();
    onSendMessage({
      contactId: contact.id,
      text: inputText.trim(),
      mode: isSatMode ? 'satellite' : 'internet',
      type: 'text'
    });
    setInputText('');
  };

  const handleSendVoiceNote = () => {
    sounds.playSatelliteChirp();
    onSendMessage({
      contactId: contact.id,
      text: 'Voice note (0:04) · via satellite',
      mode: 'satellite',
      type: 'voice',
      voiceDuration: 4
    });
  };

  const handleSendLocation = () => {
    sounds.playSentSound();
    onSendMessage({
      contactId: contact.id,
      text: 'Shared tactical location: Field Outpost',
      mode: isSatMode ? 'satellite' : 'internet',
      type: 'location',
      locationData: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'National Command Center • Grid Sector 4'
      }
    });
    setIsAttachOpen(false);
  };

  const toggleAudioPlay = (msgId: string) => {
    if (isPlayingAudio === msgId) {
      setIsPlayingAudio(null);
    } else {
      setIsPlayingAudio(msgId);
      sounds.playRadioSquelch();
      setTimeout(() => {
        setIsPlayingAudio(null);
      }, 4000);
    }
  };

  // Indic phrase chips
  const indicSuggestions: Record<string, string[]> = {
    en: ['Are you safe?', 'Heading to Base Camp', 'Satellite link OK', 'Send coordinates'],
    hi: ['क्या आप सुरक्षित हैं?', 'बेस कैंप जा रहे हैं', 'सैटेलाइट लिंक तैयार', 'लोकेशन भेजें'],
    ta: ['நீங்கள் நலமா?', 'முகாமிற்கு செல்கிறோம்', 'செயற்கைக்கோள் தயார்', 'இருப்பிடம் அனுப்பவும்'],
    te: ['మీరు సురక్షితంగా ఉన్నారా?', 'బేస్ క్యాంప్‌కు వెళ్తున్నాం', 'శాటిలైట్ లింక్ సిద్ధం', 'లొకేషన్ పంపండి']
  };

  const renderStatusIndicator = (status?: string) => {
    switch (status) {
      case 'sending':
        return (
          <span className="material-symbols-outlined text-[13px] text-outline animate-spin" title="Sending...">
            progress_activity
          </span>
        );
      case 'sent':
        return (
          <span className="material-symbols-outlined text-[14px] text-outline" title="Sent">
            check
          </span>
        );
      case 'delivered':
        return (
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant" title="Delivered">
            done_all
          </span>
        );
      case 'satellite_uplinked':
        return (
          <span className="material-symbols-outlined text-[13px] text-secondary" title="Satellite Uplinked">
            satellite_alt
          </span>
        );
      case 'read':
      default:
        return (
          <span
            className="material-symbols-outlined text-[14px] leading-none text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
            title="Read"
          >
            done_all
          </span>
        );
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-surface select-none relative overflow-hidden">
      {/* HEADER */}
      <header className="sticky top-0 w-full z-40 pt-safe bg-surface-dim/95 backdrop-blur-xl border-b border-surface-container-high/60 shadow-sm shrink-0">
        <div className="w-full h-16 px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              aria-label="Go Back"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>

            <div
              className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
              onClick={() => {
                if (onOpenContactInfo) onOpenContactInfo(contact);
                else onOpenVault();
              }}
              title={contact.isGroup ? 'View Group Info' : 'View Contact Info'}
            >
              <img
                alt={contact.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm ring-1 ring-primary/30 hover:ring-2 hover:ring-primary/60 transition-all"
                src={contact.avatar}
              />
              {contact.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
              )}
            </div>

            <div
              className="flex flex-col min-w-0 pl-0.5 sm:pl-1 cursor-pointer"
              onClick={() => {
                if (onOpenContactInfo) onOpenContactInfo(contact);
                else onOpenVault();
              }}
              title={contact.isGroup ? 'View Group Info' : 'View Contact Info'}
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="font-semibold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors truncate leading-tight">
                  {contact.name}
                </h1>
                {contact.satelliteLinked && (
                  <span className="text-[10px] text-primary font-medium flex items-center shrink-0" title="Satellite Link Capable">
                    <span className="material-symbols-outlined text-xs">satellite_alt</span>
                  </span>
                )}
              </div>
              <span className={`font-body-sm text-[10px] sm:text-[11px] truncate leading-tight ${
                contact.online ? 'text-primary' : 'text-on-surface-variant'
              }`}>
                {contact.online
                  ? contact.satelliteLinked ? 'Active now • Satellite Ready' : 'Active now'
                  : contact.lastSeen ? `Last seen ${contact.lastSeen}` : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              aria-label="Voice Call"
              onClick={() => onStartVoiceCall(contact)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              title="Voice Call"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">call</span>
            </button>

            <button
              type="button"
              aria-label="Video Call"
              onClick={() => onStartVideoCall(contact)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              title="Video Call"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">videocam</span>
            </button>

            <button
              type="button"
              aria-label="Walkie-Talkie Radio"
              onClick={onOpenWalkieTalkie}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              title="Push-To-Talk Radio"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl text-secondary">radio</span>
            </button>

            <button
              type="button"
              aria-label="More Options"
              onClick={onOpenSatelliteConsole}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
              title="Satellite Diagnostics"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">more_vert</span>
            </button>
          </div>
        </div>
      </header>

      {/* CHAT TRANSCRIPT STREAM */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 flex flex-col gap-3 no-scrollbar">
        {/* Real E2EE Security Notice */}
        <div className="flex justify-center w-full my-1">
          <div className="max-w-xs px-3 py-1 rounded-lg bg-surface-container-low/90 text-center flex items-center justify-center gap-1.5 shadow-sm border border-surface-container-high/60">
            <span className="material-symbols-outlined text-primary text-xs shrink-0">lock</span>
            <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">
              End-to-end encrypted (P-256 ECDH + AES-256-GCM)
            </span>
          </div>
        </div>

        {/* Messages Loop */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isVoice = msg.type === 'voice';
          const isLocation = msg.type === 'location';

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[88%] sm:max-w-[72%] ${
                isMe ? 'items-end self-end' : 'items-start self-start'
              }`}
            >
              <div
                className={`rounded-2xl p-3 shadow-sm flex flex-col gap-1.5 border ${
                  isMe
                    ? 'rounded-tr-sm bg-emerald-50 dark:bg-primary/15 border-emerald-200 dark:border-primary/25 text-on-surface'
                    : 'rounded-tl-sm bg-white dark:bg-surface-container border-slate-200/90 dark:border-surface-container-high text-on-surface'
                }`}
              >
                {/* Voice Note Player */}
                {isVoice ? (
                  <div className="space-y-1">
                    <p className="text-xs leading-relaxed text-on-surface">
                      {msg.text}
                    </p>
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest/60">
                      <button
                        type="button"
                        aria-label="Play Audio"
                        onClick={() => toggleAudioPlay(msg.id)}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-base leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isPlayingAudio === msg.id ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <div className="flex-1 flex items-center gap-1 h-5">
                        {[4, 8, 14, 6, 12, 16, 10, 14, 8, 12, 6, 10].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              isPlayingAudio === msg.id ? 'bg-primary animate-pulse' : 'bg-outline'
                            }`}
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[11px] text-outline font-medium">0:04</span>
                    </div>
                  </div>
                ) : isLocation ? (
                  <div className="space-y-1">
                    <p className="text-xs leading-relaxed text-on-surface">
                      {msg.text}
                    </p>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low border border-surface-container-highest/60">
                      <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                        <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-on-surface">
                          {msg.locationData?.address || 'Tactical GPS Location'}
                        </span>
                        <span className="text-[11px] text-outline truncate">
                          {msg.locationData?.lat ? `${msg.locationData.lat.toFixed(4)}° N, ${msg.locationData.lng.toFixed(4)}° E` : 'Encrypted Coordinates'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-on-surface whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}

                {/* Bubble Timestamp & Status */}
                <div className="flex items-center justify-end gap-1.5 pt-0.5 self-end">
                  {msg.mode === 'satellite' && (
                    <span className="text-[9px] font-mono font-semibold text-secondary mr-0.5">SAT</span>
                  )}
                  <span className="font-mono text-[10px] text-outline">
                    {msg.timestamp || 'Just now'}
                  </span>
                  {isMe && renderStatusIndicator(msg.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Indic Transliteration Quick Bar */}
      <div className="px-3 py-1 bg-surface-container-lowest border-t border-surface-container-high/40 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2 shrink-0">
        <div className="flex items-center gap-1 shrink-0">
          {(['en', 'hi', 'ta', 'te'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                selectedLanguage === lang
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {indicSuggestions[selectedLanguage].map((phrase, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputText(phrase)}
              className="px-2 py-0.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-[11px] whitespace-nowrap border border-surface-container-highest/60"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER INPUT BAR */}
      <footer className="w-full bg-surface-dim/95 backdrop-blur-xl border-t border-surface-container-high/60 px-4 py-2.5 pb-safe relative z-30 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
          {/* Attach Button */}
          <div className="relative">
            <button
              type="button"
              aria-label="Attach Options"
              onClick={() => setIsAttachOpen(!isAttachOpen)}
              className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>

            {isAttachOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAttachOpen(false)} />
                <div className="absolute bottom-12 left-0 w-48 bg-surface-container-high rounded-2xl border border-surface-container-highest shadow-2xl p-1.5 z-50 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachOpen(false);
                      onOpenUpiPay(contact);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-on-surface hover:bg-surface-container-highest transition text-left"
                  >
                    <span className="material-symbols-outlined text-base text-primary">payments</span>
                    <span>UPI PayChat</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendLocation}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-on-surface hover:bg-surface-container-highest transition text-left"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">location_on</span>
                    <span>Share Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachOpen(false);
                      handleSendVoiceNote();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-on-surface hover:bg-surface-container-highest transition text-left"
                  >
                    <span className="material-symbols-outlined text-base text-tertiary">mic</span>
                    <span>Send Voice Note</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isSatMode ? 'Burst text via NavIC Satellite...' : 'Type encrypted message...'}
              className="w-full h-11 bg-surface-container rounded-full pl-4 pr-10 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high border border-surface-container-highest/60 transition-all"
            />
            {isSatMode && (
              <span className="absolute right-3 text-[10px] font-mono text-secondary uppercase font-semibold">
                SAT
              </span>
            )}
          </div>

          {/* Voice or Send CTA */}
          {inputText.trim() ? (
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-fixed text-on-primary flex items-center justify-center shadow-[0_0_12px_rgba(0,229,163,0.3)] active:scale-90 transition-transform shrink-0"
              title="Send Message"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors active:scale-95 shrink-0"
              title="Send Satellite Voice Note"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          )}
        </form>
      </footer>
    </div>
  );
};
