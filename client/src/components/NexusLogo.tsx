import React, { useState } from 'react';

interface NexusLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
  variant?: 'emblem' | 'full';
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  className = '',
  size = 32,
  glow = false,
  variant = 'emblem'
}) => {
  const [hasError, setHasError] = useState(false);

  if (variant === 'full') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${
          glow ? 'drop-shadow-[0_0_16px_rgba(0,180,255,0.45)]' : ''
        } ${className}`}
      >
        <img
          src="/nexus-brand-card.png"
          alt="NEXUS - Stay Connected. Anywhere."
          className="w-full h-auto object-contain select-none pointer-events-none rounded-xl"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-[#040812] ${
        glow ? 'shadow-[0_0_14px_rgba(0,180,255,0.55)] ring-1 ring-sky-500/40' : 'ring-1 ring-white/10'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {!hasError ? (
        <img
          src="/nexus-logo-emblem.png"
          alt="NEXUS"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full select-none pointer-events-none transform scale-[1.05]"
          loading="eager"
          decoding="async"
        />
      ) : (
        /* Vector Fallback */
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <circle cx="50" cy="50" r="42" stroke="#00B4FF" strokeWidth="3" />
          <path d="M30 75 L30 25 L45 25 L70 65 L70 25" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 78 C 35 60, 55 45, 78 22" stroke="#00E5A3" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

export default NexusLogo;

