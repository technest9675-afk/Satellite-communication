import React from 'react';

interface NexusLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  className = 'w-8 h-8',
  size = 32,
  glow = false
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${glow ? 'drop-shadow-[0_0_8px_rgba(0,229,163,0.6)]' : ''}`}
      >
        <defs>
          <linearGradient id="nexusGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5A3" />
            <stop offset="50%" stopColor="#00C48C" />
            <stop offset="100%" stopColor="#008BFF" />
          </linearGradient>
          <linearGradient id="nexusRingGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5A3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#008BFF" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Outer Hexagonal Sovereign Orbital Shield */}
        <path
          d="M50 8 L86 29 L86 71 L50 92 L14 71 L14 29 Z"
          stroke="url(#nexusRingGradient)"
          strokeWidth="4"
          strokeLinejoin="round"
          fill="#0c1624"
        />

        {/* Inner Geometric "N" Nexus Core */}
        {/* Left Pillar */}
        <path
          d="M32 30 L32 70"
          stroke="url(#nexusGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Diagonal Crosslink */}
        <path
          d="M32 30 L68 70"
          stroke="url(#nexusGradient)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Right Pillar */}
        <path
          d="M68 30 L68 70"
          stroke="url(#nexusGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Center Orbital Node Core */}
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="8" stroke="#00E5A3" strokeWidth="2" strokeDasharray="2 2" />

        {/* Corner Telemetry Vertex Dots */}
        <circle cx="50" cy="8" r="3" fill="#00E5A3" />
        <circle cx="86" cy="29" r="3" fill="#00E5A3" />
        <circle cx="86" cy="71" r="3" fill="#008BFF" />
        <circle cx="50" cy="92" r="3" fill="#008BFF" />
        <circle cx="14" cy="71" r="3" fill="#00E5A3" />
        <circle cx="14" cy="29" r="3" fill="#00E5A3" />
      </svg>
    </div>
  );
};

export default NexusLogo;
