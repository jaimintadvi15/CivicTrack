import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Clock, LogOut } from 'lucide-react';

interface AuthorityHeaderProps {
  onLogout: () => void;
  criticalCount: number;
  totalActive: number;
}

export const AuthorityHeader: React.FC<AuthorityHeaderProps> = ({ onLogout, criticalCount, totalActive }) => {
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
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-medium tracking-normal text-slate-200">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white">City of Metro West</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-normal">Department of Public Works</span>
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono text-slate-300">
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
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 pl-3 border-l border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-sans">
              Authority Dashboard
            </h1>
            <p className="text-xs text-slate-300">Command Center & Triage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 pl-3">
            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Active Tickets:</span>
            <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{totalActive}</span>
            {criticalCount > 0 && (
              <span className="bg-red-900/80 text-red-200 px-2 py-0.5 rounded text-[11px] font-bold border border-red-700 ml-2 animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
