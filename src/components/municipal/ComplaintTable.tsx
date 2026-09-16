import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { getAssetUrl } from '../../utils/assetUrl';
import { createRipple } from '../common/MaterialRipple';
import {
  Search,
  Eye,
  ArrowUpDown,
  ThumbsUp,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface ComplaintTableProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onAssignWorker: (issue: CivicIssue) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  severityFilter: string;
  setSeverityFilter: (sev: string) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  onSelectIssue,
  onAssignWorker,
  categoryFilter,
  setCategoryFilter,
  severityFilter,
  setSeverityFilter,
}) => {
  const { issues, deleteReport, t } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'upvotes'>('date');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, wardFilter, categoryFilter, severityFilter, sortBy]);

  // Distinct wards from issues
  const wards = Array.from(new Set(issues.map((i) => i.location.ward)));

  // Filter & Search
  const filtered = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.citizenName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesWard = wardFilter === 'all' || issue.location.ward === wardFilter;

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus && matchesWard;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'upvotes') {
      return b.upvotes - a.upvotes;
    }
    if (sortBy === 'priority') {
      const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return weight[b.severity] - weight[a.severity];
    }
    return 0; // default initial order
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedIssues = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]';
      case 'High':
        return 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]';
      case 'Medium':
        return 'bg-[#FEF7E0] text-[#78350F] border-[#FBBC05]/40';
      default:
        return 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]';
      case 'In Progress':
        return 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]';
      case 'Acknowledged':
        return 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]';
      default:
        return 'bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]';
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 bg-white rounded-xl border border-[#DADCE0] shadow-elevation-1 overflow-hidden flex flex-col">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-[#DADCE0] space-y-3 bg-[#FAFAFA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5F6368] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, keyword, ward, or citizen..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#DADCE0] rounded-lg text-xs text-[#202124] placeholder:text-gray-400 focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#5F6368]" />
            <span className="text-xs text-[#5F6368] font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#202124] focus:outline-none focus:border-[#4285F4]"
            >
              <option value="date">Most Recent</option>
              <option value="priority">Highest Severity</option>
              <option value="upvotes">Most Citizen Upvotes</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#202124] focus:outline-none focus:border-[#4285F4]"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#202124] focus:outline-none focus:border-[#4285F4]"
          >
            <option value="all">All Categories</option>
            <option value="Garbage">Garbage & Waste</option>
            <option value="Pothole">Pothole</option>
            <option value="Water Leak">Water Leak</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Road Damage">Road Damage</option>
            <option value="Drain">Drain / Sewage</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#202124] focus:outline-none focus:border-[#4285F4]"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Ward */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#202124] focus:outline-none focus:border-[#4285F4]"
          >
            <option value="all">All Wards</option>
            {wards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-[#5F6368] ml-auto font-medium shrink-0">
            Showing {sorted.length} of {issues.length} complaints
          </span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Table Container */}
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full table-auto text-left text-xs text-[#5F6368] min-w-[720px]">
          <thead className="bg-[#FAFAFA] text-[#5F6368] font-medium uppercase text-[10px] tracking-wider border-b border-[#DADCE0]">
            <tr>
              <th className="py-3 px-4 min-w-[150px] whitespace-nowrap">Ticket & Photo</th>
              <th className="py-3 px-4 min-w-[180px]">Category / Issue</th>
              <th className="py-3 px-4 min-w-[140px]">Ward Location</th>
              <th className="py-3 px-4 min-w-[110px] whitespace-nowrap">Severity</th>
              <th className="py-3 px-4 min-w-[110px] whitespace-nowrap">Status</th>
              <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Assigned Worker</th>
              <th className="py-3 px-4 min-w-[90px] text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DADCE0]">
            {paginatedIssues.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#5F6368]">
                  No matching complaints found.
                </td>
              </tr>
            ) : (
              paginatedIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  onClick={() => onSelectIssue(issue)}
                >
                  {/* Photo & Ticket */}
                  <td className="py-3 px-4 min-w-[150px]">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={issue.photoUrl}
                        alt={issue.title}
                        className="w-10 h-10 rounded-lg object-cover border border-[#DADCE0] flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallback = getAssetUrl('issues/garbage.jpg');
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div>
                        <span className="font-mono font-medium text-[#202124] block">
                          #{issue.ticketNumber}
                        </span>
                        <span className="text-[10px] text-[#5F6368]">{issue.createdAt}</span>
                      </div>
                    </div>
                  </td>

                  {/* Title & Category */}
                  <td className="py-3 px-4 min-w-[180px]">
                    <div className="max-w-xs">
                      <span className="text-[10px] font-medium text-[#1A73E8] bg-[#E8F0FE] px-1.5 py-0.5 rounded border border-[#D2E3FC] uppercase tracking-wide">
                        {t.categories[issue.category]}
                      </span>
                      <h5 className="font-medium text-[#202124] mt-0.5 truncate">{issue.title}</h5>
                      <span className="text-[10px] text-[#5F6368] flex items-center gap-1 mt-0.5">
                        <ThumbsUp className="w-2.5 h-2.5 text-[#1A73E8]" /> {issue.upvotes} upvotes
                        {issue.mergedCount > 0 && ` • +${issue.mergedCount} merged`}
                      </span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 min-w-[140px]">
                    <div className="max-w-[180px]">
                      <span className="font-medium text-[#202124] text-[11px] block truncate">
                        {issue.location.ward}
                      </span>
                      <span className="text-[10px] text-[#5F6368] truncate block">
                        {issue.location.address}
                      </span>
                    </div>
                  </td>

                  {/* Severity (Guaranteed min-width and whitespace-nowrap, never truncates!) */}
                  <td className="py-3 px-4 min-w-[110px] whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap ${getSeverityBadge(
                        issue.severity
                      )}`}
                    >
                      {t.severities[issue.severity] || issue.severity}
                    </span>
                  </td>

                  {/* Status (Guaranteed min-width and whitespace-nowrap, never truncates!) */}
                  <td className="py-3 px-4 min-w-[110px] whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap ${getStatusBadge(
                        issue.status
                      )}`}
                    >
                      {t.statuses[issue.status] || issue.status}
                    </span>
                  </td>

                  {/* Assigned Officer */}
                  <td className="py-3 px-4 min-w-[140px] whitespace-nowrap">
                    {issue.assignedWorkerName ? (
                      <div className="flex items-center space-x-1.5 text-[#1A73E8] font-medium">
                        <HardHat className="w-3.5 h-3.5 text-[#4285F4] flex-shrink-0" />
                        <span className="truncate">{issue.assignedWorkerName}</span>
                      </div>
                    ) : (
                      <span className="text-[#5F6368] italic text-[11px]">Unassigned</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right min-w-[90px] whitespace-nowrap">
                    <div
                      className="flex items-center justify-end space-x-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          createRipple(e);
                          onSelectIssue(issue);
                        }}
                        className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-gray-100 rounded-lg transition-colors ripple-surface"
                        title="View issue timeline"
                        aria-label="View issue"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {issue.status !== 'Resolved' && !issue.assignedWorkerName && (
                        <button
                          onClick={(e) => {
                            createRipple(e);
                            onAssignWorker(issue);
                          }}
                          className="px-2.5 py-1 bg-[#4285F4] hover:bg-[#1A73E8] text-white rounded font-medium text-[11px] uppercase tracking-wider transition-all shadow-elevation-1 ripple-surface"
                          aria-label="Assign field worker"
                        >
                          Assign
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          createRipple(e);
                          if (window.confirm(`Delete report #${issue.ticketNumber}? This will permanently remove it from the municipal portal.`)) {
                            deleteReport(issue.id);
                          }
                        }}
                        className="p-1.5 text-[#5F6368] hover:text-[#EA4335] hover:bg-rose-50 rounded-lg transition-colors ripple-surface"
                        title="Delete report"
                        aria-label="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-[#DADCE0] bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5F6368]">
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, sorted.length)}-{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} complaints
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-[#DADCE0] bg-white text-xs font-medium text-[#202124] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 text-xs font-semibold text-[#202124]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-[#DADCE0] bg-white text-xs font-medium text-[#202124] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintTable;
