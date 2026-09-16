import React from 'react';

export interface CivicHeroLogoProps {
  /**
   * Layout variant:
   * - 'full': Vertical stacked lockup (centered icon mark, wordmark, tagline)
   * - 'horizontal': Inline row (icon mark on left, wordmark and tagline on right)
   * - 'icon': Only the pin + person + leaf + 4-color base mark
   * - 'wordmark': Only the "CIVIC HERO" typography + optional tagline
   */
  variant?: 'full' | 'horizontal' | 'icon' | 'wordmark';
  /**
   * Size presets or custom dimension
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * Monochrome mode: uses single dark neutral #202124
   */
  monochrome?: boolean;
  /**
   * Inverted mode: uses white/light text and strokes for dark backgrounds
   */
  inverted?: boolean;
  /**
   * Whether to display the tagline beneath the wordmark
   */
  showTagline?: boolean;
  /**
   * Custom tagline text (defaults to 'CHANGE YOUR CITY.')
   */
  taglineText?: string;
  /**
   * Optional custom click handler
   */
  onClick?: (e: React.MouseEvent) => void;
  /**
   * Additional container CSS classes
   */
  className?: string;
}

/**
 * The brand icon mark: Location Pin (Google Blue) + Person Silhouette (White) +
 * Eco Leaf / Swoosh Accent (Google Green) + 4-Color Base Accent in Google Sequence
 * (Blue, Red, Yellow, Green).
 */
export const CivicHeroIcon: React.FC<{
  size?: number | string;
  monochrome?: boolean;
  inverted?: boolean;
  className?: string;
}> = ({ size = 36, monochrome = false, inverted = false, className = '' }) => {
  // Theme colors
  const blue = monochrome ? (inverted ? '#FFFFFF' : '#202124') : '#4285F4';
  const red = monochrome ? (inverted ? '#FFFFFF' : '#202124') : '#EA4335';
  const yellow = monochrome ? (inverted ? '#FFFFFF' : '#202124') : '#FBBC05';
  const green = monochrome ? (inverted ? '#FFFFFF' : '#202124') : '#34A853';
  const pinOutline = monochrome ? (inverted ? '#FFFFFF' : '#202124') : '#1A73E8';
  const personFill = monochrome ? (inverted ? '#202124' : '#FFFFFF') : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Civic Hero Brand Mark"
      role="img"
    >
      {/* 4-Color Base / Road Accent in Google Sequence: Blue, Red, Yellow, Green */}
      <rect x="13" y="53" width="6" height="2.5" rx="1.25" fill={blue} />
      <rect x="21" y="53" width="6" height="2.5" rx="1.25" fill={red} />
      <rect x="29" y="53" width="6" height="2.5" rx="1.25" fill={yellow} />
      <rect x="37" y="53" width="6" height="2.5" rx="1.25" fill={green} />

      {/* Eco Leaf / Swoosh Accent (Google Green) */}
      <path
        d="M33 40 C37 35 46.5 25.5 49.5 12 C41 13.5 34 22 31 29 C29.5 32.5 31.5 37.5 33 40 Z"
        fill={green}
      />
      <path
        d="M33.5 38.5 C36.5 32 43 23 48.5 14"
        stroke={inverted ? '#202124' : '#FFFFFF'}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Pin Body (Google Blue) with Subtle Outline */}
      <path
        d="M28 7 C36.284 7 43 13.716 43 22 C43 31.2 34 40.5 28 49 C22 40.5 13 31.2 13 22 C13 13.716 19.716 7 28 7 Z"
        fill={blue}
        stroke={pinOutline}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Person Silhouette (Inside Pin, High-Contrast White) */}
      <circle cx="28" cy="17.5" r="3.75" fill={personFill} />
      <path
        d="M20.5 29.5 C21 25.2 24.2 23.5 28 23.5 C31.8 23.5 35 25.2 35.5 29.5 C33.4 32 28 33 28 33 C28 33 22.6 32 20.5 29.5 Z"
        fill={personFill}
      />
    </svg>
  );
};

export const CivicHeroLogo: React.FC<CivicHeroLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  monochrome = false,
  inverted = false,
  showTagline = true,
  taglineText = 'CHANGE YOUR CITY.',
  onClick,
  className = '',
}) => {
  // Determine pixel sizes based on presets
  const sizeMap = {
    sm: { icon: 28, text: 'text-base sm:text-lg', tagline: 'text-[9px]', gap: 'gap-2' },
    md: { icon: 38, text: 'text-xl sm:text-2xl', tagline: 'text-[10px]', gap: 'gap-2.5' },
    lg: { icon: 48, text: 'text-2xl sm:text-3xl', tagline: 'text-xs', gap: 'gap-3' },
    xl: { icon: 68, text: 'text-3xl sm:text-4xl', tagline: 'text-sm', gap: 'gap-3.5' },
  };

  const currentSize = typeof size === 'number' ? { icon: size, text: 'text-xl', tagline: 'text-[10px]', gap: 'gap-2' } : sizeMap[size];

  // Color mappings
  const civicColor = monochrome ? (inverted ? 'text-white' : 'text-[#202124]') : (inverted ? 'text-white' : 'text-[#202124]');
  const heroColor = monochrome ? (inverted ? 'text-white' : 'text-[#202124]') : 'text-[#4285F4]';
  const taglineColor = monochrome ? (inverted ? 'text-white/80' : 'text-[#202124]/80') : 'text-[#5F6368]';

  // 1. Icon Only
  if (variant === 'icon') {
    return (
      <div onClick={onClick} className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <CivicHeroIcon size={currentSize.icon} monochrome={monochrome} inverted={inverted} />
      </div>
    );
  }

  // 2. Full Stacked Variant (Centered)
  if (variant === 'full') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center ${currentSize.gap} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <CivicHeroIcon size={currentSize.icon} monochrome={monochrome} inverted={inverted} />
        <div className="flex flex-col items-center">
          <div className={`font-bold tracking-tight ${currentSize.text} leading-none flex items-center space-x-1.5`}>
            <span className={civicColor}>CIVIC</span>
            <span className={heroColor}>HERO</span>
          </div>
          {showTagline && (
            <span className={`font-medium tracking-[0.18em] uppercase ${currentSize.tagline} ${taglineColor} mt-1.5`}>
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 3. Wordmark Only
  if (variant === 'wordmark') {
    return (
      <div onClick={onClick} className={`flex flex-col ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <div className={`font-bold tracking-tight ${currentSize.text} leading-tight flex items-center space-x-1.5`}>
          <span className={civicColor}>CIVIC</span>
          <span className={heroColor}>HERO</span>
        </div>
        {showTagline && (
          <span className={`font-medium tracking-[0.16em] uppercase ${currentSize.tagline} ${taglineColor} mt-0.5`}>
            {taglineText}
          </span>
        )}
      </div>
    );
  }

  // 4. Horizontal Variant (Icon Left + Text Right)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.gap} select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <CivicHeroIcon size={currentSize.icon} monochrome={monochrome} inverted={inverted} />
      <div className="flex flex-col justify-center">
        <div className={`font-bold tracking-tight ${currentSize.text} leading-tight flex items-center space-x-1`}>
          <span className={civicColor}>CIVIC</span>
          <span className={heroColor}>HERO</span>
        </div>
        {showTagline && (
          <span className={`font-medium tracking-[0.14em] uppercase ${currentSize.tagline} ${taglineColor} mt-0.5 whitespace-nowrap block`}>
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};

export default CivicHeroLogo;
