import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { createRipple } from './MaterialRipple';
import {
  Menu,
  LayoutDashboard,
  HardHat,
  Users,
  Globe,
  LogOut,
  Bell,
  Trophy,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';
import { languageList } from '../../i18n/translations';
import { CivicHeroLogo } from './CivicHeroLogo';

interface RoleSwitcherBarProps {
  onToggleRail?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenLanguage: () => void;
  onOpenNotifications?: () => void;
  onOpenGamification?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({
  onToggleRail,
  searchQuery,
  onSearchChange,
  onOpenLanguage,
  onOpenNotifications,
  onOpenGamification,
}) => {
  const {
    role,
    setRole,
    language,
    session,
    logout,
    currentUser,
    unreadNotificationCount,
    t,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const roles: { key: UserRole; label: string; icon: React.ReactNode }[] = [
    {
      key: 'citizen',
      label: t.citizenRole || 'Citizen Portal',
      icon: <Users className="w-4 h-4" />,
    },
    {
      key: 'municipal',
      label: t.municipalRole || 'Municipal HQ',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      key: 'worker',
      label: t.workerRole || 'Field Ops',
      icon: <HardHat className="w-4 h-4" />,
    },
  ];

  const currentLangObj = languageList.find((l) => l.code === language);
  const activeRoleObj = roles.find((r) => r.key === role) || roles[0];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 z-40 bg-white text-[#202124] border-b border-[#DADCE0] shadow-xs">
      {/* Signature Google 4-Color Accent Strip */}
      <div className="google-accent-bar" />

      <div className="w-full px-3 sm:px-5 h-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger menu toggle + Logo and Name */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {onToggleRail && (
            <button
              onClick={(e) => {
                createRipple(e, 'rgba(0, 0, 0, 0.1)');
                onToggleRail();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition-colors ripple-surface"
              aria-label="Toggle navigation rail"
              title="Main menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2 cursor-pointer select-none">
            <CivicHeroLogo
              variant="horizontal"
              size="sm"
              showTagline={false}
            />
            <span className="hidden sm:inline-block text-[10px] font-medium bg-[#E8F0FE] text-[#1A73E8] px-1.5 py-0.5 rounded border border-[#D2E3FC]">
              BBMP
            </span>
          </div>
        </div>

        {/* Center: Google-Style Pill Search Bar */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-4">
          <div className="relative flex items-center bg-[#F1F3F4] hover:bg-[#E8EAED] focus-within:bg-white rounded-full border border-transparent focus-within:border-[#DADCE0] focus-within:shadow-elevation-2 transition-all duration-200">
            <div className="pl-3.5 sm:pl-4 pr-2 text-[#5F6368] focus-within:text-[#4285F4]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search issues, ward, ticket #, pothole, street light..."
              className="w-full py-2 sm:py-2.5 text-xs sm:text-sm text-[#202124] placeholder:text-[#5F6368] bg-transparent focus:outline-none"
              aria-label="Search issues across wards"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 mr-2 text-[#5F6368] hover:text-[#202124] rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Role Switcher Dropdown, XP Chip, Notifications, Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Role Switcher Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full border border-[#DADCE0] hover:bg-[#F1F3F4] text-xs font-medium text-[#202124] transition-colors"
              title="Switch portal view"
              aria-label="Switch portal view"
            >
              <span className="text-[#4285F4]">{activeRoleObj.icon}</span>
              <span className="hidden md:inline font-semibold">{activeRoleObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6368]" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-elevation-4 border border-[#DADCE0] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <span className="px-3 py-1 text-[10px] font-semibold text-[#5F6368] uppercase tracking-wider block">
                  Switch Active Portal
                </span>
                {roles.map((r) => (
                  <button
                    key={r.key}
                    onClick={(e) => {
                      createRipple(e);
                      setRole(r.key);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      role === r.key
                        ? 'bg-[#E8F0FE] text-[#1A73E8] font-bold'
                        : 'text-[#202124] hover:bg-[#F1F3F4]'
                    }`}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gamification XP Pill */}
          {role === 'citizen' && onOpenGamification && (
            <button
              onClick={(e) => {
                createRipple(e, 'rgba(251, 188, 5, 0.3)');
                onOpenGamification();
              }}
              className="hidden lg:flex items-center space-x-1.5 bg-[#FEF7E0] hover:bg-[#FEEFC3] text-[#78350F] border border-[#FBBC05]/40 px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors ripple-surface"
              title="Your Citizen XP points"
            >
              <Trophy className="w-3.5 h-3.5 fill-[#FBBC05] text-[#B06000]" />
              <span>{currentUser.points} XP</span>
            </button>
          )}

          {/* Notifications Icon Button */}
          {onOpenNotifications && (
            <button
              onClick={(e) => {
                createRipple(e);
                onOpenNotifications();
              }}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition-colors ripple-surface"
              aria-label={`Notifications (${unreadNotificationCount} unread)`}
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#EA4335] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Language Selector */}
          <button
            onClick={(e) => {
              createRipple(e);
              onOpenLanguage();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition-colors ripple-surface"
            title={`Language: ${currentLangObj?.nativeName || 'English'}`}
            aria-label={`Language: ${currentLangObj?.nativeName || 'English'}`}
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* User Profile Avatar with Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-1 p-1 rounded-full hover:ring-2 hover:ring-[#4285F4]/30 transition-all"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#4285F4] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-elevation-4 border border-[#DADCE0] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#DADCE0]">
                  <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#202124] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#5F6368] truncate">{session?.phone || currentUser.phone}</p>
                    <span className="inline-block mt-0.5 text-[9px] font-semibold bg-[#E8F0FE] text-[#1A73E8] px-1.5 py-0.2 rounded">
                      {role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="px-2 py-1.5 text-xs text-[#5F6368]">
                    <span className="block font-medium text-[#202124]">{currentUser.levelName}</span>
                    <span className="text-[11px]">{currentUser.points} XP • Ward: {currentUser.ward}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DADCE0]">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#EA4335] hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.logout || 'Log Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default RoleSwitcherBar;
