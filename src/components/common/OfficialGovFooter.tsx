import React, { useState } from 'react';
import { CivicHeroLogo } from './CivicHeroLogo';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  PhoneCall,
  ArrowUp,
  Building2,
  Lock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { createRipple } from './MaterialRipple';

interface OfficialGovFooterProps {
  variant?: 'full' | 'compact';
}

export const OfficialGovFooter: React.FC<OfficialGovFooterProps> = ({ variant = 'full' }) => {
  const [copiedHelpline, setCopiedHelpline] = useState<string | null>(null);

  // Safely attempt to read context role if available
  let activeRole = 'citizen';
  try {
    const appCtx = useApp();
    if (appCtx && appCtx.role) {
      activeRole = appCtx.role;
    }
  } catch {
    // Unauthenticated / fallback
    activeRole = 'citizen';
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHelplineClick = (number: string, label: string) => {
    navigator.clipboard.writeText(number).catch(() => {});
    setCopiedHelpline(label);
    setTimeout(() => setCopiedHelpline(null), 2500);
  };

  const helplines = [
    { label: 'BBMP Control Room', number: '1533', dept: 'Civic Grievance' },
    { label: 'BESCOM Power', number: '1912', dept: 'Electricity' },
    { label: 'BWSSB Water Leak', number: '1916', dept: 'Water Board' },
    { label: 'National Emergency', number: '112', dept: 'Police / Fire' },
  ];

  const getPortalInfo = () => {
    if (activeRole === 'municipal') {
      return {
        title: 'UrbanFix Municipal Command Center',
        badge: 'BBMP ADMIN HQ',
        subtitle: 'Bruhat Bengaluru Mahanagara Palike • Central Control & SLA Telemetry',
      };
    }
    if (activeRole === 'worker') {
      return {
        title: 'UrbanFix Field Dispatch Terminal',
        badge: 'FIELD OPS VERIFIED',
        subtitle: 'Public Works & Solid Waste Management Operative Portal',
      };
    }
    return {
      title: 'UrbanFix Public Portal',
      badge: 'OFFICIAL GOVT VERIFIED',
      subtitle: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    };
  };

  const portalInfo = getPortalInfo();

  if (variant === 'compact') {
    return (
      <footer className="relative z-20 bg-[#0F172A] text-slate-300 border-t border-slate-800 shrink-0 font-sans select-none overflow-hidden">
        {/* Tricolor Government Top Strip */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <CivicHeroLogo variant="horizontal" size="sm" showTagline={true} taglineText="OFFICIAL CIVIC PORTAL" />
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34A853]" />
              Govt. of Karnataka & BBMP Initiative
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} UrbanFix • All Rights Reserved</span>
            <button
              onClick={scrollToTop}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative z-20 bg-gradient-to-b from-[#0F172A] via-[#0B132B] to-[#070D1B] text-slate-300 border-t-2 border-amber-500/30 shrink-0 font-sans select-none overflow-hidden shadow-elevation-8">
      {/* 1. Official Government Flag Tri-Color Header Bar with Subtle Gold Shimmer */}
      <div className="h-1.5 w-full flex relative overflow-hidden">
        <div className="flex-1 bg-gradient-to-r from-[#FF9933] to-[#FF8000]" />
        <div className="flex-1 bg-gradient-to-r from-white via-slate-100 to-white" />
        <div className="flex-1 bg-gradient-to-r from-[#138808] to-[#0D6006]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
      </div>

      {/* 2. Main Official Government Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 space-y-8">
        {/* Top Tier: Official Portal Badge & Live Telemetry Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-4">
            {/* Emblem Shield Badge */}
            <div className="relative group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-blue-500/10 to-emerald-500/20 p-0.5 border border-amber-500/40 shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-[10px] bg-[#0F172A] flex items-center justify-center text-amber-400">
                  <Building2 className="w-6 h-6 stroke-[1.75]" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#34A853] rounded-full border-2 border-[#0F172A] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                  {portalInfo.title}
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/40 tracking-wider">
                    {portalInfo.badge}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                <span>{portalInfo.subtitle}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> GIGW & ISO 27001 Certified
                </span>
              </p>
            </div>
          </div>

          {/* System Telemetry & Quick Back to Top */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
              <span className="text-slate-300 font-mono text-[11px]">Grid Status: 99.98% Online</span>
            </div>

            <button
              onClick={(e) => {
                createRipple(e, 'rgba(255, 255, 255, 0.2)');
                scrollToTop();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md transition-all duration-200 ripple-surface group cursor-pointer"
              title="Return to top of page"
            >
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Middle Tier: 24x7 Citizen Helpline Emergency Grid & Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {helplines.map((item) => (
            <div
              key={item.number}
              onClick={() => handleHelplineClick(item.number, item.label)}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-all duration-200 cursor-pointer group relative overflow-hidden"
              title="Click to copy helpline number"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  {item.dept}
                </span>
                <PhoneCall className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>

              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.label}
                </span>
                <span className="text-lg font-extrabold font-mono text-emerald-400">
                  {item.number}
                </span>
              </div>

              {copiedHelpline === item.label && (
                <div className="absolute inset-0 bg-emerald-900/90 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-emerald-200 transition-all animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-300" />
                  Copied {item.number}!
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Tier: Copyright, Digital India Partnership & Compliance Seals */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <CivicHeroLogo variant="horizontal" size="sm" showTagline={true} taglineText="CHANGE YOUR CITY." />
            <span className="text-slate-700">|</span>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} UrbanFix Governance Engine. Developed under Smart Cities Mission.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <Lock className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted
            </span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-slate-700">•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Governance</span>
            <span className="text-slate-700">•</span>
            <span className="text-amber-400/90 font-medium flex items-center gap-0.5">
              NIC Cloud Hosted <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default OfficialGovFooter;
