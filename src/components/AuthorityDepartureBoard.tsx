import React from 'react';
import {
  Clock,
  CheckCircle2,
  Truck,
  Layers,
  Activity,
  AlertOctagon,
  Calendar
} from 'lucide-react';
import { CivicReport } from '../types';

interface DepartureBoardProps {
  reports: CivicReport[];
  selectedSeverityFilter: string;
  onSelectSeverity: (severity: string) => void;
}

export const AuthorityDepartureBoard: React.FC<DepartureBoardProps> = ({
  reports,
  selectedSeverityFilter,
  onSelectSeverity,
}) => {
  const criticalReports = reports.filter((r) => r.severity === 'CRITICAL' && r.status !== 'resolved');
  const highReports = reports.filter((r) => r.severity === 'HIGH' && r.status !== 'resolved');
  const mediumReports = reports.filter((r) => r.severity === 'MEDIUM' && r.status !== 'resolved');
  const lowReports = reports.filter((r) => r.severity === 'LOW' && r.status !== 'resolved');

  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  return (
    <section className="bg-slate-50/80 border-b border-slate-200 text-slate-900">
      {/* Operational Dispatch Status Summary */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
          
          {/* Main severity status bank */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            
            {/* CRITICAL - INSTITUTIONAL EMERGENCY RED */}
            <button
              id="filter-critical-card"
              onClick={() => onSelectSeverity(selectedSeverityFilter === 'CRITICAL' ? 'all' : 'CRITICAL')}
              className={`p-3 rounded-lg text-left transition-all border ${
                selectedSeverityFilter === 'CRITICAL'
                  ? 'bg-red-50 border-red-500 shadow-sm ring-2 ring-red-500/20'
                  : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <span className="font-mono text-xs font-bold text-red-700 tracking-wide">
                    CRITICAL
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-semibold border border-red-200">
                  SLA &le; 4H
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-red-700 tracking-tight">
                  {criticalReports.length}
                </span>
                <span className="text-[11px] font-mono text-red-800/80 font-medium">
                  {criticalReports.filter(r => r.slaDeadlineHours <= 4).length} Overdue SLA
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 truncate">
                Vehicular & pedestrian hazard
              </div>
            </button>

            {/* HIGH - RESTRAINED AMBER */}
            <button
              id="filter-high-card"
              onClick={() => onSelectSeverity(selectedSeverityFilter === 'HIGH' ? 'all' : 'HIGH')}
              className={`p-3 rounded-lg text-left transition-all border ${
                selectedSeverityFilter === 'HIGH'
                  ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-mono text-xs font-bold text-amber-800 tracking-wide">
                    HIGH
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  SLA 24H
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {highReports.length}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Target Today
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 truncate">
                Obstruction & safety risk
              </div>
            </button>

            {/* MEDIUM - CALM MUNICIPAL SLATE */}
            <button
              id="filter-medium-card"
              onClick={() => onSelectSeverity(selectedSeverityFilter === 'MEDIUM' ? 'all' : 'MEDIUM')}
              className={`p-3 rounded-lg text-left transition-all border ${
                selectedSeverityFilter === 'MEDIUM'
                  ? 'bg-slate-100 border-slate-600 shadow-sm ring-2 ring-slate-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-mono text-xs font-bold text-slate-700 tracking-wide">
                    MEDIUM
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  SLA 72H
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-800 tracking-tight">
                  {mediumReports.length}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Standard Queue
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 truncate">
                Maintenance repair cycle
              </div>
            </button>

            {/* LOW - QUIET GREY */}
            <button
              id="filter-low-card"
              onClick={() => onSelectSeverity(selectedSeverityFilter === 'LOW' ? 'all' : 'LOW')}
              className={`p-3 rounded-lg text-left transition-all border ${
                selectedSeverityFilter === 'LOW'
                  ? 'bg-slate-100 border-slate-600 shadow-sm ring-2 ring-slate-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="font-mono text-xs font-bold text-slate-600 tracking-wide">
                    LOW
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  SLA 7D
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-700 tracking-tight">
                  {lowReports.length}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Batch Queue
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 truncate">
                Non-structural cosmetic issue
              </div>
            </button>
          </div>

          {/* Operational telemetry bank - Authentic Municipal CAD look */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 lg:w-80 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-mono text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                DISPATCH TELEMETRY
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                96.4% SLA RATE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 my-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Field Crews</span>
                <span className="text-slate-800 font-bold font-mono flex items-center gap-1">
                  <Truck className="w-3 h-3 text-slate-500" />
                  9 / 12 Dispatched
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Mean Response</span>
                <span className="text-slate-800 font-bold font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  1.8 hrs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Active On-Site</span>
                <span className="text-blue-700 font-bold font-mono">
                  {inProgressCount} Work Orders
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Completed Week</span>
                <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {resolvedCount + 90}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-600" />
                Duplicate Clustering:
              </span>
              <span className="font-mono text-slate-700 font-semibold">
                41.2% Merged
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

