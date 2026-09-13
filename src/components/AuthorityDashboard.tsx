import React, { useState } from 'react';
import {
  MapPin,
  Table,
  Layers,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { AuthorityTab, CivicReport, FilterState } from '../types';
import { AuthorityDepartureBoard } from './AuthorityDepartureBoard';
import { GisMapView } from './GisMapView';
import { QueueTableView } from './QueueTableView';

interface AuthorityDashboardProps {
  reports: CivicReport[];
  filter: FilterState;
  onFilterChange: (filter: Partial<FilterState>) => void;
  onSelectReport: (report: CivicReport) => void;
  selectedReportId?: string;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  reports,
  filter,
  onFilterChange,
  onSelectReport,
  selectedReportId,
}) => {
  const [activeTab, setActiveTab] = useState<AuthorityTab>('map');

  // Filter reports according to current filter state
  const filteredReports = reports.filter((r) => {
    if (filter.severity !== 'all' && r.severity !== filter.severity) return false;
    if (filter.category !== 'all' && r.category !== filter.category) return false;
    if (filter.ward !== 'all' && r.ward !== filter.ward) return false;
    if (filter.status !== 'all' && r.status !== filter.status) return false;
    if (filter.duplicatesOnly && r.duplicateCount === 0) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const match =
        r.ticketNumber.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-100 text-slate-900">
      
      {/* 1. OPERATIONAL DEPARTURE BOARD HEADER */}
      <AuthorityDepartureBoard
        reports={reports}
        selectedSeverityFilter={filter.severity}
        onSelectSeverity={(sev) => onFilterChange({ severity: sev })}
      />

      {/* 2. TAB CONTROLS & SUB-BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs ${
              activeTab === 'map'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>GIS Cadastral Map</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs ${
              activeTab === 'queue'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-slate-600" />
            <span>Incident Queue Table ({filteredReports.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span className="hidden sm:inline">DISPATCH DESK #04</span>
          <span className="text-slate-300">|</span>
          <span>
            MATCHED RECORDS: <strong className="text-slate-800">{filteredReports.length}</strong> / {reports.length}
          </span>
          {filter.severity !== 'all' && (
            <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 font-bold text-[11px]">
              FILTER: {filter.severity}
            </span>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEW */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'map' ? (
          <GisMapView
            reports={filteredReports}
            filter={filter}
            onFilterChange={onFilterChange}
            onSelectReport={onSelectReport}
            selectedReportId={selectedReportId}
          />
        ) : (
          <QueueTableView
            reports={filteredReports}
            filter={filter}
            onFilterChange={onFilterChange}
            onSelectReport={onSelectReport}
          />
        )}
      </div>

    </div>
  );
};
