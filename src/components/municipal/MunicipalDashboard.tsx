import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { AnalyticsOverview } from './AnalyticsOverview';
import { ComplaintMap } from './ComplaintMap';
import { ComplaintTable } from './ComplaintTable';
import { AssignWorkerModal } from './AssignWorkerModal';
import { IssueTrackerModal } from '../citizen/IssueTrackerModal';
import { createRipple } from '../common/MaterialRipple';
import {
  LayoutDashboard,
  Map as MapIcon,
  Table as TableIcon,
} from 'lucide-react';

export const MunicipalDashboard: React.FC = () => {
  const { t } = useApp();
  const [viewMode, setViewMode] = useState<'map' | 'table' | 'split'>('split');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<CivicIssue | null>(null);

  return (
    <div className="w-full bg-[#F8F9FA] text-[#202124] pb-12 font-sans">
      {/* Command Center Subheader */}
      <div className="bg-white border-b border-[#DADCE0] sticky top-14 sm:top-16 z-20 shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-[#4285F4] text-white flex items-center justify-center font-bold shadow-elevation-1">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-medium text-[#202124] tracking-wide">
                  {t.municipalCommand}
                </h1>
                <span className="bg-[#E6F4EA] text-[#137333] text-[10px] font-medium px-2 py-0.5 rounded border border-[#CEEAD6] flex items-center gap-1 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] animate-pulse" /> Live Telemetry
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Bengaluru Municipal Corporation • Indiranagar & Koramangala Zones
              </p>
            </div>
          </div>

          {/* View Toggle (Split / Map / Table) */}
          <div className="flex items-center space-x-2">
            <div className="bg-gray-100 p-0.5 rounded border border-[#DADCE0] flex items-center">
              <button
                onClick={(e) => {
                  createRipple(e);
                  setViewMode('split');
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-all ripple-surface ${
                  viewMode === 'split'
                    ? 'bg-white text-[#1A73E8] shadow-elevation-1'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                Split View
              </button>
              <button
                onClick={(e) => {
                  createRipple(e);
                  setViewMode('map');
                }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-all ripple-surface ${
                  viewMode === 'map'
                    ? 'bg-white text-[#1A73E8] shadow-elevation-1'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map Only</span>
              </button>
              <button
                onClick={(e) => {
                  createRipple(e);
                  setViewMode('table');
                }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-all ripple-surface ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1A73E8] shadow-elevation-1'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Analytics Overview */}
        <AnalyticsOverview />

        {/* Dynamic Views */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-full min-w-0">
            {/* Left: Interactive Map (5 Cols) */}
            <div className="lg:col-span-5 min-w-0 max-w-full space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#202124] flex items-center space-x-1.5">
                  <MapIcon className="w-4 h-4 text-[#4285F4]" />
                  <span>{t.densityHeatmap}</span>
                </h3>
              </div>
              <ComplaintMap
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                onAssignWorker={(issue) => setAssigningIssue(issue)}
                selectedCategory={categoryFilter}
                selectedSeverity={severityFilter}
                heightClassName="h-[380px] sm:h-[420px] lg:h-[460px]"
              />
            </div>

            {/* Right: Filterable Complaints Table (7 Cols) */}
            <div className="lg:col-span-7 min-w-0 max-w-full space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#202124] flex items-center space-x-1.5">
                  <TableIcon className="w-4 h-4 text-[#4285F4]" />
                  <span>Complaints Queue & Dispatch</span>
                </h3>
              </div>
              <ComplaintTable
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                onAssignWorker={(issue) => setAssigningIssue(issue)}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
              />
            </div>
          </div>
        )}

        {viewMode === 'map' && (
          <div className="w-full max-w-full min-w-0 space-y-3">
            <h3 className="text-sm font-bold text-[#202124] flex items-center space-x-1.5">
              <MapIcon className="w-4 h-4 text-[#4285F4]" />
              <span>Full Screen Geographic Complaint Heatmap</span>
            </h3>
            <ComplaintMap
              onSelectIssue={(issue) => setSelectedIssue(issue)}
              onAssignWorker={(issue) => setAssigningIssue(issue)}
              selectedCategory={categoryFilter}
              selectedSeverity={severityFilter}
              heightClassName="h-[520px] sm:h-[600px]"
            />
          </div>
        )}

        {viewMode === 'table' && (
          <div className="w-full max-w-full min-w-0 space-y-3">
            <h3 className="text-sm font-bold text-[#202124] flex items-center space-x-1.5">
              <TableIcon className="w-4 h-4 text-[#4285F4]" />
              <span>Comprehensive Municipal Complaint Database</span>
            </h3>
            <ComplaintTable
              onSelectIssue={(issue) => setSelectedIssue(issue)}
              onAssignWorker={(issue) => setAssigningIssue(issue)}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
            />
          </div>
        )}
      </div>

      {/* Assign Worker Modal */}
      {assigningIssue && (
        <AssignWorkerModal
          issue={assigningIssue}
          onClose={() => setAssigningIssue(null)}
        />
      )}

      {/* Issue Tracker Detail Modal */}
      {selectedIssue && (
        <IssueTrackerModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
};
