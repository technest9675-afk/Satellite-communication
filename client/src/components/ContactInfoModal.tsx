import React, { useState } from "react";
import { Contact, GroupMember } from "../types";
import { sounds } from "../services/soundEffects";
import { useTranslation } from "../services/i18n";
import { NexusLogo } from "./NexusLogo";

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  allContacts?: Contact[];
  onOpenChat?: (contact: Contact) => void;
  onStartVoiceCall?: (contact: Contact) => void;
  onStartVideoCall?: (contact: Contact) => void;
  onOpenUpiPay?: (contact: Contact) => void;
  onAddMembers?: (contactId: string, newMembers: GroupMember[]) => void;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen,
  onClose,
  contact,
  allContacts = [],
  onOpenChat,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenUpiPay,
  onAddMembers
}) => {
  const { t } = useTranslation();
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [disappearingMode, setDisappearingMode] = useState<"off" | "24h" | "7d" | "90d">("off");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  if (!isOpen || !contact) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    sounds.playSentSound();
    showToast(fieldName + " copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const defaultMembers: GroupMember[] = [
    {
      id: "mem_admin",
      name: "You (Terminal Operator)",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      role: "Group Admin",
      phone: "+91 98000 00000",
      nexusId: "NX-ME",
      isAdmin: true
    },
    {
      id: "mem_aarav",
      name: "Dr. Aarav Sharma",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      role: "NDRF Disaster Response",
      phone: "+91 94120 55123",
      nexusId: "NX-AARAV",
      isAdmin: false
    },
    {
      id: "mem_priya",
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      role: "Orbital Telemetry Officer",
      phone: "+91 80234 98765",
      nexusId: "NX-PRIYA",
      isAdmin: false
    }
  ];

  const groupMembers: GroupMember[] = contact.members && contact.members.length > 0
    ? contact.members
    : defaultMembers;

  const availableContactsToAdd = allContacts.filter(
    c => !c.isGroup && !groupMembers.some(m => m.id === c.id || m.name === c.name)
  ).filter(
    c => c.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
         c.phone.includes(memberSearch)
  );

  const handleConfirmAddMembers = () => {
    if (selectedMemberIds.length === 0) {
      setIsAddingMembers(false)
      return;
    }
    const newMembers: GroupMember[] = selectedMemberIds.map(id => {
      const c = allContacts.find(item => item.id === id);
      return {
        id: c?.id || id,
        name: c?.name || "Member",
        avatar: c?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        role: c?.role || "Tactical Operator",
        phone: c?.phone,
        nexusId: c?.nexusId,
        isAdmin: false
      };
    });
    if (onAddMembers) {
      onAddMembers(contact.id, newMembers);
    }
    sounds.playSentSound();
    showToast(newMembers.length + " member(s) added to group");
    setSelectedMemberIds([]);
    setIsAddingMembers(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[390px] max-h-[92dvh] bg-surface dark:bg-[#0b121c] rounded-2xl border border-surface-container-highest dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-on-surface">
        {/* STICKY TOP HEADER */}
        <header className="px-4 py-3 bg-surface-container-low dark:bg-[#0e1724] border-b border-surface-container-highest dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Back"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <NexusLogo size={28} className="shrink-0" glow />
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-on-surface dark:text-white truncate">
                {contact.isGroup ? t("info_group_title", "Group Info") : t("info_contact_title", "Contact Info")}
              </h2>
              <p className="text-[10px] text-on-surface-variant dark:text-slate-400 font-mono truncate">
                {contact.isGroup ? "Mesh Group Terminal" : "Peer Cryptographic Node"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="px-4 py-1.5 bg-primary-container text-on-primary-container dark:bg-emerald-950/90 dark:text-emerald-300 border-b border-primary/20 dark:border-emerald-500/40 text-xs flex items-center justify-center gap-1.5 shrink-0 animate-fade-in font-medium">
            <span className="material-symbols-outlined text-sm text-primary dark:text-emerald-400">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* 1. HERO AVATAR SECTION */}
          <div className="flex flex-col items-center text-center space-y-2 pt-1">
            <div
              className="relative cursor-pointer group"
              onClick={() => setIsAvatarExpanded(true)}
              title="Click to view full photo"
            >
              <img
                src={contact.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                alt={contact.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/40 shadow-xl bg-surface-container-highest dark:bg-slate-900 group-hover:scale-102 transition-transform"
              />
              <span className={"absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-surface dark:ring-[#0b121c] " + (contact.online ? "bg-primary" : contact.satelliteLinked ? "bg-secondary" : "bg-outline")} />
              <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <span className="material-symbols-outlined text-xl">zoom_in</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-base font-bold text-on-surface dark:text-white">
                  {contact.name}
                </h3>
                {contact.verifiedBharat && (
                  <span className="material-symbols-outlined text-primary text-[17px]" title="Verified Sovereign Node">
                    verified
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 font-mono mt-0.5">
                {contact.phone || (contact.isGroup ? "Mesh Group Protocol" : "+91 90000 00000")}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold border border-primary/20">
                  {contact.nexusId || "NX-NODE"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 text-[10px] font-medium border border-surface-container-highest dark:border-slate-700">
                  {contact.role || (contact.isGroup ? "Mesh Group" : "Tactical Responder")}
                </span>
              </div>
            </div>
          </div>

          {/* 2. QUICK ACTIONS BAR */}
          <div className="grid grid-cols-5 gap-1.5 p-2 bg-surface-container-low dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (onOpenChat) onOpenChat(contact);
                onClose();
              }}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 text-on-surface transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant dark:text-slate-300 truncate w-full text-center">
                {t("info_message", "Message")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onStartVoiceCall) onStartVoiceCall(contact);
                onClose();
              }}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 text-on-surface transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[18px]">call</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant dark:text-slate-300 truncate w-full text-center">
                {t("info_audio", "Audio")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onStartVideoCall) onStartVideoCall(contact);
                onClose();
              }}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 text-on-surface transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-500 flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant dark:text-slate-300 truncate w-full text-center">
                {t("info_video", "Video")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenUpiPay) onOpenUpiPay(contact);
                onClose();
              }}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 text-on-surface transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant dark:text-slate-300 truncate w-full text-center">
                {t("info_pay", "Pay UPI")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playRadioSquelch();
                showToast("Satellite transponder ping transmitted");
              }}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 text-on-surface transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant dark:text-slate-300 truncate w-full text-center">
                {t("info_sat_ping", "Sat Ping")}
              </span>
            </button>
          </div>

          {/* 3. ABOUT / BIO & STATUS */}
          <div className="p-3 bg-surface-container-low dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 font-mono">
              {t("info_status", "About & Callsign Status")}
            </span>
            <p className="text-xs text-on-surface dark:text-white leading-relaxed">
              {contact.about || "Available on NavIC / GSAT-7A • Sovereign E2EE Terminal"}
            </p>
            <div className="pt-2 border-t border-surface-container-highest dark:border-slate-800 flex items-center justify-between text-[11px] text-on-surface-variant dark:text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-xs text-primary">cell_tower</span>
                <span>{contact.satelliteLinked ? "Satellite Uplink Active (94% SNR)" : "Optical Fiber / 5G"}</span>
              </span>
              <span className="font-mono text-[10px]">{contact.lastSeen || "Active now"}</span>
            </div>
          </div>

          {/* 4. GROUP MEMBERS SECTION (If Group) */}
          {contact.isGroup && (
            <div className="p-3.5 bg-surface-container-low dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-on-surface dark:text-white">
                    {t("info_participants", "Participants")}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">
                    {groupMembers.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingMembers(true)}
                  className="px-2.5 py-1 rounded-lg bg-primary text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-bold">group_add</span>
                  <span>{t("info_add_members", "+ Add Members")}</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-1 divide-y divide-surface-container-highest/60 dark:divide-slate-800">
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between pt-2 first:pt-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-surface-container-highest dark:ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-on-surface dark:text-white truncate">
                            {member.name}
                          </span>
                          {member.isAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                              {t("info_group_admin", "Admin")}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate">
                          {member.role || "Member"} • {member.phone || "Sovereign Node"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playSentSound();
                        showToast("Viewing " + member.name);
                      }}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary dark:text-slate-400 transition-colors"
                      title="Direct Ping"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SECURITY & ENCRYPTION */}
          <div className="p-3.5 bg-surface-container-low dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">lock</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface dark:text-white">
                    {t("info_encryption_title", "Encryption")}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {t("info_encryption_sub", "End-to-end encrypted (NIST P-256 + AES-GCM)")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant dark:text-slate-400 font-mono">
                <span>{t("info_safety_number", "Safety Verification Number")}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("4819 2039 1192 3847 5592 1039 4819 2039 1192 3847 5592 1039", "Safety Fingerprint")}
                  className="text-primary hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>{copiedField === "Safety Fingerprint" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest dark:bg-black/60 border border-surface-container-highest dark:border-slate-800 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 tracking-wider text-center select-all">
                4819 2039 1192 3847 5592 1039 4819 2039 1192 3847 5592 1039
              </div>
            </div>
          </div>

          {/* 6. SETTINGS & PREFERENCES */}
          <div className="p-2 bg-surface-container-low dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">
                  {isMuted ? "notifications_off" : "notifications"}
                </span>
                <span className="text-xs font-semibold text-on-surface dark:text-white">
                  {t("info_mute_notifications", "Mute Notifications")}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isMuted}
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  sounds.playClickSound();
                  showToast(next ? "Notifications muted" : "Notifications unmuted");
                }}
                className={"w-10 h-6 flex items-center rounded-full p-0.5 transition-colors " + (isMuted ? "bg-primary" : "bg-surface-container-highest dark:bg-slate-700")}
              >
                <span className={"w-5 h-5 rounded-full shadow transition-transform " + (isMuted ? "transform translate-x-4 bg-on-primary" : "translate-x-0 bg-outline")} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 transition">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">timer</span>
                <div>
                  <span className="text-xs font-semibold text-on-surface dark:text-white block">
                    {t("info_disappearing", "Disappearing Messages")}
                  </span>
                  <span className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {disappearingMode === "off" ? "Off" : disappearingMode}
                  </span>
                </div>
              </div>
              <select
                value={disappearingMode}
                onChange={(e) => {
                  setDisappearingMode(e.target.value as any);
                  sounds.playClickSound();
                  showToast("Disappearing messages set to " + e.target.value);
                }}
                className="bg-surface-container dark:bg-slate-800 text-xs font-semibold text-on-surface dark:text-white px-2 py-1 rounded-lg border border-surface-container-highest dark:border-slate-700 outline-none"
              >
                <option value="off">Off</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="90d">90 days</option>
              </select>
            </div>
          </div>

          {/* 7. DANGER ZONE */}
          <div className="p-2 bg-surface-container-low dark:bg-slate-900/90 rounded-2xl border border-surface-container-highest dark:border-slate-800 space-y-1">
            {contact.isGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playRadioSquelch();
                    showToast("Exited " + contact.name);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/20 transition text-left"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>{t("info_exit_group", "Exit Group")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playRadioSquelch();
                    showToast("Deleted group from local node");
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/20 transition text-left"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  <span>{t("info_delete_group", "Delete Group")}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playRadioSquelch();
                    showToast("Blocked " + contact.name);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/20 transition text-left"
                >
                  <span className="material-symbols-outlined text-lg">block</span>
                  <span>{t("info_block_contact", "Block Contact")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playRadioSquelch();
                    showToast("Report submitted for audit");
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition text-left"
                >
                  <span className="material-symbols-outlined text-lg">thumb_down</span>
                  <span>{t("info_report_contact", "Report Contact")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* FULLSCREEN AVATAR MODAL */}
        {isAvatarExpanded && (
          <div
            className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 p-4 animate-fade-in"
            onClick={() => setIsAvatarExpanded(false)}
          >
            <div className="w-full max-w-[350px] flex items-center justify-between text-white pb-3">
              <span className="font-bold text-sm truncate">{contact.name}</span>
              <button
                type="button"
                onClick={() => setIsAvatarExpanded(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-72 h-72 sm:w-80 sm:h-80 rounded-2xl object-cover shadow-2xl ring-2 ring-primary/40"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ADD MEMBERS PARTICIPANT PICKER SHEET */}
        {isAddingMembers && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
            <div className="w-full max-w-[370px] max-h-[85dvh] bg-surface dark:bg-[#0e1724] rounded-2xl border border-surface-container-highest dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-3.5 bg-surface-container-low dark:bg-[#121c2c] border-b border-surface-container-highest dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">group_add</span>
                  <span className="font-bold text-sm text-on-surface dark:text-white">
                    {t("info_add_members", "Add Members to Group")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingMembers(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Search contacts */}
              <div className="p-2.5 border-b border-surface-container-highest dark:border-slate-800">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={t("search_contacts", "Search contacts to add...")}
                  className="w-full h-9 bg-surface-container-lowest dark:bg-slate-900 rounded-xl px-3 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 border border-surface-container-highest dark:border-slate-800 outline-none"
                  autoFocus
                />
              </div>

              {/* Contacts Picker List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar max-h-60">
                {availableContactsToAdd.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant dark:text-slate-400 py-6">
                    No additional contacts available
                  </p>
                ) : (
                  availableContactsToAdd.map((c) => {
                    const isSelected = selectedMemberIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedMemberIds(prev =>
                            isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={"flex items-center justify-between p-2 rounded-xl transition cursor-pointer border " + (isSelected ? "bg-primary/10 border-primary text-on-surface" : "bg-surface-container-low dark:bg-slate-900/60 border-surface-container-highest dark:border-slate-800 text-on-surface")}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold block truncate">{c.name}</span>
                            <span className="text-[10px] text-on-surface-variant truncate block">{c.phone || c.role}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-primary pointer-events-none"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action buttons */}
              <div className="p-3 bg-surface-container-low dark:bg-[#121c2c] border-t border-surface-container-highest dark:border-slate-800 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingMembers(false)}
                  className="flex-1 py-2 rounded-xl bg-surface-container dark:bg-slate-800 text-xs font-semibold text-on-surface-variant"
                >
                  {t("btn_cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddMembers}
                  disabled={selectedMemberIds.length === 0}
                  className="flex-1 py-2 rounded-xl bg-primary text-slate-950 text-xs font-bold disabled:opacity-50 transition"
                >
                  Add ({selectedMemberIds.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};