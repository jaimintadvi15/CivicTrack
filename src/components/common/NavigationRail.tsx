import React from 'react';
import { useApp } from '../../context/AppContext';
import { isListingOwner } from '../../utils/ownership';
import { auth } from '../../lib/firebase';
import { UserRole } from '../../types';
import { createRipple } from './MaterialRipple';
import {
  Home,
  FileText,
  Compass,
  Trophy,
  LayoutDashboard,
  HardHat,
  Plus,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
  Users,
} from 'lucide-react';
import { CivicHeroLogo } from './CivicHeroLogo';

export type NavSection = 'home' | 'my-reports' | 'community' | 'leaderboard';

interface NavigationRailProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenReport: () => void;
  onOpenLanguage: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  onOpenReport,
  onOpenLanguage,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { role, setRole, issues, currentUser, logout, t } = useApp();

  const myReportsCount = issues.filter((i) => isListingOwner(i, currentUser, auth?.currentUser?.uid)).length;
  const communityCount = issues.length;

  const citizenNavItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | string;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'my-reports',
      label: t.myReports || 'My Reports',
      icon: FileText,
      count: myReportsCount,
    },
    {
      id: 'community',
      label: t.communityFeed || 'Community Feed',
      icon: Compass,
      count: communityCount,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard & XP',
      icon: Trophy,
      count: `${currentUser.points} XP`,
    },
  ];

  const staffNavItems: {
    role: UserRole;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      role: 'citizen',
      label: 'Citizen Portal',
      icon: Users,
    },
    {
      role: 'municipal',
      label: 'Municipal HQ',
      icon: LayoutDashboard,
    },
    {
      role: 'worker',
      label: 'Field Ops',
      icon: HardHat,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Navigation Rail Container */}
      <aside
        className={`fixed top-14 sm:top-16 bottom-0 left-0 z-30 bg-white border-r border-[#DADCE0] transition-all duration-300 ease-in-out flex flex-col justify-between select-none ${
          isCollapsed ? 'md:w-18' : 'md:w-64'
        } w-64 ${
          isMobileOpen
            ? 'translate-x-0 shadow-elevation-8'
            : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Navigation rail"
      >
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 px-2 sm:px-3 space-y-4">
        {/* Mobile Header Branding */}
        <div className="md:hidden pb-3 mb-2 border-b border-[#DADCE0] px-2">
          <CivicHeroLogo variant="horizontal" size="sm" showTagline={true} taglineText="CHANGE YOUR CITY." />
        </div>

        {/* 1. Gmail-Style "+ Compose" / Google Drive "+ New" Pill Action Button */}
        <div className="mb-2">
          {role === 'citizen' && (
            <button
              onClick={(e) => {
                createRipple(e, 'rgba(66, 133, 244, 0.25)');
                onOpenReport();
              }}
              className={`flex items-center justify-center rounded-full bg-white hover:bg-[#F8F9FA] text-[#202124] border border-[#DADCE0] shadow-elevation-1 hover:shadow-elevation-3 transition-all duration-200 ripple-surface group ${
                isCollapsed ? 'w-12 h-12 mx-auto' : 'w-full px-4 py-3 space-x-3'
              }`}
              title="Report an Issue (+25 XP)"
              aria-label="Report an Issue"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#4285F4] text-white">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span className="text-sm font-medium text-[#202124] tracking-wide">
                    New Report
                  </span>
                  <span className="bg-[#FBBC05] text-[#202124] text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    +25 XP
                  </span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* 2. Primary Navigation Section (Citizen / General) */}
        {role === 'citizen' && (
          <nav className="space-y-1" aria-label="Citizen navigation">
            {!isCollapsed && (
              <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5F6368] block mb-1">
                Navigation
              </span>
            )}
            {citizenNavItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.15)');
                    onSelectSection(item.id);
                  }}
                  className={`w-full flex items-center rounded-full transition-colors text-sm font-medium ripple-surface relative group ${
                    isCollapsed
                      ? 'justify-center w-12 h-12 mx-auto'
                      : 'justify-between px-4 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                      : 'text-[#202124] hover:bg-[#F1F3F4]'
                  }`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-[#1A73E8]' : 'text-[#5F6368] group-hover:text-[#202124]'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && item.count !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.2 rounded-full font-medium ${
                        isActive
                          ? 'bg-[#1A73E8] text-white'
                          : 'bg-gray-100 text-[#5F6368]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* 3. Staff / Portals Section */}
        <div className="pt-2 border-t border-[#DADCE0]">
          {!isCollapsed && (
            <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5F6368] block mb-1">
              Portals
            </span>
          )}
          <nav className="space-y-1" aria-label="Portal roles">
            {staffNavItems.map((item) => {
              const isActive = role === item.role;
              const Icon = item.icon;
              return (
                <button
                  key={item.role}
                  onClick={(e) => {
                    createRipple(e, 'rgba(66, 133, 244, 0.15)');
                    setRole(item.role);
                  }}
                  className={`w-full flex items-center rounded-full transition-colors text-sm font-medium ripple-surface relative group ${
                    isCollapsed
                      ? 'justify-center w-12 h-12 mx-auto'
                      : 'justify-start space-x-3 px-4 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                      : 'text-[#202124] hover:bg-[#F1F3F4]'
                  }`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-[#1A73E8]' : 'text-[#5F6368] group-hover:text-[#202124]'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 4. Rail Bottom Footer: Language, Collapse Toggle, Logout */}
      <div className="p-2 border-t border-[#DADCE0] bg-[#F8F9FA] space-y-1">
        <button
          onClick={(e) => {
            createRipple(e);
            onOpenLanguage();
          }}
          className={`w-full flex items-center rounded-full text-xs font-medium text-[#5F6368] hover:bg-gray-200 transition-colors ripple-surface ${
            isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2'
          }`}
          title="Switch Language"
        >
          <Globe className="w-4 h-4 text-[#5F6368]" />
          {!isCollapsed && <span>Language</span>}
        </button>

        <button
          onClick={(e) => {
            createRipple(e, 'rgba(234, 67, 53, 0.2)');
            logout();
          }}
          className={`w-full flex items-center rounded-full text-xs font-medium text-[#EA4335] hover:bg-red-50 transition-colors ripple-surface ${
            isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2'
          }`}
          title="Log Out"
        >
          <LogOut className="w-4 h-4 text-[#EA4335]" />
          {!isCollapsed && <span>{t.logout || 'Log Out'}</span>}
        </button>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-gray-200 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-[#5F6368]">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  </>
);
};

export default NavigationRail;
