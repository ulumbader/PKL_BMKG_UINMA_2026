import React from 'react';

export const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const LocateIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

export const MostlyCloudyIcon = ({ className, stroke = "#c7c7cd" }: { className?: string, stroke?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

export const RainCloudIcon = ({ className, stroke = "#4a4ff7" }: { className?: string, stroke?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <path d="M8 3v6M12 3v10M16 3v6" />
  </svg>
);

export const CloudBack = ({ className, fill = "#e9e9ea" }: { className?: string, fill?: string }) => (
  <svg className={className} viewBox="0 0 200 120" fill="none">
    <path d="M40 90c-16 0-28-12-28-27 0-14 11-26 25-27 4-14 17-24 32-24 17 0 31 12 34 28 13 2 22 13 22 26 0 15-12 27-27 27H40z" fill={fill} />
  </svg>
);

export const MiniCloud = ({ className, fill = "#e9e9ea", style }: { className?: string, fill?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 200 120" fill={fill}>
    <path d="M40 90c-16 0-28-12-28-27 0-14 11-26 25-27 4-14 17-24 32-24 17 0 31 12 34 28 13 2 22 13 22 26 0 15-12 27-27 27H40z" />
  </svg>
);

export const SnowIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="40" height="34" viewBox="0 0 40 34">
    <path d="M2 8h22a4 4 0 1 0-3-6.6" stroke="#cfcfd4" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M2 15h30a4 4 0 1 1-3 6.6" stroke="#cfcfd4" strokeWidth="2" fill="none" strokeLinecap="round" />
    <g stroke="#5ec9e0" strokeWidth="2" strokeLinecap="round">
      <path d="M6 25l4 4M10 25l-4 4" />
      <path d="M18 25l4 4M22 25l-4 4" />
      <path d="M30 25l4 4M34 25l-4 4" />
    </g>
  </svg>
);

export const WindIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#4a4ff7" strokeWidth="2">
    <path d="M12 2l7 20-7-5-7 5z" />
  </svg>
);

export const SunriseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

export const SunsetIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

export const UVGauge = ({ className, value }: { className?: string, value: number }) => (
  <svg className={className} width="180" height="100" viewBox="0 0 180 100">
    <path d="M15 95 A75 75 0 0 1 165 95" fill="none" stroke="#eeeeef" strokeWidth="14" strokeLinecap="round" />
    <path d="M15 95 A75 75 0 0 1 100 21" fill="none" stroke="#ffb648" strokeWidth="14" strokeLinecap="round" />
    <text x="20" y="60" fontSize="11" fill="#c7c7cd" fontFamily="inherit">6</text>
    <text x="98" y="14" fontSize="11" fill="#c7c7cd" fontFamily="inherit">9</text>
    <text x="160" y="60" fontSize="11" fill="#c7c7cd" fontFamily="inherit">12</text>
  </svg>
);

export const LocationCityScape = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f7b267" />
        <stop offset="55%" stopColor="#e0748a" />
        <stop offset="100%" stopColor="#7a5b8f" />
      </linearGradient>
    </defs>
    <rect width="400" height="260" fill="url(#skyGrad)" />
    <g fill="#2b2438" opacity="0.9">
      <rect x="10" y="120" width="30" height="140" />
      <rect x="45" y="90" width="22" height="170" />
      <rect x="72" y="140" width="18" height="120" />
      <rect x="95" y="70" width="30" height="190" />
      <rect x="130" y="110" width="20" height="150" />
      <rect x="155" y="60" width="26" height="200" />
      <rect x="186" y="130" width="22" height="130" />
      <rect x="213" y="95" width="18" height="165" />
      <rect x="236" y="150" width="30" height="110" />
      <rect x="270" y="80" width="24" height="180" />
      <rect x="298" y="115" width="20" height="145" />
      <rect x="322" y="65" width="28" height="195" />
      <rect x="354" y="135" width="20" height="125" />
      <rect x="378" y="100" width="18" height="160" />
    </g>
  </svg>
);

export const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

export const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
