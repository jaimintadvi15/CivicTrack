import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { createRipple } from './MaterialRipple';
import {
  LayoutDashboard,
  HardHat,
  Users,
  Camera,
  Trophy,
  Globe,
  LogOut,
  X,
  MapPin,
} from 'lucide-react';
import { CivicHeroLogo } from './CivicHeroLogo';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport?: () => void;
  onOpenGamification?: () => void;
  onOpenLanguage?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenReport,
  onOpenGamification,
  onOpenLanguage,
}) => {
  const { role, setRole, currentUser, logout, t } = useApp();

  const handleRoleSelect = (r: UserRole, e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e, 'rgba(66, 133, 244, 0.2)');
    setRole(r);
    onClose();
  };

  const navItems: { role: UserRole; label: string; icon: React.ReactNode; badge: string }[] = [
    {
      role: 'citizen',
      label: t.citizenRole || 'Citizen Portal',
      icon: <Users className="w-5 h-5" />,
      badge: 'Public',
    },
    {
      role: 'municipal',
      label: t.municipalRole || 'Municipal HQ',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: 'Admin',
    },
    {
      role: 'worker',
      label: t.workerRole || 'Field Ops',
      icon: <HardHat className="w-5 h-5" />,
      badge: 'Operations',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-white shadow-elevation-8 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main Navigation Drawer"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Drawer Header (Google Blue #4285F4 with signature accent strip) */}
          <div className="bg-[#4285F4] text-white relative">
            <div className="google-accent-bar" />
            <div className="p-5">
              <button
                onClick={onClose}
                className="absolute top-5 right-4 text-white/80 hover:text-white p-1 rounded transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <CivicHeroLogo
                  variant="horizontal"
                  size="sm"
                  inverted={true}
                  showTagline={true}
                  taglineText="CHANGE YOUR CITY."
                />
              </div>

              {/* Active User Card in Header */}
              <div className="pt-2 border-t border-white/20 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white text-[#4285F4] flex items-center justify-center font-bold text-sm shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-white/80 flex items-center mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-[#FBBC05] mr-1 shrink-0" />
                    {currentUser.ward}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="py-3 px-2 space-y-1">
            <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5F6368] block mb-1">
              Portals & Views
            </span>

            {navItems.map((item) => {
              const isActive = role === item.role;
              return (
                <button
                  key={item.role}
                  onClick={(e) => handleRoleSelect(item.role, e)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded text-sm font-medium transition-colors ripple-surface ${
                    isActive
                      ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                      : 'text-[#202124] hover:bg-[#F1F3F4]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isActive ? 'bg-[#4285F4] text-white' : 'bg-[#F1F3F4] text-[#5F6368]'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}

            <div className="my-2 border-t border-[#DADCE0]" />

            <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5F6368] block mb-1">
              Actions & Settings
            </span>

            {onOpenReport && (
              <button
                onClick={(e) => {
                  createRipple(e, 'rgba(66, 133, 244, 0.2)');
                  onOpenReport();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-3 rounded text-sm font-medium text-[#202124] hover:bg-[#F1F3F4] transition-colors ripple-surface"
              >
                <Camera className="w-5 h-5 text-[#4285F4]" />
                <span>{t.reportIssue || 'Report an Issue'}</span>
              </button>
            )}

            {onOpenGamification && (
              <button
                onClick={(e) => {
                  createRipple(e, 'rgba(251, 188, 5, 0.2)');
                  onOpenGamification();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded text-sm font-medium text-[#202124] hover:bg-[#F1F3F4] transition-colors ripple-surface"
              >
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-[#FBBC05]" />
                  <span>Citizen Badges & XP</span>
                </div>
                <span className="text-xs font-bold text-[#B06000] bg-[#FEF7E0] border border-[#FBBC05]/40 px-2 py-0.5 rounded">
                  {currentUser.points} XP
                </span>
              </button>
            )}

            {onOpenLanguage && (
              <button
                onClick={(e) => {
                  createRipple(e, 'rgba(0, 0, 0, 0.1)');
                  onOpenLanguage();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-3 rounded text-sm font-medium text-[#202124] hover:bg-[#F1F3F4] transition-colors ripple-surface"
              >
                <Globe className="w-5 h-5 text-[#5F6368]" />
                <span>Language / भाषा</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Footer: Logout */}
        <div className="p-3 border-t border-[#DADCE0]">
          <button
            onClick={(e) => {
              createRipple(e, 'rgba(234, 67, 53, 0.2)');
              logout();
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-3.5 py-3 rounded text-sm font-medium text-[#EA4335] hover:bg-red-50 transition-colors ripple-surface"
          >
            <LogOut className="w-5 h-5 text-[#EA4335]" />
            <span>{t.logout || 'Log Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default NavigationDrawer;
