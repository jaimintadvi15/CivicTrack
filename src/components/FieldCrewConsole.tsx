import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Upload,
  Layers,
  ChevronRight,
  Shield,
  FileCheck,
  Send,
  Sliders
} from 'lucide-react';
import { CivicReport, CrewTeam, ReportStatus } from '../types';
import { MUNICIPAL_CREWS, CIVIC_CATEGORIES } from '../data/mockReports';

interface FieldCrewConsoleProps {
  reports: CivicReport[];
  onUpdateReport: (updatedReport: CivicReport) => void;
  onSelectReport: (report: CivicReport) => void;
}

export const FieldCrewConsole: React.FC<FieldCrewConsoleProps> = ({
  reports,
  onUpdateReport,
  onSelectReport,
}) => {
  const [selectedCrew, setSelectedCrew] = useState<CrewTeam>('Road Maintenance Crew #04');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Field resolution form state
  const [resolutionPhoto, setResolutionPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
  );
  const [fieldNotes, setFieldNotes] = useState<string>(
    'Applied 1.4 tons of hot-mix asphalt. Compacted with vibrating roller to flush roadway grade. Bituminous sealant applied around edges. Reopened westbound lane to transit traffic.'
  );

  // Filter reports assigned to this crew (or all open reports if none)
  const crewWorkOrders = reports.filter(
    (r) => r.assignedCrew === selectedCrew && r.status !== 'resolved'
  );
  const resolvedOrders = reports.filter(
    (r) => r.assignedCrew === selectedCrew && r.status === 'resolved'
  );

  const handleStartWork = (report: CivicReport) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const updated: CivicReport = {
      ...report,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
      auditLogs: [
        ...report.auditLogs,
        {
          id: `log-${Date.now()}-crew-start`,
          timestamp,
          action: 'Crew On Site / Work Zone Established',
          actor: `${selectedCrew} (Mobile CAD Unit)`,
          fromStatus: report.status,
          toStatus: 'in_progress',
          notes: 'Crew vehicle #12 checked in at site. Traffic control cones placed.',
        },
      ],
    };
    onUpdateReport(updated);
  };

  const handleCompleteWork = (report: CivicReport) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const updated: CivicReport = {
      ...report,
      status: 'resolved',
      resolvedPhotoUrl: resolutionPhoto,
      resolvedAt: timestamp,
      resolvedNotes: fieldNotes,
      updatedAt: new Date().toISOString(),
      auditLogs: [
        ...report.auditLogs,
        {
          id: `log-${Date.now()}-crew-done`,
          timestamp,
          action: 'Work Completed & Photographic Proof Logged',
          actor: `${selectedCrew} (Foreman R. Diaz)`,
          fromStatus: report.status,
          toStatus: 'resolved',
          notes: fieldNotes,
        },
      ],
    };
    onUpdateReport(updated);
    setActiveJobId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 text-slate-800 font-sans">
      
      {/* Top Console Header */}
      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                Field Operations Crew Console
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                TABLET CAD DISPATCH
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned work orders, on-site execution &amp; photographic repair sign-off
            </p>
          </div>
        </div>

        {/* Crew selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 font-semibold">CREW UNIT:</span>
          <select
            value={selectedCrew}
            onChange={(e) => {
              setSelectedCrew(e.target.value as CrewTeam);
              setActiveJobId(null);
            }}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
          >
            {MUNICIPAL_CREWS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Active Work Orders and Action Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Work Order Queue for Selected Crew (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-slate-500 pb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>ACTIVE DISPATCH QUEUE</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                {crewWorkOrders.length} PENDING
              </span>
            </span>
            <span>SORTED BY URGENCY &amp; SLA</span>
          </div>

          {crewWorkOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 font-mono text-xs shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No active work orders for {selectedCrew}.</p>
              <p className="text-slate-500 mt-1">
                All dispatched jobs are currently completed or waiting for superintendent assignment.
              </p>
            </div>
          ) : (
            crewWorkOrders.map((order) => {
              const isSelected = activeJobId === order.id;
              const isCritical = order.severity === 'CRITICAL';
              const isInProgress = order.status === 'in_progress';

              return (
                <div
                  key={order.id}
                  className={`bg-white border rounded-lg p-4 transition-all shadow-xs ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                      : isCritical
                      ? 'border-red-200 hover:border-red-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-bold">{order.ticketNumber}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isCritical
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {order.severity}
                      </span>
                    </div>

                    <span
                      className={`capitalize px-2 py-0.5 rounded text-[10px] border font-bold ${
                        isInProgress
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2 font-sans">
                    {order.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.address} ({order.ward.split(' - ')[0]})</span>
                  </p>

                  {/* Operational defect details */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold">HAZARD TYPE:</span>
                      <span className="text-slate-800 font-bold truncate block">
                        {order.aiExtractedDetails.hazardType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold">DIMENSIONS:</span>
                      <span className="text-slate-800 font-bold truncate block">
                        {order.aiExtractedDetails.dimensionEstimate || 'Standard repair'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isInProgress ? (
                      <button
                        type="button"
                        onClick={() => handleStartWork(order)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Arrived &amp; Mark In-Progress</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveJobId(order.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Job &amp; Upload Proof</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectReport(order)}
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>Inspect Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Recently completed by this crew */}
          {resolvedOrders.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <div className="font-mono text-xs text-slate-500 font-bold mb-2 uppercase">
                Completed by this crew today ({resolvedOrders.length})
              </div>
              <div className="space-y-2">
                {resolvedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg bg-white border border-emerald-200 flex items-center justify-between text-xs font-mono shadow-xs"
                  >
                    <div>
                      <span className="text-blue-700 font-bold mr-2">{order.ticketNumber}</span>
                      <span className="text-slate-800 font-sans font-medium">{order.title}</span>
                    </div>
                    <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Job Resolution Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs font-mono shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <FileCheck className="w-4 h-4 text-blue-600" />
                WORK ORDER SIGN-OFF &amp; PROOF
              </span>
              <span className="text-[10px] text-slate-400">MUNICIPAL FORM MW-91</span>
            </div>

            {activeJobId ? (
              (() => {
                const targetJob = reports.find((r) => r.id === activeJobId);
                if (!targetJob) return null;

                return (
                  <div className="mt-3.5 space-y-3.5">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold">ACTIVE TARGET JOB:</span>
                      <span className="text-blue-700 font-bold">{targetJob.ticketNumber}</span>
                      <span className="text-slate-800 block font-sans text-xs mt-0.5 font-medium">
                        {targetJob.address}
                      </span>
                    </div>

                    {/* Proof Photo */}
                    <div>
                      <label className="block text-[11px] text-slate-600 uppercase mb-1 font-semibold">
                        Completed Repair Proof Photo
                      </label>
                      <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-300 mb-2">
                        <img
                          src={resolutionPhoto}
                          alt="Completed repair"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1.5 right-1.5 bg-emerald-900/90 text-[10px] text-white px-2 py-0.5 rounded border border-emerald-700 font-mono">
                          Verified Resolution
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setResolutionPhoto(
                              'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
                            )
                          }
                          className="flex-1 py-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                        >
                          Asphalt Patch
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setResolutionPhoto(
                              'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=800&q=80'
                            )
                          }
                          className="flex-1 py-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                        >
                          Luminaire
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setResolutionPhoto(
                              'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
                            )
                          }
                          className="flex-1 py-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                        >
                          Concrete Slab
                        </button>
                      </div>
                    </div>

                    {/* Field Notes */}
                    <div>
                      <label className="block text-[11px] text-slate-600 uppercase mb-1 font-semibold">
                        Materials Used &amp; Labor Notes
                      </label>
                      <textarea
                        rows={3}
                        value={fieldNotes}
                        onChange={(e) => setFieldNotes(e.target.value)}
                        placeholder="Log tonnage, mix temperature, sealant application, and safety clearance..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteWork(targetJob)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Sign Off &amp; Certify Work Complete
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="mt-6 text-center text-slate-400 py-6">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Job Selected For Sign-Off</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Click &ldquo;Complete Job &amp; Upload Proof&rdquo; on any in-progress work order to attach verified repair imagery and certify completion.
                </p>
              </div>
            )}
          </div>

          {/* Standard Crew Equipment Checklist */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs font-mono text-slate-600 shadow-xs">
            <div className="text-[11px] font-bold text-slate-900 mb-2.5 uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              Standard Work Zone Safety Protocol
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> High-visibility MUTCD warning taper
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Class 3 retroreflective vests on all hands
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Post-repair compaction density verified
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
