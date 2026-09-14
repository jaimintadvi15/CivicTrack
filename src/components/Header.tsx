import React, { useState, useEffect } from 'react';
import {
  Building2,
  Smartphone,
  Truck,
  Clock,
  Maximize2,
  Minimize2,
  ShieldCheck
} from 'lucide-react';
import { ActiveAppView } from '../types';

interface HeaderProps {
  currentView: ActiveAppView;
  onViewChange: (view: ActiveAppView) => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  criticalCount: number;
  totalActive: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  isMobileFrame,
  onToggleMobileFrame,
  criticalCount,
  totalActive,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' EST'
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 select-none shadow-sm">
      {/* Top institutional jurisdiction bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-medium tracking-normal text-slate-200">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white">City of Metro West</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-normal">Department of Public Works & 311 Operations</span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
            Dispatch CAD v4.8
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-200 font-medium">{timeString || '12:00:00 EST'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-700">
            <span className="text-slate-400">GIS Engine:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Online
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-700">
            <span className="text-slate-400">Open Work Orders:</span>
            <span className="text-white font-bold">{totalActive}</span>
            {criticalCount > 0 && (
              <span className="bg-red-900/80 text-red-200 px-1.5 py-0.5 rounded text-[11px] font-bold border border-red-700">
                {criticalCount} Critical SLA
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation / view switcher */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Government_Of_Gujarat_Seal_In_All_Languages.svg"
              alt="Gujarat government logo"
              className="w-16 h-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                CivicTrack
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-semibold border border-slate-700">
                Unified Municipal Platform
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Citizen Problem Reporting & Authority Dispatch Infrastructure
            </p>
          </div>
        </div>

        {/* View mode toggle - core dual audience switch */}
        <div className="flex items-center gap-2">
          <nav className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1" aria-label="Portal Navigation">
            <button
              id="view-authority-btn"
              onClick={() => onViewChange('authority')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'authority'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Authority Dashboard</span>
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-800 text-white text-[10px] font-mono font-bold">
                  {criticalCount}
                </span>
              )}
            </button>

            <button
              id="view-citizen-btn"
              onClick={() => onViewChange('citizen')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'citizen'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Resident 311 Portal</span>
            </button>

            <button
              id="view-fieldcrew-btn"
              onClick={() => onViewChange('field_crew')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'field_crew'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Field Crew Dispatch</span>
            </button>
          </nav>

          {/* Citizen viewport frame simulator toggle */}
          {currentView === 'citizen' && (
            <button
              id="toggle-mobile-frame-btn"
              onClick={onToggleMobileFrame}
              title={isMobileFrame ? 'Switch to responsive full-width view' : 'Simulate mobile handset view (390px)'}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {isMobileFrame ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Full Screen</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Handset Frame</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

