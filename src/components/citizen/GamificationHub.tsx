import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Award, Users, CheckCircle2, Lock, X, Sparkles, ChevronRight } from 'lucide-react';
import { createRipple } from '../common/MaterialRipple';

interface GamificationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({ isOpen, onClose }) => {
  const { currentUser, leaderboard, t, celebrateBadge } = useApp();
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard'>('badges');
  const [leaderboardScope, setLeaderboardScope] = useState<'ward' | 'city'>('ward');

  if (!isOpen) return null;

  const currentLevelProgress = Math.min(
    100,
    Math.round(((currentUser.points % 200) / 200) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded shadow-elevation-8 w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header with Google Brand Blue & Accent Bar */}
        <div className="bg-[#4285F4] text-white relative overflow-hidden flex-shrink-0">
          <div className="google-accent-bar" />
          <div className="p-5">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded bg-white/20 text-[#FBBC05] flex items-center justify-center border border-white/30">
                  <Trophy className="w-5 h-5 fill-[#FBBC05]" />
                </div>
                <h3 className="text-base font-medium text-white tracking-wide">{t.earnXp}</h3>
              </div>
              <button
                onClick={(e) => {
                  createRipple(e);
                  onClose();
                }}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors ripple-surface"
                aria-label="Close rewards modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Level Progress Banner */}
            <div className="mt-4 bg-white/15 backdrop-blur-xs rounded p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/90 font-medium">
                    {t.level} {currentUser.level}
                  </span>
                  <h4 className="text-lg font-medium text-white">{currentUser.levelName}</h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#FBBC05] drop-shadow-xs">{currentUser.points}</span>
                  <span className="text-xs text-white/80 font-medium block uppercase tracking-wider">{t.points}</span>
                </div>
              </div>

              {/* Progress Bar (Google Yellow) */}
              <div className="mt-3">
                <div className="w-full bg-black/25 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#FBBC05] h-full rounded-full transition-all duration-500"
                    style={{ width: `${currentLevelProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/80 mt-1.5 font-medium uppercase tracking-wider">
                  <span>Current: {currentUser.points} XP</span>
                  <span>Next Tier: {currentUser.nextLevelPoints} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#DADCE0] bg-white flex-shrink-0">
          <button
            onClick={(e) => {
              createRipple(e);
              setActiveTab('badges');
            }}
            className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-all ripple-surface ${
              activeTab === 'badges'
                ? 'border-[#4285F4] text-[#1A73E8] bg-[#E8F0FE]/40'
                : 'border-transparent text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{t.badgesTitle} ({currentUser.badges.filter((b) => b.unlocked).length}/{currentUser.badges.length})</span>
          </button>
          <button
            onClick={(e) => {
              createRipple(e);
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-all ripple-surface ${
              activeTab === 'leaderboard'
                ? 'border-[#4285F4] text-[#1A73E8] bg-[#E8F0FE]/40'
                : 'border-transparent text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.leaderboard}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'badges' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#FBBC05]" />
                    Civic Honors & Achievements
                  </span>
                  <p className="text-[11px] text-[#5F6368]">Click any unlocked badge to celebrate your civic impact</p>
                </div>
                <span className="text-xs font-bold text-[#B06000] bg-[#FEF7E0] px-2.5 py-1 rounded-full border border-[#FBBC05]/40 shadow-2xs">
                  {currentUser.badges.filter((b) => b.unlocked).length}/{currentUser.badges.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.badges.map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => {
                      if (badge.unlocked) {
                        celebrateBadge(badge);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all flex items-start space-x-3.5 shadow-elevation-1 select-none ${
                      badge.unlocked
                        ? 'trophy-shelf-card cursor-pointer group'
                        : 'trophy-shelf-card-locked cursor-default'
                    }`}
                  >
                    {/* Badge Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xs ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-[#FEF7E0] to-[#FFF3CD] border border-[#FBBC05]/50 badge-shimmer-container'
                          : 'bg-[#E8EAED] border border-[#DADCE0] text-[#70757A]'
                      }`}
                    >
                      <span>{badge.icon}</span>
                    </div>

                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5
                          className={`text-xs font-bold truncate ${
                            badge.unlocked
                              ? 'text-[#202124] group-hover:text-[#B06000] transition-colors'
                              : 'text-[#5F6368]'
                          }`}
                        >
                          {badge.name}
                        </h5>
                        {badge.unlocked ? (
                          <span className="text-[10px] bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                            <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#F1F3F4] text-[#5F6368] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide border border-[#DADCE0]">
                            <Lock className="w-3 h-3 text-[#70757A]" /> {badge.progress}/{badge.maxProgress}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5F6368] mt-1 leading-snug">
                        {badge.description}
                      </p>

                      {/* Progress indicator or Celebration link */}
                      {badge.unlocked ? (
                        <div className="mt-2.5 pt-2 border-t border-[#FEEFC3]/60 flex items-center justify-between text-[10px] text-[#B06000] font-semibold">
                          <span>🎉 {badge.unlockedAt || 'Earned'}</span>
                          <span className="underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Celebrate <Sparkles className="w-3 h-3" />
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="w-full bg-[#E8EAED] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#FBBC05] h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (badge.progress / badge.maxProgress) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-[#70757A] mt-1 block font-medium">
                            {badge.maxProgress - badge.progress} more to unlock
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Sub-scope toggle (Ward vs City) */}
              <div className="flex items-center justify-between bg-gray-100 p-0.5 rounded border border-[#DADCE0]">
                <button
                  onClick={(e) => {
                    createRipple(e);
                    setLeaderboardScope('ward');
                  }}
                  className={`flex-1 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-all ripple-surface ${
                    leaderboardScope === 'ward'
                      ? 'bg-white shadow-elevation-1 text-[#1A73E8] font-bold'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  Indiranagar Ward
                </button>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    setLeaderboardScope('city');
                  }}
                  className={`flex-1 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-all ripple-surface ${
                    leaderboardScope === 'city'
                      ? 'bg-white shadow-elevation-1 text-[#1A73E8] font-bold'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  Bengaluru Citywide
                </button>
              </div>

              {/* Leaderboard rows */}
              <div className="space-y-2">
                {leaderboard.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      item.isCurrentUser
                        ? 'bg-[#E8F0FE] border-[#4285F4]/40 shadow-elevation-1'
                        : 'bg-white border-[#DADCE0] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className={`w-6 text-center text-xs font-bold flex-shrink-0 ${
                          item.rank === 1
                            ? 'text-[#FBBC05] text-sm'
                            : item.rank === 2
                            ? 'text-gray-400 text-sm'
                            : item.rank === 3
                            ? 'text-amber-700 text-sm'
                            : 'text-[#5F6368]'
                        }`}
                      >
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                      </span>

                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#DADCE0]"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1">
                          <h6 className="text-xs font-medium text-[#202124] truncate">{item.name}</h6>
                        </div>
                        <p className="text-[10px] text-[#5F6368] truncate">{item.badgeTitle} • {item.ward}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-[#B06000]">{item.points} XP</span>
                      <span className="text-[10px] text-[#5F6368] block">{item.reportsCount} reports</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#FFFDF7] border-t border-[#FEEFC3] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <p className="text-[11px] text-[#5F6368] text-center sm:text-left">
            Earn <strong>+25 XP</strong> per report, <strong>+15 XP</strong> for duplicate merge, <strong>+50 XP</strong> when resolved!
          </p>
          <button
            onClick={(e) => {
              createRipple(e, 'rgba(255, 255, 255, 0.4)');
              const firstUnlocked = currentUser.badges.find((b) => b.unlocked);
              if (firstUnlocked) {
                celebrateBadge(firstUnlocked);
              }
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg btn-golden-claim text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer ripple-surface shadow-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#202124]/20 text-[#202124]" />
            <span>Celebrate Honours</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
