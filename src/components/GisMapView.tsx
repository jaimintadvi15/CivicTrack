import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Sparkles,
  Eye
} from 'lucide-react';
import { CivicReport, FilterState, Ward } from '../types';
import { CIVIC_CATEGORIES } from '../data/mockReports';
import { GoogleMaps } from './GoogleMaps';

interface GisMapViewProps {
  reports: CivicReport[];
  filter: FilterState;
  onFilterChange: (filter: Partial<FilterState>) => void;
  onSelectReport: (report: CivicReport) => void;
  selectedReportId?: string;
}

export const GisMapView: React.FC<GisMapViewProps> = ({
  reports,
  filter,
  onFilterChange,
  onSelectReport,
  selectedReportId,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapLayer, setMapLayer] = useState<'cadastral' | 'satellite' | 'heatmap'>('cadastral');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>('CL-4TH-ELM');
  const [hoveredReport, setHoveredReport] = useState<CivicReport | null>(null);

  // Group reports by duplicate cluster or geographic proximity
  const clusters = useMemo(() => {
    // Reports with duplicate clusters
    const clusterMap = new Map<string, CivicReport[]>();
    const singles: CivicReport[] = [];

    reports.forEach((r) => {
      if (r.duplicateClusterId && r.duplicateCount > 1) {
        if (!clusterMap.has(r.duplicateClusterId)) {
          clusterMap.set(r.duplicateClusterId, []);
        }
        clusterMap.get(r.duplicateClusterId)!.push(r);
      } else {
        singles.push(r);
      }
    });

    return {
      clustered: Array.from(clusterMap.entries()).map(([clusterId, clusterReports]) => ({
        clusterId,
        primary: clusterReports[0],
        allReports: clusterReports,
        totalCount: clusterReports[0].duplicateCount,
        hasCritical: clusterReports.some((r) => r.severity === 'CRITICAL'),
      })),
      singles,
    };
  }, [reports]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.8, prev + delta), 2.2));
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-slate-100 min-h-[620px] relative overflow-hidden border border-slate-200 rounded-none">
      
      {/* Left Filter Rail for Triage */}
      <aside className="w-full lg:w-72 bg-slate-50 border-r border-slate-200 p-3.5 flex flex-col gap-4 text-xs z-10 text-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono text-slate-800">
          <span className="flex items-center gap-1.5 font-bold">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            GIS TRIAGE FILTERS
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {reports.length} plotted
          </span>
        </div>

        {/* Severity filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-600 uppercase tracking-wider block font-semibold">
            Severity Filter
          </label>
          <div className="grid grid-cols-2 gap-1 font-mono">
            {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <button
                key={s}
                onClick={() => onFilterChange({ severity: s })}
                className={`px-2 py-1.5 rounded text-[11px] text-left transition-colors border ${
                  filter.severity === s
                    ? s === 'CRITICAL'
                      ? 'bg-red-600 border-red-700 text-white font-bold shadow-xs'
                      : 'bg-slate-800 border-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                {s === 'all' ? 'All Severities' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-600 uppercase tracking-wider block font-semibold">
            Work Category
          </label>
          <select
            value={filter.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full bg-white border border-slate-300 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          >
            <option value="all">All Categories ({reports.length})</option>
            {Object.entries(CIVIC_CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.code} — {value.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ward / Zone filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-600 uppercase tracking-wider block font-semibold">
            Municipal Ward
          </label>
          <select
            value={filter.ward}
            onChange={(e) => onFilterChange({ ward: e.target.value })}
            className="w-full bg-white border border-slate-300 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          >
            <option value="all">All Wards (W1 - W6)</option>
            <option value="Ward 1 - West Harbor">Ward 1 - West Harbor</option>
            <option value="Ward 2 - Industrial Corridor">Ward 2 - Industrial Corridor</option>
            <option value="Ward 3 - Riverfront">Ward 3 - Riverfront</option>
            <option value="Ward 4 - Midtown Central">Ward 4 - Midtown Central</option>
            <option value="Ward 5 - East Heights">Ward 5 - East Heights</option>
            <option value="Ward 6 - Southern Parklands">Ward 6 - Southern Parklands</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-600 uppercase tracking-wider block font-semibold">
            Resolution Pipeline
          </label>
          <select
            value={filter.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full bg-white border border-slate-300 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted (Pending Triage)</option>
            <option value="verified">Verified (Inspected)</option>
            <option value="assigned">Assigned (Crew Queued)</option>
            <option value="in_progress">In Progress (On-Site)</option>
            <option value="resolved">Resolved (Completed)</option>
          </select>
        </div>

        {/* Duplicate Clusters Focus Toggle */}
        <div className="pt-2 border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 select-none">
            <input
              type="checkbox"
              checked={filter.duplicatesOnly}
              onChange={(e) => onFilterChange({ duplicatesOnly: e.target.checked })}
              className="rounded bg-white border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="font-mono text-xs font-semibold">Duplicate Clusters Only</span>
          </label>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Highlight high-density complaint clusters with &ge; 2 reports in 200m radius.
          </p>
        </div>

        {/* Reset button */}
        {(filter.category !== 'all' ||
          filter.severity !== 'all' ||
          filter.ward !== 'all' ||
          filter.status !== 'all' ||
          filter.duplicatesOnly) && (
          <button
            onClick={() =>
              onFilterChange({
                category: 'all',
                severity: 'all',
                ward: 'all',
                status: 'all',
                duplicatesOnly: false,
              })
            }
            className="mt-auto px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded text-center text-xs font-mono transition-colors shadow-xs"
          >
            Reset Active Filters
          </button>
        )}
      </aside>

      {/* Main Map Canvas Display */}
      <div className="flex-1 relative flex flex-col bg-slate-100">
        
        {/* Top GIS Map Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs font-mono text-slate-700 pointer-events-auto shadow-sm">
            <span className="flex items-center gap-1.5 text-blue-700 font-bold">
              <GoogleMaps className="w-4 h-4" />
              METRO WEST MUNICIPAL GIS
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">DATUM: WGS-84</span>
            <span className="hidden sm:inline text-slate-500">SCALE: 1:12,500</span>
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-1 flex items-center gap-1 shadow-sm">
              <button
                onClick={() => setMapLayer('cadastral')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  mapLayer === 'cadastral'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cadastral
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  mapLayer === 'satellite'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Grid Lines
              </button>
              <button
                onClick={() => setMapLayer('heatmap')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  mapLayer === 'heatmap'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Density Heat
              </button>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-1 flex items-center gap-1 shadow-sm font-mono">
              <button
                onClick={() => handleZoom(0.2)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(-0.2)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setExpandedClusterId(null);
                }}
                className="px-2 py-1 text-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Vector SVG GIS Map Container */}
        <div className="w-full h-full min-h-[580px] flex-1 relative overflow-hidden bg-[#e2e8f0] cursor-crosshair">
          
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: expandedClusterId ? '42% 48%' : 'center center',
            }}
          >
            <defs>
              {/* GIS Grid Pattern */}
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#cbd5e1" strokeWidth="0.25" />
              </pattern>
              {/* Density Glow Filter */}
              <radialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base Background Grid */}
            <rect width="100" height="100" fill="#f8fafc" />
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Natural Waterway: St. Jude Estuary / Riverfront */}
            <path
              d="M 60 0 C 65 25, 75 40, 85 60 C 92 75, 96 85, 100 95 L 100 0 Z"
              fill="#dbeafe"
              stroke="#93c5fd"
              strokeWidth="0.4"
            />
            <text x="82" y="25" fill="#1e40af" fontSize="1.8" fontFamily="monospace" fontWeight="bold" transform="rotate(30 82 25)">
              HARBOR BASIN & WATERWAY
            </text>

            {/* Railway Corridor */}
            <path
              d="M 0 45 L 100 45"
              stroke="#64748b"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />
            <text x="3" y="44" fill="#475569" fontSize="1.3" fontFamily="monospace" fontWeight="semibold">
              GRAND TRUNK FREIGHT RAIL (CORRIDOR 4)
            </text>

            {/* Ward Boundaries (Faint Dashed Lines) */}
            <line x1="28" y1="0" x2="28" y2="100" stroke="#94a3b8" strokeWidth="0.3" strokeDasharray="1.5 1" />
            <rect x="28" y="25" width="36" height="45" fill="none" stroke="#94a3b8" strokeWidth="0.3" strokeDasharray="2 1" />
            
            {/* Ward Name Labels */}
            <text x="6" y="10" fill="#64748b" fontSize="1.8" fontFamily="monospace" fontWeight="bold">WARD 1: WEST HARBOR</text>
            <text x="6" y="88" fill="#64748b" fontSize="1.8" fontFamily="monospace" fontWeight="bold">WARD 2: INDUSTRIAL CORRIDOR</text>
            <text x="32" y="30" fill="#334155" fontSize="1.9" fontFamily="monospace" fontWeight="bold">WARD 4: MIDTOWN CENTRAL</text>
            <text x="64" y="15" fill="#64748b" fontSize="1.8" fontFamily="monospace" fontWeight="bold">WARD 5: EAST HEIGHTS</text>
            <text x="62" y="85" fill="#64748b" fontSize="1.8" fontFamily="monospace" fontWeight="bold">WARD 3: RIVERFRONT</text>
            <text x="32" y="92" fill="#64748b" fontSize="1.8" fontFamily="monospace" fontWeight="bold">WARD 6: SOUTHERN PARKLANDS</text>

            {/* Major Arterial Roads */}
            {/* 4th Ave West (East-West Major Arterial) */}
            <line x1="0" y1="48" x2="100" y2="48" stroke="#cbd5e1" strokeWidth="1.6" />
            <line x1="0" y1="48" x2="100" y2="48" stroke="#ffffff" strokeWidth="1.2" />
            <text x="5" y="47.2" fill="#334155" fontSize="1.3" fontFamily="monospace" fontWeight="bold">4th AVE WEST</text>

            {/* Elm Street (North-South Major) */}
            <line x1="42" y1="0" x2="42" y2="100" stroke="#cbd5e1" strokeWidth="1.6" />
            <line x1="42" y1="0" x2="42" y2="100" stroke="#ffffff" strokeWidth="1.2" />
            <text x="42.8" y="8" fill="#334155" fontSize="1.3" fontFamily="monospace" fontWeight="bold" transform="rotate(90 42.8 8)">ELM STREET</text>

            {/* Oakridge Blvd */}
            <line x1="18" y1="0" x2="24" y2="100" stroke="#cbd5e1" strokeWidth="1.2" />
            <text x="17" y="15" fill="#475569" fontSize="1.2" fontFamily="monospace" transform="rotate(80 17 15)">OAKRIDGE BLVD</text>

            {/* Riverfront Blvd */}
            <path d="M 55 0 C 60 25, 70 40, 78 60 C 85 75, 90 85, 95 100" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
            <text x="70" y="50" fill="#475569" fontSize="1.2" fontFamily="monospace" transform="rotate(45 70 50)">RIVERFRONT BLVD</text>

            {/* Density Heatmap Layer (if selected) */}
            {mapLayer === 'heatmap' && (
              <g>
                <circle cx="42" cy="48" r="14" fill="url(#heatGlow)" />
                <circle cx="68" cy="62" r="10" fill="url(#heatGlow)" />
                <circle cx="34" cy="36" r="8" fill="url(#heatGlow)" />
              </g>
            )}

            {/* Expanded Cluster 200m Radius Indicator (4th Ave & Elm) */}
            {expandedClusterId === 'CL-4TH-ELM' && (
              <g>
                <circle
                  cx="42"
                  cy="48"
                  r="6"
                  fill="#ef4444"
                  fillOpacity="0.12"
                  stroke="#ef4444"
                  strokeWidth="0.3"
                  strokeDasharray="0.8 0.5"
                />
                <text x="42" y="55" fill="#b91c1c" fontSize="1.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  200m DUP CLUSTER (7 CITIZEN SUBMISSIONS)
                </text>
              </g>
            )}
          </svg>

          {/* Plotted Interactive DOM Overlays for Reports and Clusters */}
          {/* 1. Clustered High-Density Nodes */}
          {clusters.clustered.map((cluster) => {
            const report = cluster.primary;
            const isExpanded = expandedClusterId === cluster.clusterId;

            return (
              <div
                key={cluster.clusterId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-200"
                style={{
                  left: `${report.coordinates.mapX}%`,
                  top: `${report.coordinates.mapY}%`,
                }}
              >
                {/* Cluster Badge */}
                <div className="relative group">
                  <button
                    onClick={() => {
                      if (!isExpanded) {
                        setExpandedClusterId(cluster.clusterId);
                        onSelectReport(report);
                      } else {
                        onSelectReport(report);
                      }
                    }}
                    onMouseEnter={() => setHoveredReport(report)}
                    onMouseLeave={() => setHoveredReport(null)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs shadow-md transition-all border ${
                      cluster.hasCritical
                        ? 'bg-red-600 text-white border-white ring-2 ring-red-500/40'
                        : 'bg-amber-600 text-white border-white ring-2 ring-amber-500/40'
                    } ${isExpanded ? 'scale-110 shadow-lg' : 'hover:scale-105'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>CLUSTER ({cluster.totalCount})</span>
                  </button>

                  {/* If this cluster is expanded, show satellite mini pins around it */}
                  {isExpanded && (
                    <div className="absolute top-0 left-0 pointer-events-auto">
                      {report.duplicateCluster.slice(0, 5).map((dup, idx) => {
                        const angle = (idx / 5) * 2 * Math.PI;
                        const radius = 38;
                        const offsetX = Math.cos(angle) * radius;
                        const offsetY = Math.sin(angle) * radius;

                        return (
                          <button
                            key={dup.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectReport(report);
                            }}
                            title={`${dup.description} (${dup.distanceMeters}m)`}
                            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-red-600 text-[10px] font-mono font-bold text-red-700 flex items-center justify-center hover:scale-125 transition-transform shadow-md"
                            style={{
                              left: `${offsetX}px`,
                              top: `${offsetY}px`,
                            }}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 2. Single Standalone Report Markers */}
          {clusters.singles.map((report) => {
            const isSelected = selectedReportId === report.id;
            const isCritical = report.severity === 'CRITICAL';
            const isHigh = report.severity === 'HIGH';

            return (
              <div
                key={report.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{
                  left: `${report.coordinates.mapX}%`,
                  top: `${report.coordinates.mapY}%`,
                }}
              >
                <button
                  onClick={() => onSelectReport(report)}
                  onMouseEnter={() => setHoveredReport(report)}
                  onMouseLeave={() => setHoveredReport(null)}
                  className={`relative flex items-center justify-center rounded-full p-1 transition-all ${
                    isSelected
                      ? 'ring-3 ring-blue-600 scale-125 z-40'
                      : 'hover:scale-125'
                  }`}
                >
                  {/* Severity indicator dot */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-mono font-bold shadow-md ${
                      isCritical
                        ? 'bg-red-600 text-white'
                        : isHigh
                        ? 'bg-amber-600 text-white'
                        : report.severity === 'MEDIUM'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {report.severity[0]}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Hover preview tooltip */}
          {hoveredReport && (
            <div
              className="absolute bottom-4 left-4 z-40 bg-white border border-slate-300 rounded-lg p-3 max-w-sm shadow-xl text-xs font-mono pointer-events-none text-slate-800"
            >
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                <span className="text-blue-700 font-bold">{hoveredReport.ticketNumber}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  hoveredReport.severity === 'CRITICAL'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {hoveredReport.severity}
                </span>
              </div>
              <div className="mt-1.5 font-sans font-semibold text-slate-900 line-clamp-1">
                {hoveredReport.title}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                {hoveredReport.address} &bull; {hoveredReport.ward.split(' - ')[0]}
              </div>
              {hoveredReport.duplicateCount > 1 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-amber-700 font-bold flex items-center gap-1">
                  <span>{hoveredReport.duplicateCount} Duplicate reports clustered</span>
                </div>
              )}
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-3 right-3 z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-700 shadow-md pointer-events-auto">
            <div className="font-bold text-slate-800 mb-1.5 text-[10px] uppercase tracking-wider">
              GIS Severity Legend
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                <span>Critical (&lt;4h SLA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-white shadow-xs" />
                <span>High (24h SLA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-white shadow-xs" />
                <span>Medium (72h SLA)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-white shadow-xs" />
                <span>Low (7d SLA)</span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500">
              Click cluster badge to zoom & reveal duplicate submissions.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
