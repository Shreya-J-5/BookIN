import React from 'react';

/**
 * Exact BookIN logo monogram based on the reference design.
 * Features the gold polygon badge with the stylized 'iB' geometry,
 * 'BOOKIN' bold title, and 'ENTERTAINMENT & MOVIES' sub-caption.
 */
export function BookinLogo({ variant = 'light', size = 'default' }) {
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center space-x-2 select-none group">
      {/* Stylized BookIN Monogram Badge */}
      <svg
        className={size === 'small' ? 'w-7 h-7' : 'w-8 h-8'}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Angled Polygon Ticket Badge in Gold */}
        <polygon
          points="6,10 24,4 38,10 38,34 20,40 6,34"
          fill="#D5A936"
          stroke="#202020"
          strokeWidth="2"
        />
        {/* Stylized 'i' and 'B' internal geometry */}
        <line x1="16" y1="12" x2="16" y2="32" stroke="#202020" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M16 13H26C28.8 13 31 15 31 17.5C31 20 28.8 22 26 22H16"
          stroke="#202020"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 22H27C30 22 32.5 24.2 32.5 27C32.5 29.8 30 32 27 32H16"
          stroke="#202020"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Diagonal ticket cut-line / star dot */}
        <circle cx="10" cy="14" r="1.5" fill="#202020" />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight ${
            size === 'small' ? 'text-lg' : 'text-xl'
          } ${isDark ? 'text-white' : 'text-[#202020]'}`}
        >
          BOOKIN
        </span>
        <span
          className={`text-[7px] font-bold tracking-widest uppercase mt-0.5 ${
            isDark ? 'text-[#A2B0B8]' : 'text-[#666666]'
          }`}
        >
          ENTERTAINMENT & MOVIES
        </span>
      </div>
    </div>
  );
}

/**
 * Outlined BookIN Monogram used for empty states, such as the
 * 'Coming Soon' card in the reference screenshot.
 */
export function BookinIconOutline({ className = 'w-16 h-16 text-[#202020]' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Polygon Badge Outline */}
      <polygon
        points="8,14 32,6 52,14 52,46 28,54 8,46"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stylized 'i' & 'B' Monogram Lines */}
      <line x1="22" y1="17" x2="22" y2="43" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M22 18H36C39.5 18 42.5 20.5 42.5 23.5C42.5 26.5 39.5 29 36 29H22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 29H37.5C41.5 29 44.5 31.8 44.5 35.5C44.5 39.2 41.5 42 37.5 42H22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}
