import React, { useState, useEffect } from 'react';
import { Truck, MapPin, SignalHigh, LogOut } from 'lucide-react';

interface FieldCrewHeaderProps {
  onLogout: () => void;
}

export const FieldCrewHeader: React.FC<FieldCrewHeaderProps> = ({ onLogout }) => {
  const [timeString, setTimeString] = useState<string>('');
  
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-emerald-900 text-emerald-50 border-b border-emerald-950 select-none shadow-md">
      <div className="px-4 py-2 flex flex-wrap items-center justify-between text-xs border-b border-emerald-800/50">
        <div className="flex items-center gap-2">
          <SignalHigh className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-emerald-200">GPS Locked (3m)</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-emerald-200">{timeString}</span>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1 pl-3 border-l border-emerald-800 text-emerald-300 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-800 rounded-lg flex items-center justify-center border border-emerald-700">
            <Truck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-sans">
              Field Crew Dispatch
            </h1>
            <p className="text-xs text-emerald-300 font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Unit Active
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
