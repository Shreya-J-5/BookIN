import React from 'react';

/**
 * Official BookIN Application Logo as provided by the user.
 * Displays the official stylized monogram + "BOOKIN" emblem
 * with transparent background.
 */
export function BookinLogo({ variant = 'light', size = 'default', className = '' }) {
  const isDark = variant === 'dark';
  const logoSrc = isDark ? '/bookin-logo-light.png' : '/bookin-logo.png';
  
  // Height sizing
  const heightClass =
    size === 'small' ? 'h-7' : size === 'large' ? 'h-11' : 'h-8 sm:h-9';

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="BookIN"
        className={`${heightClass} w-auto object-contain transition-transform group-hover:scale-[1.02]`}
        onError={(e) => {
          // Fallback to uncropped or original logo if needed
          if (!e.target.dataset.triedFallback) {
            e.target.dataset.triedFallback = 'true';
            e.target.src = '/bookin-logo-white.png';
          }
        }}
      />
    </div>
  );
}

/**
 * Outlined BookIN Monogram Emblem matching the official logo
 * used for empty states, placeholders, and watermarks.
 */
export function BookinIconOutline({ className = 'w-16 h-16 text-[#202020]' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Serif 'I' vertical pillar */}
      <path
        d="M20 18H52V28H44V72H52V82H20V72H28V28H20V18Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Play contour curving out from 'I' */}
      <path
        d="M44 38C52 38 78 50 78 50C78 50 52 62 44 62"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
