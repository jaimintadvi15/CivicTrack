import React, { useState } from 'react';
import {
  ArrowUpDown,
  AlertTriangle,
  Clock,
  Layers,
  Truck,
  Eye,
  CheckCircle2,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { CivicReport, FilterState } from '../types';
import { CIVIC_CATEGORIES } from '../data/mockReports';

interface QueueTableViewProps {
  reports: CivicReport[];
  filter: FilterState;
  onFilterChange: (filter: Partial<FilterState>) => void;
  onSelectReport: (report: CivicReport) => void;
}

type SortField = 'ticketNumber' | 'severity' | 'submittedAt' | 'duplicateCount' | 'slaDeadlineHours';

export const QueueTableView: React.FC<QueueTableViewProps> = ({
  reports,
  filter,
  onFilterChange,
  onSelectReport,
}) => {
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    let comp = 0;
    if (sortField === 'severity') {
      const weight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      comp = (weight[a.severity] || 0) - (weight[b.severity] || 0);
    } else if (sortField === 'duplicateCount') {
      comp = a.duplicateCount - b.duplicateCount;
    } else if (sortField === 'submittedAt') {
      comp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    } else if (sortField === 'slaDeadlineHours') {
      comp = a.slaDeadlineHours - b.slaDeadlineHours;
    } else {
      comp = a.ticketNumber.localeCompare(b.ticketNumber);
    }
    return sortAsc ? comp : -comp;
  });

  const getAgeString = (dateIso: string) => {
    const diffMs = Date.now() - new Date(dateIso).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 1) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="bg-white flex flex-col flex-1 border border-slate-200 text-slate-800 shadow-xs">
      
      {/* Table control bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, street name, ward, keyword..."
              value={filter.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full bg-white border border-slate-300 text-slate-900 pl-8 pr-3 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-600">
          <span>
            DISPATCH ACTIVE: <strong className="text-slate-900">{sortedReports.length}</strong> WORK ORDERS
          </span>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => onFilterChange({ duplicatesOnly: !filter.duplicatesOnly })}
            className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
              filter.duplicatesOnly
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3 h-3 inline mr-1 text-amber-700" />
            Duplicate Clusters Only
          </button>
        </div>
      </div>

      {/* Dense Operational Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-mono uppercase text-[11px]">
              <th
                onClick={() => handleSort('ticketNumber')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Ticket ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('severity')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Severity</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Category</th>
              <th className="py-2.5 px-3 font-semibold">Street Location & Ward</th>
              <th
                onClick={() => handleSort('duplicateCount')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Duplicates</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('submittedAt')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Age</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Assigned Crew</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Status</th>
              <th
                onClick={() => handleSort('slaDeadlineHours')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>SLA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {sortedReports.map((report) => {
              const isCritical = report.severity === 'CRITICAL';
              const isHigh = report.severity === 'HIGH';
              const catConfig = CIVIC_CATEGORIES[report.category];

              return (
                <tr
                  key={report.id}
                  onClick={() => onSelectReport(report)}
                  className={`cursor-pointer transition-colors group ${
                    isCritical
                      ? 'bg-red-50/40 hover:bg-red-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Ticket Number */}
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 whitespace-nowrap group-hover:underline">
                    {report.ticketNumber}
                  </td>

                  {/* Severity Badge */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : report.severity === 'MEDIUM'
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1" />}
                      {report.severity}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                    <span className="text-slate-400 mr-1.5">{catConfig?.code}</span>
                    {catConfig?.label.split(' / ')[0]}
                  </td>

                  {/* Address & Ward */}
                  <td className="py-2.5 px-3 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">
                      {report.address}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {report.ward.split(' - ')[0]} &bull; {report.crossStreet || 'Right of way'}
                    </div>
                  </td>

                  {/* Duplicate count */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    {report.duplicateCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 font-mono text-amber-800 font-bold text-[11px]">
                        <Layers className="w-3 h-3 text-amber-600" />
                        +{report.duplicateCount}
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Age */}
                  <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                    {getAgeString(report.submittedAt)}
                  </td>

                  {/* Assigned Crew */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono">
                    {report.assignedCrew ? (
                      <span className="text-slate-800 flex items-center gap-1 font-medium">
                        <Truck className="w-3 h-3 text-slate-400" />
                        {report.assignedCrew.replace(' Crew', '').replace(' Rapid', '')}
                      </span>
                    ) : (
                      <span className="text-amber-700 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    <span
                      className={`capitalize px-2 py-0.5 rounded border font-medium ${
                        report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : report.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : report.status === 'assigned'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {report.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* SLA */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    {report.status === 'resolved' ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Met
                      </span>
                    ) : (
                      <span
                        className={
                          report.slaDeadlineHours <= 4
                            ? 'text-red-700 font-bold'
                            : 'text-slate-600'
                        }
                      >
                        {report.slaDeadlineHours}h Max
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReport(report);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-700 rounded text-[11px] font-mono transition-colors shadow-xs"
                    >
                      Inspect <ChevronRight className="w-3 h-3 inline -mr-0.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer / status */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
        <div>
          Showing {sortedReports.length} records &bull; Metro West CAD Dispatch Pipeline
        </div>
        <div>
          Sorted by {sortField.toUpperCase()} ({sortAsc ? 'ASC' : 'DESC'})
        </div>
      </div>
    </div>
  );
};
