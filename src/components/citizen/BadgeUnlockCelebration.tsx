import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { createRipple } from '../common/MaterialRipple';

export const BadgeUnlockCelebration: React.FC = () => {
  const { celebratingBadge, setCelebratingBadge, triggerCelebration, currentUser } = useApp();

  useEffect(() => {
    if (celebratingBadge) {
      triggerCelebration();
    }
  }, [celebratingBadge]);

  if (!celebratingBadge) return null;

  const handleClose = () => {
    setCelebratingBadge(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-badge-title"
    >
      <div
        className="bg-white rounded-2xl shadow-elevation-8 max-w-md w-full overflow-hidden border border-[#FEEFC3] text-center relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Google 4-Color Strip */}
        <div className="google-accent-bar" />

        {/* Decorative Golden Sunburst Header */}
        <div className="relative pt-8 pb-6 px-6 bg-gradient-to-b from-[#FEF7E0] via-[#FFF9E6] to-white border-b border-[#FEEFC3]/60 overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-black/5 transition-colors ripple-surface z-10"
            aria-label="Close celebration modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Ambient Glow & Concentric Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-[#FBBC05]/30 to-[#F59E0B]/20 blur-2xl animate-pulse" />
          </div>

          {/* Scaled Bouncy Badge Medal */}
          <div className="relative mx-auto mb-4 flex items-center justify-center">
            {/* Outer Gold Ring */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FBBC05] via-[#F5A623] to-[#E67C00] p-1 shadow-elevation-4 animate-bounce-scale-in">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center badge-shimmer-container relative">
                <span className="text-5xl select-none filter drop-shadow-md">
                  {celebratingBadge.icon}
                </span>
                {/* Checkmark Ribbon */}
                <div className="absolute -bottom-1 -right-1 bg-[#34A853] text-white p-1 rounded-full shadow-md border-2 border-white">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>

          {/* Congratulatory Tag & Title */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FEF7E0] border border-[#FBBC05]/50 text-[#B06000] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-[#FBBC05] text-[#FBBC05]" />
            <span>Civic Achievement Earned</span>
          </div>

          <h3
            id="celebration-badge-title"
            className="text-2xl font-bold text-[#202124] tracking-tight"
          >
            🎉 You've earned the {celebratingBadge.name}!
          </h3>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Recognized across {currentUser.ward.split('-')[0].trim()}
          </p>
        </div>

        {/* Modal Body with Trophy Details */}
        <div className="p-6 space-y-4">
          <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#DADCE0] text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#202124] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#34A853]" />
                Perk Unlocked
              </span>
              <span className="text-[#34A853] font-bold bg-[#E6F4EA] px-2 py-0.5 rounded-full border border-[#CEEAD6]">
                Verified
              </span>
            </div>
            <p className="text-xs text-[#3C4043] leading-relaxed">
              {celebratingBadge.description}
            </p>
            {celebratingBadge.unlockedAt && (
              <div className="text-[11px] text-[#5F6368] pt-1 border-t border-[#E8EAED]">
                Earned: <span className="font-medium text-[#202124]">{celebratingBadge.unlockedAt}</span>
              </div>
            )}
          </div>

          {/* Gamification Bonus Callout */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#FEF7E0]/60 border border-[#FEEFC3]">
            <div className="flex items-center space-x-2 text-left">
              <span className="text-lg">⭐</span>
              <div>
                <p className="text-xs font-bold text-[#202124]">Citizen Reputation Boost</p>
                <p className="text-[10px] text-[#5F6368]">Strengthens your priority on city dispatch queue</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#B06000] bg-white px-2 py-1 rounded shadow-xs border border-[#FEEFC3]">
              +50 XP
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={(e) => {
                createRipple(e, 'rgba(0, 0, 0, 0.1)');
                triggerCelebration();
              }}
              className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-lg border border-[#DADCE0] hover:bg-[#F8F9FA] text-xs font-medium text-[#3C4043] transition-colors ripple-surface flex items-center justify-center space-x-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-[#5F6368]" />
              <span>Celebrate Again</span>
            </button>
            <button
              onClick={(e) => {
                createRipple(e, 'rgba(255, 255, 255, 0.4)');
                handleClose();
              }}
              className="w-full sm:flex-1 px-5 py-2.5 rounded-lg btn-golden-claim text-xs uppercase tracking-wider ripple-surface flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-[#202124]/30 text-[#202124]" />
              <span>Collect Perk & Continue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
