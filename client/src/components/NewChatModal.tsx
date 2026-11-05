import React, { useState, useEffect } from 'react';
import { Contact, GroupMember } from '../types';
import { useTranslation } from '../services/i18n';
import { sounds } from '../services/soundEffects';
import { createContact } from '../services/api';
import { NexusLogo } from './NexusLogo';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated: (contact: Contact) => void;
  existingContacts?: Contact[];
  initialTab?: 'contacts' | 'add';
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onContactCreated,
  existingContacts = [],
  initialTab = 'contacts'
}) => {
  const [modalTab, setModalTab] = useState<'contacts' | 'add'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'satellite' | 'favorites'>('all');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [nexusId, setNexusId] = useState('');
  const [role, setRole] = useState('Tactical Responder');
  const [satelliteLinked, setSatelliteLinked] = useState(true);
  const [isGroup, setIsGroup] = useState(false);
  const { t } = useTranslation();
  const [selectedAvatar, setSelectedAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const generateAutoId = (baseName?: string) => {
    const raw = (baseName || name || 'NX').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
    const hex = Math.floor(1000 + Math.random() * 9000).toString();
    const generated = `NX-${raw || 'OPERATOR'}-${hex}`;
    setNexusId(generated);
    return generated;
  };

  useEffect(() => {
    if (isOpen) {
      setModalTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
      if (initialTab === 'add' && !nexusId) {
        generateAutoId();
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Preset nearby off-grid devices
  const nearbyDevices = [
    {
      id: 'nearby_alex',
      name: 'Alex Miller',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      subtitle: 'Nearby • 5m away',
      icon: 'bluetooth',
      tag: 'Ready',
      tagColor: 'primary'
    },
    {
      id: 'nearby_node2',
      name: 'Basecamp Node #02',
      avatar: '',
      subtitle: 'Relay available • Strong signal',
      icon: 'cell_tower',
      tag: 'Mesh link',
      tagColor: 'secondary'
    }
  ];

  // Default contacts if none loaded
  const defaultContacts: Contact[] = existingContacts.length > 0 ? existingContacts : [
    {
      id: 'c_elena',
      name: 'Elena Rostova',
      role: 'Alpine Research Lead',
      phone: '+91 98110 01240',
      nexusId: 'NX-ELENA-SAT',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      online: true,
      lastSeen: 'Active now',
      satelliteLinked: true,
      satelliteSignal: 94,
      isGroup: false,
      unreadCount: 0,
      lastMessage: 'Tethered via Bluetooth. 3 satellites locked...',
      lastMessageTime: '10:24 AM',
      verifiedBharat: true,
      encryptionKey: '0x8F92...B314',
      about: 'Alpine expedition lead'
    },
    {
      id: 'c_marcus',
      name: 'Marcus Vance',
      role: 'Terrain Surveyor',
      phone: '+91 98220 01880',
      nexusId: 'NX-MARCUS-5G',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      online: true,
      lastSeen: 'Last seen 2h ago',
      satelliteLinked: false,
      satelliteSignal: 45,
      isGroup: false,
      unreadCount: 0,
      lastMessage: 'Sending coordinates now. See you at waypoint 4.',
      lastMessageTime: 'Yesterday',
      verifiedBharat: true,
      encryptionKey: '0x4E71...99FA',
      about: 'Field coordinator'
    },
    {
      id: 'c_maya',
      name: 'Maya Lin',
      role: 'Remote Sensing',
      phone: '+91 98330 01990',
      nexusId: 'NX-MAYA-ORBIT',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      online: false,
      lastSeen: 'In remote area',
      satelliteLinked: true,
      satelliteSignal: 98,
      isGroup: false,
      unreadCount: 0,
      lastMessage: 'Voice note (0:14) · via satellite',
      lastMessageTime: 'Oct 24',
      verifiedBharat: true,
      encryptionKey: '0x11AB...77FC',
      about: 'Glacial research'
    }
  ];

  const filteredContacts = defaultContacts.filter((c) => {
    const matches =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nexusId && c.nexusId.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matches) return false;

    if (activeFilter === 'online') return c.online;
    if (activeFilter === 'satellite') return c.satelliteLinked;
    if (activeFilter === 'favorites') return c.verifiedBharat;
    return true;
  });

  const handleCreateNewContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a full name or tactical callsign');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    sounds.playClickSound();

    const finalNexusId = nexusId.trim().toUpperCase() || generateAutoId(name.trim());
    const finalPhone = phone.trim() || '+91 90000 00000';

    const initialGroupMembers: GroupMember[] = isGroup ? [
      {
        id: 'mem_admin',
        name: 'You (Terminal Operator)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'Group Admin',
        isAdmin: true
      },
      ...selectedMemberIds.map(id => {
        const item = defaultContacts.find(dc => dc.id === id);
        return {
          id: item?.id || id,
          name: item?.name || 'Member',
          avatar: item?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          role: item?.role || 'Member',
          phone: item?.phone,
          nexusId: item?.nexusId,
          isAdmin: false
        };
      })
    ] : [];

    try {

      const newContact = await createContact({
        name: name.trim(),
        phone: finalPhone,
        role: role.trim() || (isGroup ? 'Tactical Mesh Group' : 'Sovereign Contact'),
        nexusId: finalNexusId,
        isGroup,
        satelliteLinked,
        avatar: selectedAvatar,
        about: isGroup ? 'Sovereign mesh group channel' : 'Direct encrypted peer channel',
        members: isGroup ? initialGroupMembers : undefined
      });

      sounds.playSentSound();
      setSuccessMsg(`Contact "${newContact.name}" added successfully!`);
      setTimeout(() => {
        onContactCreated(newContact);
        onClose();
        setName('');
      setSelectedMemberIds([]);
        setSelectedMemberIds([]);
        setPhone('+91 ');
        setNexusId('');
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 400);
    } catch (err: any) {
      console.warn('Backend call failed, creating with offline sovereign identity', err);
      const fallbackContact: Contact = {
        id: 'contact_' + Date.now(),
        name: name.trim(),
        role: role.trim() || (isGroup ? 'Tactical Mesh Group' : 'Sovereign Contact'),
        phone: finalPhone,
        nexusId: finalNexusId,
        avatar: selectedAvatar,
        online: true,
        lastSeen: 'Active now',
        satelliteLinked,
        satelliteSignal: 92,
        isGroup,
        unreadCount: 0,
        lastMessage: isGroup ? 'Mesh group initialized.' : 'Encrypted channel established.',
        lastMessageTime: 'Just now',
        verifiedBharat: true,
        encryptionKey: 'P-256 ECDH Authenticated',
        about: isGroup ? 'Sovereign mesh group channel' : 'Direct encrypted peer channel',
        members: isGroup ? initialGroupMembers : undefined
      };
      sounds.playSentSound();
      onContactCreated(fallbackContact);
      onClose();
      setName('');
      setPhone('+91 ');
      setNexusId('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectExisting = (c: Contact) => {
    sounds.playSentSound();
    onContactCreated(c);
    onClose();
  };

  const rolePresets = [
    'Tactical Officer',
    'Doctor / Medic',
    'Field Surveyor',
    'Recon Patrol',
    'Family',
    'Civilian'
  ];

  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[390px] max-h-[90dvh] bg-surface dark:bg-[#0b121c] text-on-surface rounded-2xl border border-surface-container-highest dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Unified Nexus Logo */}
        <header className="px-4 py-3 bg-surface-container-low dark:bg-[#0e1724] border-b border-surface-container-highest dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <NexusLogo size={32} className="shrink-0" glow />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-bold text-sm text-on-surface dark:text-white truncate">
                  Nexus Contacts &amp; Mesh
                </h2>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
                  E2EE P-256
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400 truncate">
                Sovereign Directory &amp; Add Contact
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* 2-Tab Segmented Selector: Directory vs Add Contact */}
        <div className="p-2.5 bg-surface-container-lowest dark:bg-[#0d1522] border-b border-surface-container-highest dark:border-slate-800 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModalTab('contacts');
              sounds.playClickSound();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              modalTab === 'contacts'
                ? 'bg-primary text-slate-950 font-bold shadow-md'
                : 'bg-surface-container dark:bg-slate-900/80 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base">people</span>
            <span>Directory ({defaultContacts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalTab('add');
              if (!nexusId) generateAutoId();
              sounds.playClickSound();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              modalTab === 'add'
                ? 'bg-primary text-slate-950 font-bold shadow-md'
                : 'bg-surface-container dark:bg-slate-900/80 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add Contact</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-500/40 text-rose-300 text-xs flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-rose-400">error</span>
              <span>{errorMsg}</span>
            </span>
            <button type="button" onClick={() => setErrorMsg(null)} className="text-[10px] text-rose-300 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
              <span>{successMsg}</span>
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 flex flex-col">
          {/* TAB 2: ADD NEW CONTACT FORM */}
          {modalTab === 'add' ? (
            <form onSubmit={handleCreateNewContact} className="p-4 space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low dark:bg-slate-900 rounded-xl border border-surface-container-highest dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGroup(false)}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    !isGroup ? 'bg-primary text-slate-950 font-bold' : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>Direct 1-on-1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroup(true)}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isGroup ? 'bg-primary text-slate-950 font-bold' : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">group</span>
                  <span>Group Mesh</span>
                </button>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider font-mono">
                  {isGroup ? 'Group Name / Unit' : 'Full Name or Callsign'} <span className="text-primary">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-on-surface-variant/70 dark:text-slate-500 text-[18px] absolute left-3">
                    {isGroup ? 'groups' : 'badge'}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!nexusId || nexusId.startsWith('NX-OPERATOR')) {
                        generateAutoId(e.target.value);
                      }
                    }}
                    placeholder={isGroup ? 'e.g. Siachen Recon Patrol Unit-4' : 'e.g. Col. Vikram Batra / Rahul Rao'}
                    className="w-full h-10 bg-surface-container-lowest dark:bg-slate-900/90 rounded-xl pl-9 pr-3 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-highest dark:border-slate-800"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider font-mono">
                  Mobile Number / Callsign
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-on-surface-variant/70 dark:text-slate-500 text-[18px] absolute left-3">
                    phone_iphone
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 bg-surface-container-lowest dark:bg-slate-900/90 rounded-xl pl-9 pr-3 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-highest dark:border-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Unique NEXUS ID with Auto-Generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider font-mono">
                    Unique Sovereign NEXUS ID
                  </label>
                  <button
                    type="button"
                    onClick={() => generateAutoId()}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono"
                  >
                    <span className="material-symbols-outlined text-xs">autorenew</span>
                    <span>Generate</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-on-surface-variant/70 dark:text-slate-500 text-[18px] absolute left-3">
                    fingerprint
                  </span>
                  <input
                    type="text"
                    value={nexusId}
                    onChange={(e) => setNexusId(e.target.value.toUpperCase())}
                    placeholder="e.g. NX-VIKRAM-77A"
                    className="w-full h-10 bg-surface-container-lowest dark:bg-slate-900/90 rounded-xl pl-9 pr-9 text-xs text-primary font-mono placeholder:text-on-surface-variant/50 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-highest dark:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => generateAutoId()}
                    title="Generate New ID"
                    className="absolute right-2.5 text-on-surface-variant dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                  </button>
                </div>
              </div>

              {/* Role / Department Quick Pickers */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider font-mono">
                  Role / Operational Designation
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {rolePresets.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all border ${
                        role === r
                          ? 'bg-primary/20 border-primary text-primary font-semibold'
                          : 'bg-surface-container dark:bg-slate-900 border-surface-container-highest dark:border-slate-800 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider font-mono">
                  Profile Avatar
                </label>
                <div className="flex items-center gap-2">
                  {avatarPresets.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="Preset"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 rounded-full object-cover cursor-pointer transition-all ${
                        selectedAvatar === av
                          ? 'ring-2 ring-primary scale-105'
                          : 'opacity-70 hover:opacity-100 ring-1 ring-surface-container-highest dark:ring-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              
              {/* GROUP INITIAL MEMBERS SELECTOR (VISIBLE WHEN ISGROUP IS TRUE) */}
              {isGroup && (
                <div className="space-y-2 p-3 bg-surface-container-low dark:bg-slate-900 rounded-xl border border-surface-container-highest dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider font-mono">
                      {t('group_select_members', 'Add Group Members')}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {selectedMemberIds.length} {t('group_selected_count', 'selected')}
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto no-scrollbar space-y-1.5 divide-y divide-surface-container-highest/40 dark:divide-slate-800">
                    {defaultContacts.filter(c => !c.isGroup).length === 0 ? (
                      <p className="text-[11px] text-on-surface-variant text-center py-2">
                        {t('group_no_members_yet', 'No existing contacts available')}
                      </p>
                    ) : (
                      defaultContacts.filter(c => !c.isGroup).map(c => {
                        const isSelected = selectedMemberIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedMemberIds(prev =>
                                isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                              );
                            }}
                            className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${
                              isSelected ? 'bg-primary/15' : 'hover:bg-surface-container dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-on-surface dark:text-white truncate">{c.name}</p>
                                <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate">{c.role || c.phone}</p>
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
                </div>
              )}

              {/* Satellite Link Toggle */}
              <div className="p-3 bg-surface-container-low dark:bg-slate-900/80 rounded-xl border border-surface-container-highest dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                    <span className="material-symbols-outlined text-lg">satellite_alt</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface dark:text-white">Satellite Transceiver Linked</p>
                    <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate">NavIC / GSAT-7A Off-Grid Messaging</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={satelliteLinked}
                  onChange={(e) => setSatelliteLinked(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary bg-surface-container dark:bg-slate-800 border-surface-container-highest dark:border-slate-700 cursor-pointer"
                />
              </div>

              {/* Encryption Certificate Note */}
              <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start space-x-2">
                <span className="material-symbols-outlined text-sm mt-0.5 shrink-0 text-emerald-400">verified_user</span>
                <span className="leading-tight">
                  Encrypted using NIST P-256 WebCrypto keys and AES-256-GCM cipher directly on your sovereign terminal.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 rounded-xl bg-primary text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-fixed active:scale-95 transition-all disabled:opacity-50 mt-1 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>Creating Sovereign Contact...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">person_add</span>
                    <span>Save Contact &amp; Start Chat</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 1: CONTACTS DIRECTORY */
            <>
              {/* Search Section */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative flex items-center bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-1 border border-surface-container-highest dark:border-slate-800 shadow-sm">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-[18px] ml-2 shrink-0">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, phone, or Satellite ID..."
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 dark:placeholder:text-slate-500 outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="p-1 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Action Shortcuts (2x2 Grid) */}
              <div className="px-4 py-1.5">
                <div className="grid grid-cols-2 gap-2">
                  {/* Card 1: New Contact */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('add');
                      setIsGroup(false);
                      if (!nexusId) generateAutoId();
                      sounds.playClickSound();
                    }}
                    className="flex flex-col text-left p-3 bg-surface-container-low dark:bg-slate-900/90 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all active:scale-[0.98] border border-primary/40 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface dark:text-white group-hover:text-primary transition-colors">
                      New Contact
                    </span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5 line-clamp-1">
                      Add by phone or ID
                    </span>
                  </button>

                  {/* Card 2: New Group */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('add');
                      setIsGroup(true);
                      if (!nexusId) generateAutoId('GROUP');
                      sounds.playClickSound();
                    }}
                    className="flex flex-col text-left p-3 bg-surface-container-low dark:bg-slate-900/90 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all active:scale-[0.98] border border-surface-container-highest dark:border-slate-800 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">group_add</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface dark:text-white group-hover:text-sky-500 transition-colors">
                      New Group
                    </span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5 line-clamp-1">
                      Mesh team channel
                    </span>
                  </button>

                  {/* Card 3: Broadcast Channel */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('add');
                      setIsGroup(true);
                      if (!nexusId) generateAutoId('DISPATCH');
                      sounds.playClickSound();
                    }}
                    className="flex flex-col text-left p-3 bg-surface-container-low dark:bg-slate-900/90 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all active:scale-[0.98] border border-surface-container-highest dark:border-slate-800 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">podcasts</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface dark:text-white group-hover:text-secondary transition-colors">
                      Broadcast
                    </span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5 line-clamp-1">
                      One-way updates
                    </span>
                  </button>

                  {/* Card 4: Scan QR Code */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioSquelch();
                      setSuccessMsg('QR Scanner ready. Aim at peer device screen.');
                      setTimeout(() => setSuccessMsg(null), 2500);
                    }}
                    className="flex flex-col text-left p-3 bg-surface-container-low dark:bg-slate-900/90 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all active:scale-[0.98] border border-surface-container-highest dark:border-slate-800 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      Scan QR Code
                    </span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 mt-0.5 line-clamp-1">
                      Instant peer link
                    </span>
                  </button>
                </div>
              </div>

              {/* Nearby Off-Grid Devices (Mesh / Bluetooth) */}
              <div className="mt-2 px-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <h3 className="font-bold text-xs text-on-surface dark:text-white">Nearby Mesh Devices</h3>
                  </div>
                  <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                    2 reachable
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {nearbyDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-2.5 bg-surface-container-low dark:bg-slate-900/90 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all border border-surface-container-highest dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {dev.avatar ? (
                          <div className="relative w-9 h-9 shrink-0">
                            <img className="w-9 h-9 rounded-full object-cover" src={dev.avatar} alt={dev.name} />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-surface dark:ring-slate-900" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-surface-container dark:bg-slate-800 flex items-center justify-center text-secondary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">router</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-on-surface dark:text-white font-semibold truncate">{dev.name}</span>
                          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant dark:text-slate-400">
                            <span className="material-symbols-outlined text-[13px] text-primary">{dev.icon}</span>
                            <span className="truncate">{dev.subtitle}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playSentSound();
                          onContactCreated({
                            id: dev.id,
                            name: dev.name,
                            role: 'Nearby Mesh Node',
                            phone: '+91 98000 01220',
                            nexusId: 'NX-MESH-LOCAL',
                            avatar: dev.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                            online: true,
                            lastSeen: 'Active now',
                            satelliteLinked: true,
                            satelliteSignal: 96,
                            isGroup: false,
                            unreadCount: 0,
                            lastMessage: 'Direct Bluetooth mesh link open.',
                            lastMessageTime: 'Just now',
                            verifiedBharat: true,
                            encryptionKey: '0x334...LOCAL',
                            about: 'Close-range off-grid peer'
                          });
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-slate-950 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        <span>Link</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacts Directory Section */}
              <div className="mt-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-on-surface dark:text-white">Sovereign Contacts</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('add');
                      if (!nexusId) generateAutoId();
                      sounds.playClickSound();
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[15px]">person_add</span>
                    <span>+ Add New</span>
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {(['all', 'online', 'satellite', 'favorites'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap active:scale-95 transition-all ${
                        activeFilter === filter
                          ? 'bg-primary text-slate-950 font-bold'
                          : 'bg-surface-container dark:bg-slate-900 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white border border-surface-container-highest dark:border-slate-800'
                      }`}
                    >
                      {filter === 'all' && `All (${filteredContacts.length})`}
                      {filter === 'online' && 'Online'}
                      {filter === 'satellite' && 'Satellite'}
                      {filter === 'favorites' && 'Verified'}
                    </button>
                  ))}
                </div>

                {/* Contact List */}
                <div className="flex flex-col gap-1.5 mt-1">
                  {filteredContacts.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant dark:text-slate-400 text-xs flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 dark:text-slate-600">search_off</span>
                      <span>No contacts found</span>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTab('add');
                          if (!nexusId) generateAutoId();
                        }}
                        className="px-3 py-1 rounded-lg bg-primary text-slate-950 font-bold text-xs"
                      >
                        Add Contact Now
                      </button>
                    </div>
                  ) : (
                    filteredContacts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectExisting(c)}
                        className="flex items-center justify-between p-2.5 bg-surface-container-low dark:bg-slate-900/90 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-surface-container-highest dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-10 h-10 shrink-0">
                            <img className="w-10 h-10 rounded-full object-cover" src={c.avatar} alt={c.name} />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-surface dark:ring-slate-900" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-on-surface dark:text-white truncate">{c.name}</span>
                              {c.verifiedBharat && (
                                <span className="material-symbols-outlined text-[13px] text-primary shrink-0">verified</span>
                              )}
                            </div>
                            <span className="text-[11px] text-on-surface-variant dark:text-slate-400 truncate">
                              {c.satelliteLinked ? 'Active now • Satellite link' : 'Active now • Internet'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {c.satelliteLinked ? (
                            <span className="material-symbols-outlined text-primary text-[18px]">satellite_alt</span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-[18px]">wifi</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
