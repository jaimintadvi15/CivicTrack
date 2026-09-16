import React from 'react';
import { useApp } from '../../context/AppContext';
import { createRipple } from '../common/MaterialRipple';
import {
  Search,
  Camera,
  Sparkles,
  ArrowRight,
  Trophy,
  Activity,
  X,
} from 'lucide-react';
import { CivicHeroLogo } from '../common/CivicHeroLogo';

interface GoogleSearchHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenReport: () => void;
  onBrowseCommunity: () => void;
}

export const GoogleSearchHero: React.FC<GoogleSearchHeroProps> = ({
  searchQuery,
  onSearchChange,
  onOpenReport,
  onBrowseCommunity,
}) => {
  const { t, currentUser } = useApp();

  return (
    <section className="w-full py-8 sm:py-12 flex flex-col items-center justify-center">
      {/* 1. Centered Minimal Hero: Logo + Tagline with Generous Whitespace */}
      <div className="text-center max-w-2xl mx-auto px-4 mb-6 sm:mb-8 space-y-4">
        {/* Official Google-Themed Civic Hero Logo (Icon + Wordmark + Tagline) */}
        <CivicHeroLogo
          variant="full"
          size="xl"
          showTagline={true}
          taglineText={t.tagline || 'CHANGE YOUR CITY.'}
          className="mx-auto"
        />

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#1A73E8] text-xs font-medium border border-[#D2E3FC]">
          <Sparkles className="w-3.5 h-3.5 text-[#4285F4]" />
          <span>BBMP Bengaluru Citizen Governance Portal</span>
        </div>
      </div>

      {/* 2. Prominent Centered Google Search / Action Bar */}
      <div className="w-full max-w-2xl px-4 mb-6">
        <div className="relative flex items-center bg-white rounded-full border border-[#DADCE0] shadow-elevation-1 hover:shadow-elevation-2 focus-within:shadow-elevation-3 focus-within:border-transparent transition-all duration-200 group">
          {/* Search Icon */}
          <div className="pl-4 sm:pl-5 pr-2 text-[#5F6368] group-focus-within:text-[#4285F4] transition-colors">
            <Search className="w-5 h-5" />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search civic issues, pothole, street light, Indiranagar, ticket #..."
            className="w-full py-3.5 sm:py-4 text-sm sm:text-base text-[#202124] placeholder:text-[#5F6368]/80 bg-transparent focus:outline-none"
            aria-label="Search civic issues or enter problem description"
          />

          {/* Clear button if search query exists */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1.5 mr-1 text-[#5F6368] hover:text-[#202124] rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Quick Action Button on Right of Pill */}
          <div className="pr-2 sm:pr-3 flex items-center space-x-1">
            <button
              onClick={(e) => {
                createRipple(e, 'rgba(66, 133, 244, 0.2)');
                onOpenReport();
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-full bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] flex items-center space-x-1.5 text-xs font-medium transition-colors ripple-surface"
              title="Report an Issue with Camera"
              aria-label="Report Issue with Camera"
            >
              <Camera className="w-4 h-4 text-[#4285F4]" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>

        {/* 3. Google-style Centered Action Buttons below Search Bar */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={(e) => {
              createRipple(e, 'rgba(255, 255, 255, 0.3)');
              onOpenReport();
            }}
            className="bg-[#4285F4] hover:bg-[#1A73E8] text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded shadow-elevation-1 hover:shadow-elevation-2 transition-all flex items-center space-x-2 ripple-surface"
          >
            <Camera className="w-4 h-4" />
            <span>Report an Issue</span>
            <span className="bg-[#FBBC05] text-[#202124] text-[10px] font-bold px-1.5 py-0.2 rounded ml-1">
              +25 XP
            </span>
          </button>

          <button
            onClick={(e) => {
              createRipple(e, 'rgba(66, 133, 244, 0.1)');
              onBrowseCommunity();
            }}
            className="bg-white hover:bg-[#F8F9FA] text-[#202124] border border-[#DADCE0] text-xs sm:text-sm font-medium px-5 py-2.5 rounded shadow-elevation-1 hover:shadow-elevation-2 transition-all flex items-center space-x-1.5 ripple-surface"
          >
            <span>Explore Issues</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
          </button>
        </div>
      </div>

      {/* 4. Below-the-Fold 3-Column Feature Cards: "Report", "Track", "Earn" */}
      <div className="w-full max-w-5xl px-4 mt-8 sm:mt-12">
        <div className="text-center mb-6">
          <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368]">
            How Civic Hero Works
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#202124] mt-1">
            Empowering Citizens • Resolving Civic Issues
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Report */}
          <div className="bg-white rounded border border-[#DADCE0] p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow flex flex-col justify-between relative overflow-hidden group">
            <div className="w-1.5 h-full bg-[#4285F4] absolute left-0 top-0" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124]">1. Report with AI Evidence</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Snap a photo on site. Automated GPS geocoding pins your BBMP ward, while on-device AI detects hazard severity and avoids duplicate entries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DADCE0]/60 flex items-center justify-between text-[11px] text-[#4285F4] font-medium">
              <span>Photo + Reverse Geocode</span>
              <span className="text-[#5F6368]">Step 1</span>
            </div>
          </div>

          {/* Card 2: Track */}
          <div className="bg-white rounded border border-[#DADCE0] p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow flex flex-col justify-between relative overflow-hidden group">
            <div className="w-1.5 h-full bg-[#34A853] absolute left-0 top-0" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded bg-[#E6F4EA] text-[#137333] flex items-center justify-center border border-[#CEEAD6]">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124]">2. Track Live BBMP Progress</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Follow real-time ticket progression from Acknowledged to In Progress. Field officers upload verified before/after photographic proof of resolution.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DADCE0]/60 flex items-center justify-between text-[11px] text-[#137333] font-medium">
              <span>Verified Photo Proof</span>
              <span className="text-[#5F6368]">Step 2</span>
            </div>
          </div>

          {/* Card 3: Earn */}
          <div className="bg-white rounded border border-[#DADCE0] p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow flex flex-col justify-between relative overflow-hidden group">
            <div className="w-1.5 h-full bg-[#FBBC05] absolute left-0 top-0" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded bg-[#FEF7E0] text-[#B06000] flex items-center justify-center border border-[#FEEFC3]">
                <Trophy className="w-5 h-5 fill-[#FBBC05] text-[#B06000]" />
              </div>
              <h3 className="text-base font-bold text-[#202124]">3. Earn XP & Badges</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Receive +25 XP upon report submission and +50 XP when verified fixed. Level up from Scout to Civic Champion and climb the neighborhood leaderboard.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DADCE0]/60 flex items-center justify-between text-[11px] text-[#B06000] font-medium">
              <span>Your XP: {currentUser.points} pts</span>
              <span className="text-[#5F6368]">Step 3</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleSearchHero;
