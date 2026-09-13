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
  // Filter to citizen's reports (or all mock reports where isCitizenSubmitted is true or all reports for demo evaluation)
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 text-slate-900 font-sans">
      
      {/* Top Banner */}
      <div className="mb-5 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            My Submitted Reports &amp; Resolution Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Transparent milestone status tracking directly linked to Metro West public works dispatch
          </p>
        </div>

        <button
          onClick={onFileNewReport}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-mono font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report Another Issue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          Active in Pipeline ({citizenReports.filter((r) => r.status !== 'resolved').length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'resolved'
              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          Completed &amp; Verified ({citizenReports.filter((r) => r.status === 'resolved').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          All Filings ({citizenReports.length})
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 font-mono text-xs shadow-xs">
            <p className="text-slate-900 font-bold text-sm">No reports found in this tab.</p>
            <p className="mt-1 text-slate-500">
              Submit an issue using the Citizen Report Flow to see live status tracking.
            </p>
            <button
              onClick={onFileNewReport}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
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
                className={`bg-white border rounded-lg p-4 sm:p-5 transition-all shadow-xs ${
                  isResolved
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : report.severity === 'CRITICAL'
                    ? 'border-red-200 hover:border-red-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-blue-700 font-bold">{report.ticketNumber}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-700 font-medium">
                        {catConfig?.code} — {catConfig?.label.split(' / ')[0]}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">{report.ward.split(' - ')[0]}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans mt-1">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : report.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Filed: {new Date(report.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* COMPACT HORIZONTAL STATUS PIPELINE TRACKER */}
                <div className="my-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                    <span className="uppercase text-[10px] tracking-wider text-slate-500 font-semibold">
                      Operational Status Pipeline
                    </span>
                    <span className="text-slate-700 font-medium">
                      Step {currentStepIdx + 1} of 5 &bull; {PIPELINE_STEPS[currentStepIdx].label}
                    </span>
                  </div>

                  <div className="relative">
                    {/* Background track line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-slate-200 rounded-full" />
                    {/* Active progress fill line */}
                    <div
                      className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all duration-500 ${
                        isResolved ? 'bg-emerald-600' : 'bg-blue-600'
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
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all border ${
                                isDone
                                  ? isResolved
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'bg-blue-600 border-blue-500 text-white'
                                  : 'bg-white border-slate-300 text-slate-400'
                              } ${isCurrent ? 'ring-4 ring-blue-500/20 scale-110' : ''}`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] font-mono mt-1.5 whitespace-nowrap ${
                                isCurrent
                                  ? 'text-blue-700 font-bold'
                                  : isDone
                                  ? 'text-slate-700 font-medium'
                                  : 'text-slate-400'
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
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-sans text-slate-700 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-mono text-[11px] block uppercase font-bold">
                        Current Operational Status &amp; Next Steps:
                      </strong>
                      {report.status === 'submitted' && (
                        <span className="text-slate-600">
                          Report passed automated spatial screening. Queued for Ward {report.ward.split(' - ')[0]} triage desk review. Inspector verification scheduled within 24 hours.
                        </span>
                      )}
                      {report.status === 'verified' && (
                        <span className="text-slate-600">
                          Defect verified on-site by municipal road inspector. Upgraded in work order queue for equipment allocation.
                        </span>
                      )}
                      {report.status === 'assigned' && (
                        <span className="text-slate-600">
                          Dispatched to <strong>{report.assignedCrew || 'Road Maintenance Crew #04'}</strong>. Crew has received material order and transit route schedule.
                        </span>
                      )}
                      {report.status === 'in_progress' && (
                        <span className="text-amber-800">
                          <strong>Active work zone in progress:</strong> Crew is on site at {report.address}. Traffic lane protection deployed. Expected completion today.
                        </span>
                      )}
                      {report.status === 'resolved' && (
                        <span className="text-emerald-800 font-medium">
                          Work verified complete by Public Works Inspector. Repair certified for right-of-way reopening.
                        </span>
                      )}
                    </div>
                  </div>

                  {report.duplicateCount > 0 && (
                    <div className="text-[11px] font-mono text-amber-800 font-medium pl-5">
                      &bull; Associated with Priority Cluster ({report.duplicateCount} neighboring complaints merged into this work order)
                    </div>
                  )}
                </div>

                {/* BEFORE / AFTER PHOTO RESOLUTION MODULE FOR RESOLVED ISSUES */}
                {isResolved && report.resolvedPhotoUrl && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-mono font-bold text-emerald-900">
                          VERIFIED REPAIR PROOF (BEFORE &amp; AFTER COMPARISON)
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setComparingReportId(isComparing ? null : report.id)
                        }
                        className="text-[11px] font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1 underline cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                        {isComparing ? 'Hide Comparison' : 'Inspect Side-by-Side'}
                      </button>
                    </div>

                    {isComparing && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {/* Before */}
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 pb-1 flex justify-between font-medium">
                            <span>BEFORE (CITIZEN REPORT)</span>
                            <span>{new Date(report.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <img
                            src={report.photoUrl}
                            alt="Before repair"
                            className="w-full aspect-video object-cover rounded border border-slate-300"
                          />
                        </div>

                        {/* After */}
                        <div>
                          <div className="text-[10px] font-mono text-emerald-800 pb-1 flex justify-between font-bold">
                            <span>AFTER (COMPLETED BY CREW)</span>
                            <span>{report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString() : 'Verified'}</span>
                          </div>
                          <img
                            src={report.resolvedPhotoUrl}
                            alt="After repair"
                            className="w-full aspect-video object-cover rounded border border-emerald-300"
                          />
                        </div>

                        {report.resolvedNotes && (
                          <div className="sm:col-span-2 text-[11px] text-slate-700 font-mono bg-white p-2.5 rounded border border-slate-200">
                            <strong>Crew Field Notes:</strong> {report.resolvedNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom detail action */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[11px]">
                    SLA Deadline: {report.slaDeadlineHours}h Max window
                  </span>
                  <button
                    onClick={() => onSelectReportDetail(report)}
                    className="text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>Inspect Audit History &amp; Log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
