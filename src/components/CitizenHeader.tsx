import React from 'react';
import { Smartphone, LogOut } from 'lucide-react';
import { CitizenUser } from '../types';

interface CitizenHeaderProps {
  user: CitizenUser;
  onLogout: () => void;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-blue-600 text-white border-b border-blue-700 select-none shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center border border-blue-400">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-sans leading-tight">
              Resident 311 Portal
            </h1>
            <p className="text-xs text-blue-200 truncate max-w-[200px] sm:max-w-none">
              Welcome, {user.name} ({user.ward})
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 border border-blue-500 transition-colors text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
