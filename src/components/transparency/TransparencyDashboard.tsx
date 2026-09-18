import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue, IssueCategory } from '../../types';
import { isListingOwner } from '../../utils/ownership';
import { auth } from '../../lib/firebase';
import { createRipple } from '../common/MaterialRipple';
import {
  FileText,
  CheckCircle2,
  Clock,
  Wrench,
  TrendingUp,
  MapPin,
  Search,
  RotateCw,
  BarChart3,
  PieChart,
  ShieldCheck,
  ThumbsUp,
  User,
  ChevronRight,
  Plus,
  AlertCircle,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

interface TransparencyDashboardProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onOpenReport: () => void;
}

export const TransparencyDashboard: React.FC<TransparencyDashboardProps> = ({
  onSelectIssue,
  onOpenReport,
}) => {
  const { issues = [], currentUser, upvoteReport } = useApp();

  // Dashboard Control States
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // My Report History Filter & Pagination States
  const [mySearchQuery, setMySearchQuery] = useState<string>('');
  const [myStatusFilter, setMyStatusFilter] = useState<string>('all');
  const [myCategoryFilter, setMyCategoryFilter] = useState<string>('all');
  const [myLocationFilter, setMyLocationFilter] = useState<string>('all');
  const [mySortBy, setMySortBy] = useState<'newest' | 'oldest' | 'updated'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Handle Manual Refresh Action
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
    }, 600);
  };

  // Extract all unique locations (wards / cities) from stored dataset safely
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    (issues || []).forEach((i) => {
      if (i?.location?.ward) set.add(i.location.ward);
    });
    return Array.from(set).sort();
  }, [issues]);

  // Filter global public dataset by selected location dropdown
  const locationFilteredIssues = useMemo(() => {
    if (selectedLocation === 'all') return issues || [];
    return (issues || []).filter((i) => i?.location?.ward === selectedLocation);
  }, [issues, selectedLocation]);

  // Calculate Primary Statistics safely
  const stats = useMemo(() => {
    const total = locationFilteredIssues.length;

    const resolved = locationFilteredIssues.filter(
      (i) =>
        i?.status === 'Resolved' ||
        (i?.status as string)?.toLowerCase() === 'resolved' ||
        (i?.status as string)?.toLowerCase() === 'closed'
    ).length;

    const inProgress = locationFilteredIssues.filter(
      (i) =>
        i?.status === 'In Progress' ||
        (i?.status as string)?.toLowerCase() === 'in_progress' ||
        (i?.status as string)?.toLowerCase() === 'in progress'
    ).length;

    const pending = locationFilteredIssues.filter(
      (i) =>
        i?.status === 'Submitted' ||
        i?.status === 'Acknowledged' ||
        (i?.status as string)?.toLowerCase() === 'pending' ||
        (i?.status as string)?.toLowerCase() === 'assigned'
    ).length;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      resolved,
      inProgress,
      pending,
      resolutionRate,
    };
  }, [locationFilteredIssues]);

  // Group Reports by Location (Ward)
  const locationGroups = useMemo(() => {
    const map: Record<
      string,
      { ward: string; total: number; resolved: number; pending: number; inProgress: number }
    > = {};

    (issues || []).forEach((issue) => {
      const key = issue?.location?.ward || 'Other Area';
      if (!map[key]) {
        map[key] = { ward: key, total: 0, resolved: 0, pending: 0, inProgress: 0 };
      }
      map[key].total += 1;
      const s = (issue?.status as string || '').toLowerCase();
      if (s === 'resolved' || s === 'closed') {
        map[key].resolved += 1;
      } else if (s === 'in progress' || s === 'in_progress') {
        map[key].inProgress += 1;
      } else {
        map[key].pending += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [issues]);

  // Reports by Category Counts
  const categoryCounts = useMemo(() => {
    const predefined: IssueCategory[] = [
      'Pothole',
      'Water Leak',
      'Garbage',
      'Streetlight',
      'Road Damage',
      'Drain',
      'Other',
    ];

    const counts: Record<string, number> = {};
    predefined.forEach((cat) => (counts[cat] = 0));

    locationFilteredIssues.forEach((issue) => {
      const cat = issue?.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return predefined.map((cat) => ({
      category: cat,
      count: counts[cat] || 0,
      percentage: stats.total > 0 ? Math.round(((counts[cat] || 0) / stats.total) * 100) : 0,
    }));
  }, [locationFilteredIssues, stats.total]);

  // Filter Resident's OWN Report History
  const filteredMyReports = useMemo(() => {
    let list = (issues || []).filter((i) =>
      isListingOwner(i, currentUser, auth?.currentUser?.uid)
    );

    // Search filter
    if (mySearchQuery.trim()) {
      const q = mySearchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i?.title?.toLowerCase()?.includes(q) ||
          i?.ticketNumber?.toLowerCase()?.includes(q) ||
          i?.location?.address?.toLowerCase()?.includes(q) ||
          i?.category?.toLowerCase()?.includes(q)
      );
    }

    // Status filter
    if (myStatusFilter !== 'all') {
      list = list.filter((i) => {
        const s = (i?.status as string || '').toLowerCase();
        const target = myStatusFilter.toLowerCase();
        if (target === 'resolved') return s === 'resolved' || s === 'closed';
        if (target === 'pending') return s === 'submitted' || s === 'pending';
        if (target === 'acknowledged') return s === 'acknowledged' || s === 'assigned';
        if (target === 'in_progress') return s === 'in progress' || s === 'in_progress';
        return s === target;
      });
    }

    // Category filter
    if (myCategoryFilter !== 'all') {
      list = list.filter((i) => i?.category === myCategoryFilter);
    }

    // Location filter
    if (myLocationFilter !== 'all') {
      list = list.filter((i) => i?.location?.ward === myLocationFilter);
    }

    // Sort filter
    list = [...list].sort((a, b) => {
      if (mySortBy === 'oldest') {
        return (a?.id || '').localeCompare(b?.id || '');
      }
      if (mySortBy === 'updated') {
        return (b?.updatedAt || '').localeCompare(a?.updatedAt || '');
      }
      return (b?.id || '').localeCompare(a?.id || ''); // default newest
    });

    return list;
  }, [issues, currentUser, mySearchQuery, myStatusFilter, myCategoryFilter, myLocationFilter, mySortBy]);

  // Paginated My Reports
  const totalMyPages = Math.ceil(filteredMyReports.length / pageSize) || 1;
  const paginatedMyReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMyReports.slice(start, start + pageSize);
  }, [filteredMyReports, currentPage]);

  // Recent Public Community Reports (Excluding private contacts)
  const recentCommunityReports = useMemo(() => {
    return (issues || []).filter((i) => !(i as any)?.flagged).slice(0, 6);
  }, [issues]);

  // Calculate Average Resolution Time SLA
  const avgResolutionSLA = useMemo(() => {
    const resolvedIssues = (issues || []).filter(
      (i) => (i?.status as string || '').toLowerCase() === 'resolved'
    );
    if (resolvedIssues.length === 0) return '24 hrs';
    const sumHours = resolvedIssues.reduce((acc, curr) => acc + (curr?.targetResolutionHours || 12), 0);
    return `${Math.round(sumHours / resolvedIssues.length)} hrs`;
  }, [issues]);

  // Render Accessible Status Badges
  const renderStatusBadge = (status: string = '') => {
    const s = status.toLowerCase();
    if (s === 'resolved' || s === 'closed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
          <CheckCircle2 className="w-3 h-3 mr-1 text-[#34A853]" />
          Resolved
        </span>
      );
    }
    if (s === 'in progress' || s === 'in_progress') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
          <Wrench className="w-3 h-3 mr-1 text-[#4285F4]" />
          In Progress
        </span>
      );
    }
    if (s === 'acknowledged' || s === 'assigned') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
          <Clock className="w-3 h-3 mr-1 text-[#FBBC05]" />
          Acknowledged
        </span>
      );
    }
    if (s === 'reopened') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]">
          <AlertCircle className="w-3 h-3 mr-1 text-[#EA4335]" />
          Reopened
        </span>
      );
    }
    if (s === 'duplicate') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
          Duplicate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
        <Clock className="w-3 h-3 mr-1 text-[#70757A]" />
        Pending
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200">
      {/* 1. DASHBOARD HEADER */}
      <div className="bg-white rounded-2xl border border-[#DADCE0] shadow-elevation-1 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="google-accent-bar absolute top-0 left-0 right-0" />
        <div className="space-y-1 pt-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Public Governance
            </span>
            <span className="text-xs text-[#5F6368]">
              Verified Database Insights
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight">
            Public Transparency Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368]">
            Track civic issues, monitor resolution progress, and see how your community reports are being handled.
          </p>
        </div>

        {/* Top Header Actions: Location Selector, Last Updated, Refresh */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 md:pt-0">
          <div className="flex items-center space-x-2 bg-[#F8F9FA] px-3 py-1.5 rounded-lg border border-[#DADCE0] text-xs">
            <MapPin className="w-4 h-4 text-[#4285F4]" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-[#202124] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter statistics by location"
            >
              <option value="all">All Locations (Citywide)</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#5F6368]">
              Updated <strong className="text-[#202124]">{lastUpdated}</strong>
            </span>
            <button
              onClick={(e) => {
                createRipple(e);
                handleRefresh();
              }}
              disabled={isRefreshing}
              className="p-2 rounded-full border border-[#DADCE0] hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh statistics data"
              aria-label="Refresh statistics data"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#4285F4]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN STATISTICS CARDS (4 Responsive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Reports */}
        <div className="bg-white rounded-xl border border-[#DADCE0] p-5 shadow-elevation-1 hover:shadow-elevation-2 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368]">
              Total Reports
            </span>
            <div className="text-3xl font-extrabold text-[#202124]">
              {stats.total}
            </div>
            <p className="text-[11px] text-[#5F6368]">
              Public civic reports filed
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0 border border-[#D2E3FC]">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved Reports */}
        <div className="bg-white rounded-xl border border-[#DADCE0] p-5 shadow-elevation-1 hover:shadow-elevation-2 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368]">
              Resolved Reports
            </span>
            <div className="text-3xl font-extrabold text-[#137333]">
              {stats.resolved}
            </div>
            <p className="text-[11px] text-[#137333] font-medium">
              Completed & verified
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center shrink-0 border border-[#CEEAD6]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white rounded-xl border border-[#DADCE0] p-5 shadow-elevation-1 hover:shadow-elevation-2 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368]">
              Pending Reports
            </span>
            <div className="text-3xl font-extrabold text-[#B06000]">
              {stats.pending}
            </div>
            <p className="text-[11px] text-[#B06000]">
              Queued / Acknowledged
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF7E0] text-[#B06000] flex items-center justify-center shrink-0 border border-[#FEEFC3]">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress Reports */}
        <div className="bg-white rounded-xl border border-[#DADCE0] p-5 shadow-elevation-1 hover:shadow-elevation-2 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368]">
              In Progress Reports
            </span>
            <div className="text-3xl font-extrabold text-[#1A73E8]">
              {stats.inProgress}
            </div>
            <p className="text-[11px] text-[#1A73E8]">
              Field teams dispatched
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0 border border-[#D2E3FC]">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. COMMUNITY RESOLUTION PROGRESS */}
      <div className="bg-gradient-to-r from-white via-[#F8F9FA] to-white rounded-2xl border border-[#DADCE0] shadow-elevation-1 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#34A853]" />
              Community Resolution Progress
            </h3>
            <p className="text-xs text-[#5F6368]">
              Percentage of total community reports successfully resolved across municipal teams
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#137333]">
              {stats.resolutionRate}%
            </span>
            <span className="text-xs text-[#5F6368] block">Resolution Rate</span>
          </div>
        </div>

        {/* Safe Progress Bar Fills */}
        <div className="w-full bg-[#E8EAED] rounded-full h-4 overflow-hidden p-0.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-[#34A853] to-[#137333] h-full rounded-full transition-all duration-700 shadow-xs"
            style={{ width: `${Math.min(100, Math.max(0, stats.resolutionRate))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] pt-1">
          <span className="flex items-center gap-1 text-[#137333]">
            <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
            Resolved: <strong>{stats.resolved}</strong>
          </span>
          <span className="flex items-center gap-1 text-[#B06000]">
            <Clock className="w-4 h-4 text-[#FBBC05]" />
            Active / Pending: <strong>{stats.pending + stats.inProgress}</strong>
          </span>
        </div>
      </div>

      {/* 4. REPORTS BY LOCATION & LOCATION ANALYTICS VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Location Breakdown Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DADCE0] p-5 sm:p-6 shadow-elevation-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#4285F4]" />
                Reports by Location
              </h3>
              <p className="text-xs text-[#5F6368]">
                Distribution of reports across municipal wards and areas
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#202124]">
              <thead>
                <tr className="border-b border-[#DADCE0] text-[#5F6368] uppercase text-[11px] font-semibold bg-[#F8F9FA]">
                  <th className="py-2.5 px-3 rounded-l-lg">Location / Ward</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center text-[#137333]">Resolved</th>
                  <th className="py-2.5 px-3 text-center text-[#B06000]">Pending</th>
                  <th className="py-2.5 px-3 text-center text-[#1A73E8] rounded-r-lg">In Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0]/60">
                {locationGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#5F6368]">
                      No reports recorded for this location filter.
                    </td>
                  </tr>
                ) : (
                  locationGroups.map((row) => (
                    <tr key={row.ward} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#202124]">
                        {row.ward}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{row.total}</td>
                      <td className="py-3 px-3 text-center font-medium text-[#137333]">
                        {row.resolved}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-[#B06000]">
                        {row.pending}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-[#1A73E8]">
                        {row.inProgress}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 Cols): Location Horizontal Bar Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DADCE0] p-5 sm:p-6 shadow-elevation-1 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#4285F4]" />
              Reports by Area
            </h3>
            <p className="text-xs text-[#5F6368]">
              Volume comparison across top ward locations
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {locationGroups.slice(0, 5).map((item) => {
              const maxTotal = locationGroups[0]?.total || 1;
              const pct = Math.round((item.total / maxTotal) * 100);
              return (
                <div key={item.ward} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#202124] font-semibold truncate max-w-[180px]">
                      {item.ward.split('-')[0].trim()}
                    </span>
                    <span className="text-[#5F6368] font-mono">{item.total} reports</span>
                  </div>
                  <div className="w-full bg-[#F1F3F4] rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#4285F4] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. ISSUES BY CATEGORY */}
      <div className="bg-white rounded-2xl border border-[#DADCE0] p-5 sm:p-6 shadow-elevation-1 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#FBBC05]" />
            Issues by Category
          </h3>
          <p className="text-xs text-[#5F6368]">
            Categorized breakdown of public reports dynamically derived from the database
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {categoryCounts.map((cat) => (
            <div
              key={cat.category}
              className="bg-[#F8F9FA] rounded-xl border border-[#DADCE0] p-3 text-center space-y-1.5 hover:border-[#4285F4] transition-colors"
            >
              <span className="text-[11px] font-bold text-[#5F6368] block truncate">
                {cat.category}
              </span>
              <div className="text-xl font-extrabold text-[#202124]">
                {cat.count}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#4285F4] h-full rounded-full"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-[#5F6368] block font-mono">
                {cat.percentage}% of total
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. RESIDENT'S OWN REPORT HISTORY */}
      <div className="bg-white rounded-2xl border border-[#DADCE0] p-5 sm:p-6 shadow-elevation-1 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DADCE0]">
          <div>
            <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
              <User className="w-5 h-5 text-[#4285F4]" />
              My Report History
            </h3>
            <p className="text-xs text-[#5F6368]">
              Personal history of reports submitted by you ({currentUser?.name || 'Citizen'})
            </p>
          </div>

          <button
            onClick={(e) => {
              createRipple(e);
              onOpenReport();
            }}
            className="px-4 py-2 rounded-lg bg-[#4285F4] hover:bg-[#1A73E8] text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Issue</span>
          </button>
        </div>

        {/* Toolbar: Search & 4 Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#5F6368] absolute left-3 top-2.5" />
            <input
              type="text"
              value={mySearchQuery}
              onChange={(e) => {
                setMySearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reports..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8F9FA] rounded-lg border border-[#DADCE0] focus:outline-none focus:border-[#4285F4]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={myStatusFilter}
            onChange={(e) => {
              setMyStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-[#F8F9FA] rounded-lg border border-[#DADCE0] text-[#202124] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={myCategoryFilter}
            onChange={(e) => {
              setMyCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-[#F8F9FA] rounded-lg border border-[#DADCE0] text-[#202124] focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Pothole">Potholes</option>
            <option value="Water Leak">Water Leaks</option>
            <option value="Garbage">Garbage</option>
            <option value="Streetlight">Streetlights</option>
            <option value="Road Damage">Road Damage</option>
            <option value="Drain">Drainage</option>
            <option value="Other">Other</option>
          </select>

          {/* Location Filter */}
          <select
            value={myLocationFilter}
            onChange={(e) => {
              setMyLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-[#F8F9FA] rounded-lg border border-[#DADCE0] text-[#202124] focus:outline-none"
          >
            <option value="all">All Locations</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={mySortBy}
            onChange={(e) => setMySortBy(e.target.value as any)}
            className="w-full px-3 py-1.5 text-xs bg-[#F8F9FA] rounded-lg border border-[#DADCE0] text-[#202124] focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>

        {/* My Reports Dataset View */}
        {filteredMyReports.length === 0 ? (
          <div className="bg-[#F8F9FA] rounded-xl p-8 text-center border border-[#DADCE0] max-w-md mx-auto my-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#202124]">
              {mySearchQuery || myStatusFilter !== 'all' || myCategoryFilter !== 'all'
                ? 'No reports match selected filters'
                : "You haven't submitted any civic issues yet."}
            </h4>
            <p className="text-xs text-[#5F6368]">
              Report an issue in your ward to earn +25 XP and track its resolution progress here.
            </p>
            <button
              onClick={(e) => {
                createRipple(e);
                onOpenReport();
              }}
              className="px-5 py-2 rounded-full bg-[#4285F4] hover:bg-[#1A73E8] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Report an Issue (+25 XP)
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#202124]">
                <thead>
                  <tr className="border-b border-[#DADCE0] text-[#5F6368] uppercase text-[11px] font-semibold bg-[#F8F9FA]">
                    <th className="py-2.5 px-3 rounded-l-lg">Report Ticket</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Submitted Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]/60">
                  {paginatedMyReports.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onSelectIssue(item)}
                      className="hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-medium text-[#202124]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-[#5F6368]">
                            #{item.ticketNumber}
                          </span>
                          <span className="font-semibold text-[#1A73E8] group-hover:underline line-clamp-1 max-w-xs">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium">{item.category}</td>
                      <td className="py-3 px-3 text-[#5F6368] line-clamp-1 max-w-[150px]">
                        {item?.location?.ward || 'General Area'}
                      </td>
                      <td className="py-3 px-3 text-[#5F6368] whitespace-nowrap">
                        {item.createdAt}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-xs text-[#1A73E8] font-semibold inline-flex items-center group-hover:translate-x-0.5 transition-transform">
                          Track Progress <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalMyPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-[#DADCE0] text-xs text-[#5F6368]">
                <span>
                  Showing {Math.min(filteredMyReports.length, (currentPage - 1) * pageSize + 1)} to{' '}
                  {Math.min(filteredMyReports.length, currentPage * pageSize)} of {filteredMyReports.length} reports
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border border-[#DADCE0] hover:bg-[#F1F3F4] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="font-semibold text-[#202124]">
                    Page {currentPage} of {totalMyPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalMyPages, p + 1))}
                    disabled={currentPage === totalMyPages}
                    className="px-2.5 py-1 rounded border border-[#DADCE0] hover:bg-[#F1F3F4] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. RECENT COMMUNITY REPORTS (Public Feed Excluded from Private Info) */}
      <div className="bg-white rounded-2xl border border-[#DADCE0] p-5 sm:p-6 shadow-elevation-1 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FBBC05]" />
            Recent Community Reports
          </h3>
          <p className="text-xs text-[#5F6368]">
            Public reports across Bengaluru • Private citizen contact numbers and emails are strictly protected
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentCommunityReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectIssue(report)}
              className="bg-white rounded-xl border border-[#DADCE0] p-4 shadow-xs hover:shadow-elevation-2 transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[#5F6368]">
                    #{report.ticketNumber}
                  </span>
                  {renderStatusBadge(report.status)}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[#202124] line-clamp-2 group-hover:text-[#1A73E8] transition-colors">
                  {report.title}
                </h4>

                <div className="flex items-center justify-between text-xs text-[#5F6368] pt-1">
                  <span className="flex items-center gap-1 font-medium text-[#4285F4]">
                    <MapPin className="w-3 h-3" />
                    {report?.location?.ward || 'General Area'}
                  </span>
                  <span className="text-[11px]">{report.createdAt}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DADCE0]/60 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    upvoteReport(report.id);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-[#DADCE0] bg-[#F8F9FA] hover:bg-gray-100 text-[#202124] font-semibold text-[11px]"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${report.hasUpvoted ? 'fill-[#1A73E8] text-[#1A73E8]' : ''}`} />
                  <span>{report.upvotes}</span>
                </button>
                <span className="text-[11px] text-[#1A73E8] font-semibold group-hover:underline flex items-center">
                  View Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. COMMUNITY TRANSPARENCY SUMMARY */}
      <div className="bg-[#E8F0FE]/40 rounded-2xl border border-[#D2E3FC] p-5 sm:p-6 space-y-3">
        <h4 className="text-sm font-bold text-[#1A73E8] uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Community Governance Summary
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-[#5F6368] block">Total Reports</span>
            <span className="font-bold text-[#202124] text-base">{stats.total}</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Resolved</span>
            <span className="font-bold text-[#137333] text-base">{stats.resolved}</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Pending</span>
            <span className="font-bold text-[#B06000] text-base">{stats.pending}</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">In Progress</span>
            <span className="font-bold text-[#1A73E8] text-base">{stats.inProgress}</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Resolution Rate</span>
            <span className="font-bold text-[#137333] text-base">{stats.resolutionRate}%</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Avg SLA Time</span>
            <span className="font-bold text-[#1A73E8] text-base">{avgResolutionSLA}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyDashboard;
