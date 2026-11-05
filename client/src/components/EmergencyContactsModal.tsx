import React, { useState, useEffect } from 'react';
import { sounds } from '../services/soundEffects';

export interface EmergencyContactItem {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  callsign?: string;
  priority: 'primary' | 'secondary';
}

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONTACTS: EmergencyContactItem[] = [
  {
    id: 'em-1',
    name: 'National Mountain SAR Dispatch',
    phone: '+91 112 / +1 (800) 555-0911',
    relationship: 'Search & Rescue Ops',
    callsign: 'SAR-DISPATCH-LEO',
    priority: 'primary'
  },
  {
    id: 'em-2',
    name: 'Dr. Aarav Patel (Medical Response)',
    phone: '+91 98765 43210',
    relationship: 'Personal Physician',
    callsign: 'MED-PATEL-1',
    priority: 'secondary'
  }
];

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<EmergencyContactItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_emergency_contacts');
      return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newCallsign, setNewCallsign] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('nexus_emergency_contacts', JSON.stringify(contacts));
    } catch {}
  }, [contacts]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact: EmergencyContactItem = {
      id: `em-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRelationship.trim() || 'Emergency Contact',
      callsign: newCallsign.trim() || `NX-${newName.trim().slice(0, 4).toUpperCase()}`,
      priority: contacts.length === 0 ? 'primary' : 'secondary'
    };

    setContacts((prev) => [...prev, newContact]);
    setNewName('');
    setNewPhone('');
    setNewRelationship('');
    setNewCallsign('');
    setIsAdding(false);
    sounds.playSentSound();
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    sounds.playClickSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[390px] bg-surface-container rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-error-container/20 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">contact_emergency</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">Emergency Contacts</h2>
              <p className="text-[11px] text-on-surface-variant font-mono">Satellite SOS Dispatch List</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            These trusted contacts are immediately alerted with your tactical GPS coordinates and medical telemetry during an SOS distress event.
          </p>

          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-on-surface truncate">{contact.name}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      contact.priority === 'primary'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {contact.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    {contact.phone} • {contact.relationship}
                  </div>
                  {contact.callsign && (
                    <div className="text-[10px] font-mono text-secondary mt-0.5">
                      Callsign: {contact.callsign}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="w-8 h-8 rounded-xl bg-surface-container hover:bg-error-container/20 text-on-surface-variant hover:text-error flex items-center justify-center transition shrink-0"
                  title="Remove emergency contact"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))}
          </div>

          {isAdding ? (
            <form onSubmit={handleAdd} className="p-3 rounded-2xl bg-surface-container-high border border-primary/30 space-y-2.5 mt-2">
              <span className="text-xs font-bold text-on-surface block">Add Trusted Contact</span>
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Phone Number (e.g. +91 98765 43210)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Relationship"
                  value={newRelationship}
                  onChange={(e) => setNewRelationship(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Callsign (optional)"
                  value={newCallsign}
                  onChange={(e) => setNewCallsign(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 h-8 rounded-xl bg-primary text-on-primary text-xs font-bold transition active:scale-95"
                >
                  Save Contact
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 h-8 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium hover:text-on-surface transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-surface-container-highest text-xs text-primary font-semibold hover:bg-surface-container-low transition flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Emergency Contact</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-container-high bg-surface-container-low flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold active:scale-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
