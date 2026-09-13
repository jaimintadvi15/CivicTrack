import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Layers,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  User,
  Shield,
  Sparkles,
  ArrowRight,
  Send,
  ExternalLink,
  History
} from 'lucide-react';
import { CivicReport, CrewTeam, ReportStatus } from '../types';
import { MUNICIPAL_CREWS, CIVIC_CATEGORIES } from '../data/mockReports';

interface ReportDetailModalProps {
  report: CivicReport;
  onClose: () => void;
  onUpdateReport: (updatedReport: CivicReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onUpdateReport,
}) => {
  const [assignedCrew, setAssignedCrew] = useState<CrewTeam | ''>(report.assignedCrew || '');
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>(report.status);
  const [internalNote, setInternalNote] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const isCritical = report.severity === 'CRITICAL';
  const catConfig = CIVIC_CATEGORIES[report.category];

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();

    const newLogs = [...report.auditLogs];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    if (currentStatus !== report.status) {
      newLogs.push({
        id: `log-${Date.now()}-status`,
        timestamp,
        action: `Status changed to ${currentStatus.toUpperCase()}`,
        actor: 'Dispatcher D. Henderson (Authority Console)',
        fromStatus: report.status,
        toStatus: currentStatus,
        notes: internalNote || 'Status updated via Authority Triage Console.',
      });
    }

    if (assignedCrew && assignedCrew !== report.assignedCrew) {
      newLogs.push({
        id: `log-${Date.now()}-crew`,
        timestamp,
        action: `Work Order Dispatched to ${assignedCrew}`,
        actor: 'Superintendent K. Patel',
        notes: internalNote ? `Dispatch Notes: ${internalNote}` : 'Assigned via dispatch board.',
      });
    }

    const updated: CivicReport = {
      ...report,
      status: currentStatus,
      assignedCrew: assignedCrew ? (assignedCrew as CrewTeam) : undefined,
      updatedAt: new Date().toISOString(),
      auditLogs: newLogs,
    };

    onUpdateReport(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    setInternalNote('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-blue-700 font-bold text-sm tracking-wide">
              {report.ticketNumber}
            </span>
            <span className="text-slate-300">|</span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                isCritical
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {report.severity} PRIORITY
            </span>
            <span className="hidden sm:inline text-slate-500 font-medium">
              {catConfig?.code} &bull; {catConfig?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {report.duplicateCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                Cluster: {report.duplicateCount} similar reports
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body - Split View */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-800 bg-white">
          
          {/* Left Column: Photo & AI Extracted Telemetry (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Original Citizen Photo */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-2 px-1 font-medium">
                <span>INCIDENT EVIDENCE PHOTO (SUBMITTED)</span>
                <span>ORIGINAL RESOLUTION &bull; EXIF VERIFIED</span>
              </div>
              <div className="relative aspect-video w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                <img
                  src={report.photoUrl}
                  alt={report.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-900/90 text-[10px] font-mono text-white px-2 py-1 rounded border border-slate-800">
                  GPS: {report.coordinates.lat.toFixed(4)}°N, {Math.abs(report.coordinates.lng).toFixed(4)}°W
                </div>
              </div>
            </div>

            {/* Resolved Photo if resolved */}
            {report.resolvedPhotoUrl && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-900 pb-2 px-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    POST-RESOLUTION WORK PROOF (CREW UPLOAD)
                  </span>
                  <span className="text-emerald-700">{report.resolvedAt || 'Completed'}</span>
                </div>
                <div className="relative aspect-video w-full bg-emerald-100 rounded-lg overflow-hidden border border-emerald-300">
                  <img
                    src={report.resolvedPhotoUrl}
                    alt="Resolved evidence"
                    className="w-full h-full object-cover"
                  />
                  {report.resolvedNotes && (
                    <div className="absolute bottom-2 left-2 right-2 bg-white/95 text-[11px] text-emerald-950 p-2.5 rounded border border-emerald-200 font-mono shadow-xs">
                      {report.resolvedNotes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Visual Extraction Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="text-slate-900 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  COMPUTER VISION CLASSIFICATION TELEMETRY
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {(report.aiConfidence * 100).toFixed(1)}% CONFIDENCE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block font-medium">EXTRACTED HAZARD</span>
                  <span className="text-slate-900 font-bold">
                    {report.aiExtractedDetails.hazardType}
                  </span>
                </div>
                {report.aiExtractedDetails.dimensionEstimate && (
                  <div>
                    <span className="text-slate-500 block font-medium">ESTIMATED DIMENSIONS</span>
                    <span className="text-slate-900 font-bold">
                      {report.aiExtractedDetails.dimensionEstimate}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block font-medium">VEHICULAR HAZARD RISK</span>
                  <span
                    className={`font-bold ${
                      report.aiExtractedDetails.vehicleRisk === 'CRITICAL'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {report.aiExtractedDetails.vehicleRisk}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">PEDESTRIAN RISK</span>
                  <span className="text-slate-900 font-bold">
                    {report.aiExtractedDetails.pedestrianRisk}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 font-sans text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 font-mono text-[11px] block mb-0.5 font-bold">
                  AUTOMATED SEVERITY REASONING:
                </strong>
                {report.severityReason}
              </div>
            </div>

            {/* DUPLICATE CLUSTER CALLOUT MODULE */}
            {report.duplicateCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200 font-mono text-xs">
                  <span className="text-amber-950 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    DUPLICATE CLUSTER ({report.duplicateCount} MATCHING CITIZEN REPORTS)
                  </span>
                  <span className="text-amber-700 text-[11px]">
                    Radius &le; 200m &bull; Last 30 Days
                  </span>
                </div>

                <div className="mt-2.5">
                  <p className="text-xs text-amber-950 mb-3 leading-relaxed font-sans">
                    Automated spatial clustering linked {report.duplicateCount} distinct resident filings to this exact infrastructure defect. Complaint volume has upgraded priority.
                  </p>

                  {/* Thumbnail strip of other reports */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {report.duplicateCluster.slice(0, 4).map((dup) => (
                      <div
                        key={dup.id}
                        className="bg-white border border-amber-200 rounded-lg p-2 text-[10px] font-mono shadow-xs"
                      >
                        <img
                          src={dup.photoUrl}
                          alt="Duplicate evidence"
                          className="w-full h-16 object-cover rounded mb-1.5"
                        />
                        <div className="text-amber-800 font-bold">{dup.distanceMeters}m away</div>
                        <div className="text-slate-600 truncate">{dup.reporter}</div>
                        <div className="text-slate-400 text-[9px]">
                          {new Date(dup.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Dispatch Control, Actions & Audit Log (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Incident Summary Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono">
              <h3 className="text-sm font-sans font-bold text-slate-900 mb-1">
                {report.title}
              </h3>
              <p className="font-sans text-slate-600 mb-3 leading-relaxed text-xs">
                {report.description}
              </p>

              <div className="space-y-2 pt-2.5 border-t border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">ADDRESS:</span>
                  <span className="text-slate-800 font-sans font-medium text-right">
                    {report.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">WARD:</span>
                  <span className="text-slate-800">{report.ward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">REPORTED AT:</span>
                  <span className="text-slate-800">
                    {new Date(report.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">SLA TARGET:</span>
                  <span className={report.slaDeadlineHours <= 4 ? 'text-red-700 font-bold' : 'text-slate-800'}>
                    &le; {report.slaDeadlineHours} Hours
                  </span>
                </div>
                {report.citizenContact && (
                  <div className="flex justify-between pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold">SUBMITTER:</span>
                    <span className="text-slate-700">
                      {report.citizenContact.name} ({report.citizenContact.phone})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Dispatcher Controls */}
            <form
              onSubmit={handleSaveChanges}
              className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono text-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-slate-900">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  DISPATCH &amp; STATUS CONTROLS
                </span>
                {isSaved && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SAVED
                  </span>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1 font-semibold">
                  Operational Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as ReportStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="submitted">Submitted (Pending Triage)</option>
                  <option value="verified">Verified (Defect Confirmed)</option>
                  <option value="assigned">Assigned (Crew Queued)</option>
                  <option value="in_progress">In Progress (Crew On-Site)</option>
                  <option value="resolved">Resolved (Work Complete)</option>
                </select>
              </div>

              {/* Crew Assignment */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1 font-semibold">
                  Assign Public Works Crew
                </label>
                <select
                  value={assignedCrew}
                  onChange={(e) => setAssignedCrew(e.target.value as CrewTeam)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Unassigned --</option>
                  {MUNICIPAL_CREWS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dispatch Note */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1 font-semibold">
                  Work Order Internal Note
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="e.g., Road repair unit dispatched with cold mix patch #4; temporary lane closure required..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
              >
                Apply Dispatch Changes &amp; Log Audit
              </button>
            </form>

            {/* Audit & Activity Log */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-2.5 pb-2 border-b border-slate-200">
                <History className="w-3.5 h-3.5 text-blue-600" />
                ACTIVITY &amp; AUDIT TRAIL ({report.auditLogs.length})
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {report.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] shadow-xs"
                  >
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] mt-0.5">By: {log.actor}</div>
                    {log.notes && (
                      <div className="text-slate-700 font-sans mt-1.5 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                        {log.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
