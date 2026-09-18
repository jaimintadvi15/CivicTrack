import React from 'react';
import { CivicHeroIcon } from './CivicHeroLogo';

interface CivicLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLogo?: boolean;
  className?: string;
}

/**
 * Pro Web Developer Loading Spinner:
 * Features a glowing Google 4-color gradient conic spinning border ring,
 * ambient aura pulse, and the signature Urban Fix logo inside the moving circle.
 */
export const CivicLoadingSpinner: React.FC<CivicLoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading civic platform...',
  showLogo = true,
  className = '',
}) => {
  const dimensions = {
    sm: { container: 'w-14 h-14', icon: 26, text: 'text-xs', gap: 'mb-2' },
    md: { container: 'w-20 h-20', icon: 40, text: 'text-xs', gap: 'mb-4' },
    lg: { container: 'w-24 h-24', icon: 48, text: 'text-sm', gap: 'mb-5' },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-4 text-center select-none ${className}`}>
      {/* Outer Spinner Container with Aura */}
      <div className={`relative ${dimensions.container} ${dimensions.gap} flex items-center justify-center`}>
        {/* Ambient Glowing Aura */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#4285F4]/30 via-[#EA4335]/20 to-[#FBBC05]/20 blur-md animate-pulse pointer-events-none" />

        {/* Google 4-Color Conic Gradient Spinning Border Ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin filter drop-shadow-[0_0_8px_rgba(66,133,244,0.45)]"
          style={{
            background: 'conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 3px))',
          }}
        />

        {/* Inner Counter-Rotating Subtle Ring */}
        <div className="absolute inset-1 rounded-full border border-dashed border-[#4285F4]/30 animate-[spin_5s_linear_infinite_reverse]" />

        {/* Brand Logo inside the Moving Circle */}
        {showLogo && (
          <div className="relative z-10 flex items-center justify-center animate-pulse">
            <CivicHeroIcon size={dimensions.icon} />
          </div>
        )}
      </div>

      {/* Title & Animated Subtitle */}
      {label && (
        <div className="flex flex-col items-center">
          <div className="font-bold tracking-wider text-[#202124] text-sm flex items-center gap-1">
            <span>URBAN</span>
            <span className="text-[#4285F4]">FIX</span>
          </div>
          <div className={`font-medium text-[#5F6368] ${dimensions.text} mt-1 flex items-center gap-0.5`}>
            <span>{label.replace(/\.\.\.$/, '')}</span>
            <span className="inline-flex">
              <span className="animate-[bounce_1.4s_infinite_0s] text-[#4285F4] font-bold">.</span>
              <span className="animate-[bounce_1.4s_infinite_0.2s] text-[#EA4335] font-bold">.</span>
              <span className="animate-[bounce_1.4s_infinite_0.4s] text-[#FBBC05] font-bold">.</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivicLoadingSpinner;
