import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Layers,
  ArrowRight,
  Truck,
  Plus,
  Info,
  Calendar,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { CivicReport, ReportStatus } from '../types';
import { CIVIC_CATEGORIES } from '../data/mockReports';

interface CitizenMyReportsProps {
  reports: CivicReport[];
  onFileNewReport: () => void;
  onSelectReportDetail: (report: CivicReport) => void;
}

const PIPELINE_STEPS: { status: ReportStatus; label: string; description: string }[] = [
  { status: 'submitted', label: 'Submitted', description: 'AI & GPS check passed' },
  { status: 'verified', label: 'Verified', description: 'Defect confirmed' },
  { status: 'assigned', label: 'Assigned', description: 'Dispatched to crew' },
  { status: 'in_progress', label: 'In Progress', description: 'Crew on site' },
  { status: 'resolved', label: 'Resolved', description: 'Inspected & repaired' },
];

export const CitizenMyReports: React.FC<CitizenMyReportsProps> = ({
  reports,
  onFileNewReport,
  onSelectReportDetail,
}) => {
  const citizenReports = reports.filter((r) => r.isCitizenSubmitted !== false);

  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');
  const [comparingReportId, setComparingReportId] = useState<string | null>(null);

  const filtered = citizenReports.filter((r) => {
    if (activeTab === 'active') return r.status !== 'resolved';
    if (activeTab === 'resolved') return r.status === 'resolved';
    return true;
  });

  const getStepIndex = (status: ReportStatus) => {
    const idx = PIPELINE_STEPS.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-full bg-[#121212] text-white">
      <div className="max-w-4xl mx-auto p-3 sm:p-6 font-sans">
        
        {/* Top Banner */}
        <div className="mb-6 pb-5 border-b border-[#333] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#00bfff]" />
              My Submitted Reports &amp; Tracker
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Transparent milestone status tracking directly linked to Metro West public works dispatch
            </p>
          </div>

          <button
            onClick={onFileNewReport}
            className="px-4 py-2 rounded-xl bg-[#00bfff] hover:bg-[#00bfff]/90 text-sm font-semibold text-white transition-all shadow-[0_0_15px_rgba(0,191,255,0.3)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Report Another Issue</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-sm transition-all backdrop-blur border ${
              activeTab === 'active'
                ? 'bg-white/10 text-[#00bfff] font-semibold border-[#00bfff]/50 shadow-[0_0_10px_rgba(0,191,255,0.2)]'
                : 'text-gray-400 hover:text-white bg-transparent border-[#333] hover:bg-white/5'
            }`}
          >
            Active in Pipeline ({citizenReports.filter((r) => r.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-xl text-sm transition-all backdrop-blur border ${
              activeTab === 'resolved'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'text-gray-400 hover:text-white bg-transparent border-[#333] hover:bg-white/5'
            }`}
          >
            Completed &amp; Verified ({citizenReports.filter((r) => r.status === 'resolved').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm transition-all backdrop-blur border ${
              activeTab === 'all'
                ? 'bg-white/10 text-white font-semibold border-white/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                : 'text-gray-400 hover:text-white bg-transparent border-[#333] hover:bg-white/5'
            }`}
          >
            All Filings ({citizenReports.length})
          </button>
        </div>

        {/* Reports List */}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-10 text-center shadow-lg">
              <p className="text-white font-semibold text-lg">No reports found in this tab.</p>
              <p className="mt-2 text-gray-400">
                Submit an issue using the Citizen Report Flow to see live status tracking.
              </p>
              <button
                onClick={onFileNewReport}
                className="mt-6 px-6 py-2.5 bg-[#00bfff] hover:bg-[#00bfff]/90 text-white rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(0,191,255,0.3)]"
              >
                Report an Issue Now
              </button>
            </div>
          ) : (
            filtered.map((report) => {
              const currentStepIdx = getStepIndex(report.status);
              const isResolved = report.status === 'resolved';
              const catConfig = CIVIC_CATEGORIES[report.category];
              const isComparing = comparingReportId === report.id;

              return (
                <div
                  key={report.id}
                  className={`bg-[#1a1a1a] border rounded-2xl p-5 sm:p-6 transition-all shadow-xl backdrop-blur-sm relative overflow-hidden ${
                    isResolved
                      ? 'border-emerald-500/30 hover:border-emerald-500/60'
                      : report.severity === 'CRITICAL'
                      ? 'border-red-500/30 hover:border-red-500/60'
                      : 'border-[#333] hover:border-[#444]'
                  }`}
                >
                  {/* Subtle Background Glow for Critical / Resolved */}
                  {isResolved && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />}
                  {report.severity === 'CRITICAL' && !isResolved && <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />}

                  {/* Header info */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#333]">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono mb-1.5">
                        <span className="text-[#00bfff] font-bold bg-[#00bfff]/10 px-2 py-0.5 rounded border border-[#00bfff]/20">{report.ticketNumber}</span>
                        <span className="text-gray-500">&bull;</span>
                        <span className="text-gray-300 font-medium">
                          {catConfig?.code} — {catConfig?.label.split(' / ')[0]}
                        </span>
                        <span className="text-gray-500">&bull;</span>
                        <span className="text-gray-400">{report.ward.split(' - ')[0]}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{report.address}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 font-mono">
                      <span
                        className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          isResolved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : report.severity === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-white/5 text-gray-300 border border-white/10'
                        }`}
                      >
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        Filed: {new Date(report.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* COMPACT HORIZONTAL STATUS PIPELINE TRACKER */}
                  <div className="my-6">
                    <div className="flex items-center justify-between text-xs font-mono mb-3">
                      <span className="uppercase tracking-wider text-gray-500 font-semibold">
                        Operational Status Pipeline
                      </span>
                      <span className="text-gray-300">
                        Step <strong className="text-[#00bfff]">{currentStepIdx + 1}</strong> of 5 &bull; {PIPELINE_STEPS[currentStepIdx].label}
                      </span>
                    </div>

                    <div className="relative pt-2">
                      {/* Background track line */}
                      <div className="absolute top-[22px] left-0 right-0 h-1.5 bg-[#333] rounded-full" />
                      {/* Active progress fill line */}
                      <div
                        className={`absolute top-[22px] left-0 h-1.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor] ${
                          isResolved ? 'bg-emerald-500 text-emerald-500' : 'bg-[#00bfff] text-[#00bfff]'
                        }`}
                        style={{
                          width: `${(currentStepIdx / (PIPELINE_STEPS.length - 1)) * 100}%`,
                        }}
                      />

                      {/* Step nodes */}
                      <div className="relative flex justify-between">
                        {PIPELINE_STEPS.map((step, idx) => {
                          const isDone = idx <= currentStepIdx;
                          const isCurrent = idx === currentStepIdx;

                          return (
                            <div
                              key={step.status}
                              className="flex flex-col items-center text-center group"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all z-10 ${
                                  isDone
                                    ? isResolved
                                      ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] text-white'
                                      : 'bg-[#00bfff] shadow-[0_0_15px_rgba(0,191,255,0.5)] text-white'
                                    : 'bg-[#222] border-2 border-[#444] text-gray-500'
                                } ${isCurrent ? 'ring-4 ring-[#00bfff]/30 scale-110' : ''}`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>

                              <span
                                className={`text-[11px] mt-2 whitespace-nowrap uppercase tracking-wider ${
                                  isCurrent
                                    ? 'text-[#00bfff] font-bold'
                                    : isDone
                                    ? 'text-gray-300 font-medium'
                                    : 'text-gray-600'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* HELPFUL PENDING AND NEXT STEPS STATE */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-sans text-gray-300 space-y-2">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-[#00bfff] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white text-xs block uppercase font-bold tracking-wider mb-1">
                          Current Operational Status &amp; Next Steps:
                        </strong>
                        {report.status === 'submitted' && (
                          <span className="text-gray-400">
                            Report passed automated spatial screening. Queued for Ward {report.ward.split(' - ')[0]} triage desk review. Inspector verification scheduled within 24 hours.
                          </span>
                        )}
                        {report.status === 'verified' && (
                          <span className="text-gray-400">
                            Defect verified on-site by municipal road inspector. Upgraded in work order queue for equipment allocation.
                          </span>
                        )}
                        {report.status === 'assigned' && (
                          <span className="text-gray-400">
                            Dispatched to <strong className="text-white">{report.assignedCrew || 'Road Maintenance Crew #04'}</strong>. Crew has received material order and transit route schedule.
                          </span>
                        )}
                        {report.status === 'in_progress' && (
                          <span className="text-[#00bfff]">
                            <strong className="text-white">Active work zone in progress:</strong> Crew is on site at {report.address}. Traffic lane protection deployed. Expected completion today.
                          </span>
                        )}
                        {report.status === 'resolved' && (
                          <span className="text-emerald-400 font-medium">
                            Work verified complete by Public Works Inspector. Repair certified for right-of-way reopening.
                          </span>
                        )}
                      </div>
                    </div>

                    {report.duplicateCount > 0 && (
                      <div className="text-[11px] font-mono text-[#00bfff]/80 font-medium pl-8">
                        &bull; Associated with Priority Cluster ({report.duplicateCount} neighboring complaints merged into this work order)
                      </div>
                    )}
                  </div>

                  {/* BEFORE / AFTER PHOTO RESOLUTION MODULE FOR RESOLVED ISSUES */}
                  {isResolved && report.resolvedPhotoUrl && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                            VERIFIED REPAIR PROOF
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setComparingReportId(isComparing ? null : report.id)
                          }
                          className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                          {isComparing ? 'Hide Comparison' : 'Inspect Side-by-Side'}
                        </button>
                      </div>

                      {isComparing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                          {/* Before */}
                          <div>
                            <div className="text-[11px] font-mono text-gray-500 pb-1.5 flex justify-between font-medium">
                              <span>BEFORE (CITIZEN REPORT)</span>
                              <span>{new Date(report.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <img
                              src={report.photoUrl}
                              alt="Before repair"
                              className="w-full aspect-video object-cover rounded-lg border border-[#444]"
                            />
                          </div>

                          {/* After */}
                          <div>
                            <div className="text-[11px] font-mono text-emerald-400 pb-1.5 flex justify-between font-bold">
                              <span>AFTER (COMPLETED BY CREW)</span>
                              <span>{report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : 'Verified'}</span>
                            </div>
                            <img
                              src={report.resolvedPhotoUrl}
                              alt="After repair"
                              className="w-full aspect-video object-cover rounded-lg border border-emerald-500/50"
                            />
                          </div>

                          {report.resolvedNotes && (
                            <div className="sm:col-span-2 text-xs text-gray-300 font-mono bg-[#111] p-3 rounded-lg border border-[#333]">
                              <strong className="text-white">Crew Field Notes:</strong> {report.resolvedNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom detail action */}
                  <div className="mt-5 pt-4 border-t border-[#333] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-gray-500">
                      SLA Deadline: <strong className="text-gray-300">{report.slaDeadlineHours}h Max window</strong>
                    </span>
                    <button
                      onClick={() => onSelectReportDetail(report)}
                      className="text-[#00bfff] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Inspect Audit History &amp; Log</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
