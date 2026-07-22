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
