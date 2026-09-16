import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { getAssetUrl } from '../../utils/assetUrl';
import { isListingOwner } from '../../utils/ownership';
import { auth } from '../../lib/firebase';
import { createRipple } from '../common/MaterialRipple';
import { GoogleSearchHero } from './GoogleSearchHero';
import {
  Camera,
  Trophy,
  Clock,
  MapPin,
  ThumbsUp,
  ChevronRight,
  Search,
  CheckCircle2,
  Sparkles,
  Lock,
  Award,
  Flag,
  Trash2,
  User,
} from 'lucide-react';
import { NavSection } from '../common/NavigationRail';

interface CitizenHomeProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenReport: () => void;
  onSelectIssue: (issue: CivicIssue) => void;
  onOpenGamification: () => void;
  selectedIssueId?: string | null;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  activeSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
  onOpenReport,
  onSelectIssue,
  onOpenGamification,
  selectedIssueId,
}) => {
  const { currentUser, role, issues, upvoteReport, flagReport, deleteReport, t, celebrateBadge } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes'>('recent');

  // Gamification level progress calculation
  const currentLevelProgress = Math.min(
    100,
    Math.round(((currentUser.points % 200) / 200) * 100)
  );
  const unlockedBadgesCount = currentUser.badges.filter((b) => b.unlocked).length;

  // Filter issues based on activeSection, search query, and category filters
  const filteredIssues = useMemo(() => {
    let list = issues;

    // Filter by tab
    if (activeSection === 'my-reports') {
      list = list.filter((i) => isListingOwner(i, currentUser, auth?.currentUser?.uid));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.ticketNumber.toLowerCase().includes(q) ||
          i.location.ward.toLowerCase().includes(q) ||
          i.location.address.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((i) => i.category === selectedCategory);
    }

    // Sort by upvotes if selected; otherwise retains most recent order from query
    if (sortBy === 'upvotes') {
      list = [...list].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    }

    return list;
  }, [issues, activeSection, currentUser.id, currentUser.phone, searchQuery, selectedCategory, sortBy]);

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All Categories' },
    { key: 'Pothole', label: 'Potholes' },
    { key: 'Water Leak', label: 'Water Leaks' },
    { key: 'Garbage', label: 'Garbage' },
    { key: 'Street Light', label: 'Street Lights' },
    { key: 'Drainage', label: 'Drainage' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]';
      case 'In Progress':
        return 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]';
      case 'Acknowledged':
        return 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]';
      default:
        return 'bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]';
    }
  };

  const getSeverityChip = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]';
      case 'High':
        return 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]';
      case 'Medium':
        return 'bg-[#FEF7E0] text-[#78350F] border border-[#FBBC05]/40';
      default:
        return 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* SECTION 1: Google Search Centered Minimal Landing Hero (Shown on 'home' tab) */}
      {activeSection === 'home' && (
        <>
          <GoogleSearchHero
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onOpenReport={onOpenReport}
            onBrowseCommunity={() => onSelectSection('community')}
          />

          {/* CIVIC TROPHY SHELF & NEIGHBORHOOD REWARDS */}
          <div className="bg-gradient-to-b from-[#FFFDF7] to-white rounded-2xl border border-[#FEEFC3] shadow-elevation-2 p-5 sm:p-6 space-y-5 relative overflow-hidden">
            {/* Top Shelf Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#FEEFC3]">
              <div className="flex items-center space-x-4">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#FEF7E0] to-[#FFF0B3] border border-[#FBBC05]/40 text-[#B06000] flex items-center justify-center shadow-xs shrink-0 animate-trophy-glow">
                  <Trophy className="w-7 h-7 fill-[#FBBC05] text-[#B06000]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#B06000]">
                      {currentUser.ward.split('-')[0].trim()} • LEVEL {currentUser.level}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF7E0] text-[#B06000] border border-[#FBBC05]/40">
                      <Sparkles className="w-2.5 h-2.5 mr-1 fill-[#FBBC05]" /> {currentUser.levelName}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#202124] mt-0.5">
                    Civic Trophy Shelf & Rewards
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    {unlockedBadgesCount} of {currentUser.badges.length} badges unlocked • Click any unlocked badge to celebrate!
                  </p>
                </div>
              </div>

              {/* Action Buttons: Golden Claim CTA + Report Button */}
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <button
                  onClick={(e) => {
                    createRipple(e, 'rgba(255, 255, 255, 0.4)');
                    onOpenGamification();
                  }}
                  className="flex-1 md:flex-none px-5 py-2.5 rounded-lg btn-golden-claim text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-elevation-1 cursor-pointer ripple-surface"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-[#202124]/20 text-[#202124]" />
                  <span>Claim Rewards & Perks</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
                <button
                  onClick={(e) => {
                    createRipple(e, 'rgba(255, 255, 255, 0.3)');
                    onOpenReport();
                  }}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-[#4285F4] hover:bg-[#1A73E8] text-white text-xs font-medium transition-colors shadow-elevation-1 ripple-surface flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Report Issue</span>
                </button>
              </div>
            </div>

            {/* Level & Points Progress Bar */}
            <div className="bg-[#FEF7E0]/50 rounded-xl p-3.5 border border-[#FEEFC3]">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-[#202124] flex items-center gap-1.5 font-bold">
                  <Award className="w-4 h-4 text-[#FBBC05]" />
                  Level {currentUser.level} Progress
                </span>
                <span className="text-[#5F6368]">
                  <strong className="text-[#B06000]">{currentUser.points} XP</strong> / {currentUser.nextLevelPoints} XP ({currentLevelProgress}%)
                </span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-2.5 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-[#FBBC05] via-[#F5A623] to-[#E67C00] h-full rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#5F6368] mt-1.5 font-medium">
                <span>⭐ {currentUser.points} Citizen XP collected</span>
                <span>{currentUser.nextLevelPoints - currentUser.points} XP to next citizen rank</span>
              </div>
            </div>

            {/* Trophy Shelf Horizontal Carousel */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368] flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[#FBBC05]" />
                  Trophy Showcase
                </span>
                <span className="text-[11px] text-[#5F6368]">
                  Scroll horizontally to view all trophies →
                </span>
              </div>

              <div className="flex items-stretch space-x-3.5 overflow-x-auto pb-2 pt-1 -mx-1 px-1 scrollbar-thin">
                {currentUser.badges.map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => {
                      if (badge.unlocked) {
                        celebrateBadge(badge);
                      }
                    }}
                    className={`min-w-[210px] sm:min-w-[230px] max-w-[240px] p-4 rounded-xl flex flex-col justify-between select-none ${
                      badge.unlocked
                        ? 'trophy-shelf-card cursor-pointer group'
                        : 'trophy-shelf-card-locked cursor-default'
                    }`}
                  >
                    {/* Top: Icon & Status */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs ${
                          badge.unlocked
                            ? 'bg-gradient-to-br from-[#FEF7E0] to-[#FFF3CD] border border-[#FBBC05]/50 badge-shimmer-container'
                            : 'bg-[#E8EAED] border border-[#DADCE0] text-[#70757A]'
                        }`}
                      >
                        <span>{badge.icon}</span>
                      </div>

                      {badge.unlocked ? (
                        <span className="text-[10px] bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#F1F3F4] text-[#5F6368] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide border border-[#DADCE0]">
                          <Lock className="w-3 h-3 text-[#70757A]" /> {badge.progress}/{badge.maxProgress}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="my-2.5">
                      <h4
                        className={`text-sm font-bold truncate ${
                          badge.unlocked
                            ? 'text-[#202124] group-hover:text-[#B06000] transition-colors'
                            : 'text-[#5F6368]'
                        }`}
                      >
                        {badge.name}
                      </h4>
                      <p className="text-[11px] text-[#5F6368] line-clamp-2 mt-1 leading-snug">
                        {badge.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-[#FEEFC3]/60 mt-auto">
                      {badge.unlocked ? (
                        <div className="flex items-center justify-between text-[10px] text-[#B06000] font-semibold">
                          <span>🎉 {badge.unlockedAt || 'Earned'}</span>
                          <span className="underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Celebrate <Sparkles className="w-3 h-3" />
                          </span>
                        </div>
                      ) : (
                        <div>
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
          </div>
        </>
      )}

      {/* SECTION 2: Filter Toolbar (Google Workspace-style Pills) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#DADCE0]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#202124]">
              {activeSection === 'home'
                ? 'Recent Community Issues'
                : activeSection === 'my-reports'
                ? 'My Reported Issues'
                : activeSection === 'leaderboard'
                ? 'Civic Leaderboard & Rankings'
                : 'Community Issues Feed'}
            </h2>
            <p className="text-xs text-[#5F6368] mt-0.5">
              {activeSection === 'my-reports'
                ? `${filteredIssues.length} issues reported by you`
                : activeSection === 'community'
                ? `${filteredIssues.length} community reports across Bengaluru`
                : `${filteredIssues.length} reports in ${currentUser.ward.split('-')[0]}`}
            </p>
          </div>

          {/* Filter & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5">
            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.15)');
                    setSelectedCategory(cat.key);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    selectedCategory === cat.key
                      ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#4285F4]'
                      : 'bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Toggle: Newest vs Most Upvoted */}
            <div className="flex items-center space-x-1.5 shrink-0 sm:pl-2.5 sm:border-l sm:border-[#DADCE0]">
              <button
                onClick={(e) => {
                  createRipple(e, 'rgba(66, 133, 244, 0.15)');
                  setSortBy('recent');
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                  sortBy === 'recent'
                    ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#4285F4]'
                    : 'bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]'
                }`}
                title="Sort by most recent"
              >
                Newest
              </button>
              <button
                onClick={(e) => {
                  createRipple(e, 'rgba(251, 188, 5, 0.2)');
                  setSortBy('upvotes');
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                  sortBy === 'upvotes'
                    ? 'bg-[#FEF7E0] text-[#B06000] border-[#FBBC05]/60'
                    : 'bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]'
                }`}
                title="Sort by most upvoted"
              >
                Most Upvoted 🔥
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: 12-Column Responsive Grid Content Area */}
        {filteredIssues.length === 0 ? (
          /* Google-Style Empty State: Centered Icon, Clear Copy, Single Action Button */
          <div className="bg-white rounded-xl p-12 text-center shadow-elevation-1 border border-[#DADCE0] max-w-md mx-auto my-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
              <Search className="w-8 h-8 text-[#4285F4]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#202124]">
                {searchQuery ? 'No matching issues found' : 'No issues reported yet'}
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                {searchQuery
                  ? `We couldn't find anything matching "${searchQuery}". Try searching a different ward, landmark, or category.`
                  : 'Be the first citizen in your neighborhood to report an issue and earn +25 XP!'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={(e) => {
                  createRipple(e, 'rgba(255, 255, 255, 0.3)');
                  if (searchQuery) onSearchChange('');
                  else onOpenReport();
                }}
                className="bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium text-xs px-6 py-2.5 rounded-full shadow-elevation-1 hover:shadow-elevation-2 transition-all ripple-surface"
              >
                {searchQuery ? 'Clear Search Filter' : 'Report an Issue (+25 XP)'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => {
              const isResolved = issue.status === 'Resolved';
              const isSelected = selectedIssueId === issue.id;

              return (
                <div
                  key={issue.id}
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.1)');
                    onSelectIssue(issue);
                  }}
                  className={`bg-white rounded-xl shadow-elevation-1 hover:shadow-elevation-3 transition-all duration-200 border flex flex-col justify-between overflow-hidden cursor-pointer group ripple-surface ${
                    isSelected
                      ? 'border-[#4285F4] ring-2 ring-[#4285F4]/30 shadow-elevation-3'
                      : 'border-[#DADCE0]'
                  }`}
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    <img
                      src={isResolved && issue.afterPhotoUrl ? issue.afterPhotoUrl : issue.photoUrl}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getAssetUrl('issues/garbage.jpg');
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Top Row: Ticket Number & Status Badge */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-mono font-medium bg-[#202124]/85 text-white px-2 py-0.5 rounded shadow-sm">
                        #{issue.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm ${getStatusBadge(
                          issue.status
                        )}`}
                      >
                        {t.statuses[issue.status] || issue.status}
                      </span>
                    </div>

                    {isResolved && (
                      <span className="absolute bottom-2.5 right-2.5 bg-[#34A853] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>RESOLVED</span>
                      </span>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white drop-shadow">
                        {t.categories[issue.category] || issue.category}
                      </span>
                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.2 rounded shadow-xs ${getSeverityChip(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-[#202124] line-clamp-2 leading-snug group-hover:text-[#1A73E8] transition-colors">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-[#5F6368] mt-1 flex items-start">
                        <MapPin className="w-3.5 h-3.5 text-[#4285F4] mr-1 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{issue.location.address}</span>
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="space-y-2 pt-2 border-t border-[#DADCE0]/60">
                      <div className="flex items-center justify-between text-xs text-[#5F6368]">
                        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                          <span
                            className="flex items-center text-[11px] text-[#5F6368] truncate"
                            title={`Reported by ${issue.citizenName || 'Citizen'}`}
                          >
                            <User className="w-3 h-3 mr-1 shrink-0 text-[#70757A]" />
                            <span className="truncate">
                              {issue.citizenName ? `By ${issue.citizenName}` : 'By a citizen'}
                            </span>
                          </span>
                          <span className="text-[#DADCE0]">•</span>
                          <span className="flex items-center text-[11px] shrink-0">
                            <Clock className="w-3 h-3 mr-1 text-[#70757A]" />
                            {issue.createdAt}
                          </span>
                        </div>
                        {issue.assignedWorkerName && (
                          <span className="text-[#1A73E8] text-[11px] font-medium truncate max-w-[110px] shrink-0 ml-1">
                            {issue.assignedWorkerName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              createRipple(e, 'rgba(66, 133, 244, 0.2)');
                              upvoteReport(issue.id);
                            }}
                            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-all ripple-surface ${
                              issue.hasUpvoted
                                ? 'bg-[#E8F0FE] text-[#1A73E8] border border-[#4285F4]'
                                : 'bg-white text-[#202124] border border-[#DADCE0] hover:bg-[#F8F9FA]'
                            }`}
                            title={issue.hasUpvoted ? "You confirmed facing this issue" : "I'm facing this too / Upvote (+5 XP)"}
                            aria-label="I'm facing this too / Upvote"
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${issue.hasUpvoted ? 'fill-[#1A73E8] text-[#1A73E8]' : ''}`} />
                            <span>{issue.upvotes}</span>
                            {issue.mergedCount > 0 && (
                              <span className="text-[9px] text-[#B06000] font-bold bg-[#FEF7E0] border border-[#FBBC05]/40 px-1 rounded">
                                +{issue.mergedCount}
                              </span>
                            )}
                          </button>

                          {isListingOwner(issue, currentUser, auth?.currentUser?.uid) || role === 'municipal' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const message =
                                  issue.status !== 'Submitted'
                                    ? `This issue is already being worked on (${issue.status}) — are you sure you want to delete this report? This cannot be undone.`
                                    : "Delete this report? This can't be undone.";
                                if (window.confirm(message)) {
                                  deleteReport(issue.id);
                                }
                              }}
                              title="Delete your report"
                              className="p-1 rounded text-[#5F6368] hover:text-[#EA4335] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              aria-label="Delete report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Report this listing as spam or inappropriate? It will be hidden pending review.')) {
                                  flagReport(issue.id);
                                }
                              }}
                              title="Report listing as spam"
                              className="p-1 rounded text-[#5F6368] hover:text-[#EA4335] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              aria-label="Report listing as spam"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <span className="text-xs text-[#1A73E8] font-medium group-hover:underline flex items-center">
                          Inspect Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenHome;
