import React from 'react';
import { Building2, Smartphone, Truck, ArrowRight } from 'lucide-react';
import { ActiveAppView } from '../types';

interface LandingPageProps {
  onViewChange: (view: ActiveAppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onViewChange }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100/50 blur-3xl mix-blend-multiply pointer-events-none" />

      <div className="z-10 w-full max-w-5xl px-6 py-12 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-16 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Government_Of_Gujarat_Seal_In_All_Languages.svg"
              alt="Gujarat government logo"
              className="w-24 h-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-sans mb-4">
              CivicTrack <span className="text-blue-600">Platform</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
              A unified municipal problem reporting and dispatch infrastructure. 
              Please select your portal to continue.
            </p>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          {/* Card 1: Resident */}
          <button 
            onClick={() => onViewChange('citizen')}
            className="group relative bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Smartphone className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-3 relative z-10">Resident 311 Portal</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 relative z-10 flex-1">
              Report public infrastructure issues like potholes, streetlights, or waste overflow directly to municipal authorities.
            </p>
            
            <div className="flex items-center text-blue-600 font-semibold text-sm relative z-10 mt-auto group-hover:gap-2 transition-all">
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Card 2: Authority */}
          <button 
            onClick={() => onViewChange('authority')}
            className="group relative bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <Building2 className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-3 relative z-10">Authority Dashboard</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 relative z-10 flex-1">
              Command center for municipal officials to triage, assign, and track reported civic issues across all city wards.
            </p>
            
            <div className="flex items-center text-amber-700 font-semibold text-sm relative z-10 mt-auto group-hover:gap-2 transition-all">
              <span>Enter Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Card 3: Field Crew */}
          <button 
            onClick={() => onViewChange('field_crew')}
            className="group relative bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Truck className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-3 relative z-10">Field Crew Dispatch</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 relative z-10 flex-1">
              Mobile-friendly interface for on-site municipal workers to receive tasks, update statuses, and submit proof of resolution.
            </p>
            
            <div className="flex items-center text-emerald-700 font-semibold text-sm relative z-10 mt-auto group-hover:gap-2 transition-all">
              <span>Enter Dispatch</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

        </div>
        
        {/* Simple Footer */}
        <div className="mt-16 text-center text-xs text-slate-400 font-mono">
          &copy; {new Date().getFullYear()} Government of Gujarat &bull; CivicTrack Municipal Systems
        </div>
      </div>
    </div>
  );
};
