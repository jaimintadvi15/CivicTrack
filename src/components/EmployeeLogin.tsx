import React, { useState } from 'react';
import { Building2, Truck, ArrowRight, ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { EmployeeUser } from '../types';

interface EmployeeLoginProps {
  portalType: 'authority' | 'field_crew';
  onLogin: (user: EmployeeUser) => void;
  onBack: () => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ portalType, onLogin, onBack }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !password) return;
    setIsAuthenticating(true);
    
    // Simulate Authentication delay
    setTimeout(() => {
      onLogin({ id: employeeId, role: portalType });
      setIsAuthenticating(false);
    }, 1200);
  };

  const isAuthority = portalType === 'authority';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${isAuthority ? 'bg-slate-900' : 'bg-emerald-950'}`}>
      
      {/* Background Decor */}
      <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-3xl mix-blend-multiply pointer-events-none ${isAuthority ? 'bg-amber-900/30' : 'bg-emerald-600/20'}`} />
      
      <div className="w-full max-w-md z-10">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Selection
        </button>

        <div className={`rounded-3xl shadow-2xl border overflow-hidden ${isAuthority ? 'bg-slate-800 border-slate-700' : 'bg-emerald-900 border-emerald-800'}`}>
          <div className={`p-8 text-white flex flex-col items-center text-center ${isAuthority ? 'bg-slate-900' : 'bg-emerald-950'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isAuthority ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-400/20 text-emerald-400'}`}>
              {isAuthority ? <Building2 className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold font-sans">
              {isAuthority ? 'Authority Operations' : 'Field Crew Dispatch'}
            </h2>
            <p className={`text-sm mt-2 font-medium ${isAuthority ? 'text-slate-400' : 'text-emerald-300/70'}`}>
              Restricted Access. Authorized personnel only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${isAuthority ? 'text-slate-300' : 'text-emerald-100'}`}>
                Employee ID / Badge No.
              </label>
              <input 
                type="text" 
                required
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder={isAuthority ? "e.g. AUTH-4829" : "e.g. CREW-019"}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all font-mono font-medium ${
                  isAuthority 
                    ? 'bg-slate-900/50 border-slate-600 text-white focus:ring-amber-500 placeholder-slate-500' 
                    : 'bg-emerald-950/50 border-emerald-700 text-white focus:ring-emerald-500 placeholder-emerald-800'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${isAuthority ? 'text-slate-300' : 'text-emerald-100'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isAuthority ? 'text-slate-500' : 'text-emerald-700'}`} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all font-mono font-medium ${
                    isAuthority 
                      ? 'bg-slate-900/50 border-slate-600 text-white focus:ring-amber-500 placeholder-slate-500' 
                      : 'bg-emerald-950/50 border-emerald-700 text-white focus:ring-emerald-500 placeholder-emerald-800'
                  }`}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isAuthenticating}
              className={`w-full mt-4 py-4 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                isAuthority
                  ? 'bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600'
                  : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800'
              }`}
            >
              {isAuthenticating ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Secure Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className={`flex items-center justify-center gap-1.5 text-xs mt-6 font-medium ${isAuthority ? 'text-slate-500' : 'text-emerald-700'}`}>
              <ShieldCheck className="w-4 h-4" />
              CAD System Authentication
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
