import React, { useState } from 'react';
import { CurrentUser } from '../types';
import { sounds } from '../services/soundEffects';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = currentUser?.nexusId || 'NX-NEXUS';
    navigator.clipboard?.writeText(text);
    setCopied(true);
    sounds.playSentSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-[360px] bg-surface-container rounded-3xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col items-center p-5 text-center space-y-4">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">qr_code_2</span>
            <span className="text-xs font-bold text-on-surface">Nexus Sovereign Node</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* QR Code Graphic */}
        <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200">
          <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Corner Markers */}
            <rect x="5" y="5" width="25" height="25" rx="4" fill="#0c141f" />
            <rect x="9" y="9" width="17" height="17" rx="2" fill="white" />
            <rect x="13" y="13" width="9" height="9" fill="#00e5a3" />

            <rect x="70" y="5" width="25" height="25" rx="4" fill="#0c141f" />
            <rect x="74" y="9" width="17" height="17" rx="2" fill="white" />
            <rect x="78" y="13" width="9" height="9" fill="#00e5a3" />

            <rect x="5" y="70" width="25" height="25" rx="4" fill="#0c141f" />
            <rect x="9" y="74" width="17" height="17" rx="2" fill="white" />
            <rect x="13" y="78" width="9" height="9" fill="#00e5a3" />

            {/* Pattern Dots */}
            <circle cx="40" cy="15" r="2.5" fill="#0c141f" />
            <circle cx="50" cy="15" r="2.5" fill="#0c141f" />
            <circle cx="60" cy="15" r="2.5" fill="#0c141f" />

            <circle cx="15" cy="40" r="2.5" fill="#0c141f" />
            <circle cx="25" cy="40" r="2.5" fill="#0c141f" />
            <circle cx="35" cy="40" r="2.5" fill="#00e5a3" />
            <circle cx="45" cy="40" r="2.5" fill="#0c141f" />
            <circle cx="55" cy="40" r="2.5" fill="#0c141f" />
            <circle cx="65" cy="40" r="2.5" fill="#0c141f" />
            <circle cx="75" cy="40" r="2.5" fill="#00e5a3" />
            <circle cx="85" cy="40" r="2.5" fill="#0c141f" />

            <circle cx="40" cy="50" r="3.5" fill="#00e5a3" />
            <circle cx="50" cy="50" r="3.5" fill="#0c141f" />
            <circle cx="60" cy="50" r="3.5" fill="#00e5a3" />

            <circle cx="15" cy="60" r="2.5" fill="#0c141f" />
            <circle cx="35" cy="60" r="2.5" fill="#0c141f" />
            <circle cx="50" cy="60" r="2.5" fill="#0c141f" />
            <circle cx="70" cy="60" r="2.5" fill="#0c141f" />
            <circle cx="85" cy="60" r="2.5" fill="#0c141f" />

            <circle cx="40" cy="75" r="2.5" fill="#0c141f" />
            <circle cx="55" cy="75" r="2.5" fill="#0c141f" />
            <circle cx="70" cy="75" r="2.5" fill="#0c141f" />
            <circle cx="85" cy="75" r="2.5" fill="#0c141f" />

            <circle cx="40" cy="85" r="2.5" fill="#0c141f" />
            <circle cx="50" cy="85" r="2.5" fill="#00e5a3" />
            <circle cx="65" cy="85" r="2.5" fill="#0c141f" />
            <circle cx="80" cy="85" r="2.5" fill="#0c141f" />
          </svg>
        </div>

        {/* Node Details */}
        <div className="space-y-1">
          <div className="text-sm font-bold text-on-surface">{currentUser?.name || 'Operator'}</div>
          <div className="font-mono text-xs font-semibold text-primary">@{currentUser?.nexusId || 'NEXUS'}</div>
          <div className="text-[10px] text-on-surface-variant font-mono">P-256 ECDH Identity Key Verified</div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="w-full h-9 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <span className="material-symbols-outlined text-base">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? 'Copied Callsign!' : 'Copy NEXUS ID'}</span>
        </button>
      </div>
    </div>
  );
};
