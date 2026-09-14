import React, { useState } from 'react';
import { ActiveAppView, CitizenTab, CivicReport, FilterState, CitizenUser, EmployeeUser } from './types';
import { INITIAL_REPORTS } from './data/mockReports';
import { AuthorityHeader } from './components/AuthorityHeader';
import { FieldCrewHeader } from './components/FieldCrewHeader';
import { CitizenHeader } from './components/CitizenHeader';
import { CitizenLogin } from './components/CitizenLogin';
import { EmployeeLogin } from './components/EmployeeLogin';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { LandingPage } from './components/LandingPage';
import { CitizenReportFlow } from './components/CitizenReportFlow';
import { CitizenMyReports } from './components/CitizenMyReports';
import { FieldCrewConsole } from './components/FieldCrewConsole';
import { ReportDetailModal } from './components/ReportDetailModal';
import { CheckCircle2, Bell, AlertTriangle } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<CivicReport[]>(INITIAL_REPORTS);
  const [currentView, setCurrentView] = useState<ActiveAppView>('landing');
  const [citizenTab, setCitizenTab] = useState<CitizenTab>('report');
  const [citizenUser, setCitizenUser] = useState<CitizenUser | null>(null);
  const [authorityUser, setAuthorityUser] = useState<EmployeeUser | null>(null);
  const [fieldCrewUser, setFieldCrewUser] = useState<EmployeeUser | null>(null);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);

  // Filter state for authority dashboard
  const [filter, setFilter] = useState<FilterState>({
    category: 'all',
    severity: 'all',
    ward: 'all',
    status: 'all',
    searchQuery: '',
    duplicatesOnly: false,
    dateRange: 'all',
  });

  // Operational notification banner
  const [notification, setNotification] = useState<string | null>(
    'Metro West 311 CAD Dispatch Active: 7-report duplicate cluster detected on 4th Ave & Elm St.'
  );

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...partial }));
  };

  const handleAddNewReport = (newReport: CivicReport) => {
    setReports((prev) => [newReport, ...prev]);
    setNotification(
      `New Citizen Report Logged: #${newReport.ticketNumber} at ${newReport.address} (${newReport.duplicateCount > 0 ? `${newReport.duplicateCount} duplicates clustered` : 'Single'})`
    );
  };

  const handleUpdateReport = (updatedReport: CivicReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
    setSelectedReport(updatedReport);
    setNotification(
      `Ticket #${updatedReport.ticketNumber} Updated: Status is now ${updatedReport.status.toUpperCase()} (${updatedReport.assignedCrew || 'Unassigned'})`
    );
  };

  const criticalCount = reports.filter(
    (r) => r.severity === 'CRITICAL' && r.status !== 'resolved'
  ).length;

  const totalActive = reports.filter((r) => r.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-slate-900">
      
      {/* Operational notification toast ticker */}
      {currentView !== 'landing' && notification && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2 truncate max-w-5xl">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold font-mono uppercase text-[11px] text-amber-900 shrink-0">Dispatch Advisory:</span>
            <span className="truncate text-slate-800">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-amber-800 hover:text-amber-950 font-mono text-[10px] font-semibold underline ml-3 shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. Main Content Area depending on View */}
      <main className="flex-1 flex flex-col">
        {/* VIEW 0: LANDING PAGE */}
        {currentView === 'landing' && <LandingPage onViewChange={setCurrentView} />}

        {/* VIEW 1: AUTHORITY DASHBOARD (DESKTOP OPS CENTER) */}
        {currentView === 'authority' && (
          !authorityUser ? (
            <EmployeeLogin portalType="authority" onLogin={setAuthorityUser} onBack={() => setCurrentView('landing')} />
          ) : (
            <div className="flex-1 flex flex-col">
              <AuthorityHeader onLogout={() => { setAuthorityUser(null); setCurrentView('landing'); }} criticalCount={criticalCount} totalActive={totalActive} />
              <AuthorityDashboard
                reports={reports}
                filter={filter}
                onFilterChange={handleFilterChange}
                onSelectReport={(rep) => setSelectedReport(rep)}
                selectedReportId={selectedReport?.id}
              />
            </div>
          )
        )}

        {/* VIEW 2: CITIZEN PORTAL (MOBILE-FIRST / RESPONSIVE) */}
        {currentView === 'citizen' && (
          !citizenUser ? (
            <CitizenLogin onLogin={setCitizenUser} onBack={() => setCurrentView('landing')} />
          ) : (
            <div className="flex-1 flex flex-col bg-slate-100">
              <CitizenHeader user={citizenUser} onLogout={() => { setCitizenUser(null); setCurrentView('landing'); }} />
            {/* Citizen internal subnav */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-center gap-3 text-xs shadow-xs">
              <button
                onClick={() => setCitizenTab('report')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  citizenTab === 'report'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                1. Report a Problem
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setCitizenTab('my_reports')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  citizenTab === 'my_reports'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                2. Track My Reports ({reports.filter(r => r.isCitizenSubmitted !== false).length})
              </button>
            </div>

            {/* Viewport frame simulator if enabled */}
            {isMobileFrame ? (
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-200/60">
                <div className="w-[390px] h-[820px] bg-slate-50 border-8 border-slate-800 rounded-[32px] shadow-2xl overflow-y-auto flex flex-col relative">
                  {/* Phone notch bar */}
                  <div className="h-7 bg-slate-900 text-slate-300 flex items-center justify-between px-6 text-[11px] font-medium sticky top-0 z-30">
                    <span>9:41</span>
                    <span className="text-[10px] text-slate-400">MetroWest 311 Mobile</span>
                    <span>5G 100%</span>
                  </div>
                  <div className="flex-1">
                    {citizenTab === 'report' ? (
                      <CitizenReportFlow
                        user={citizenUser}
                        onSubmitReport={handleAddNewReport}
                        onNavigateToMyReports={() => setCitizenTab('my_reports')}
                        onNavigateToAuthority={() => setCurrentView('authority')}
                      />
                    ) : (
                      <CitizenMyReports
                        reports={reports}
                        onFileNewReport={() => setCitizenTab('report')}
                        onSelectReportDetail={(rep) => setSelectedReport(rep)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {citizenTab === 'report' ? (
                  <CitizenReportFlow
                    user={citizenUser}
                    onSubmitReport={handleAddNewReport}
                    onNavigateToMyReports={() => setCitizenTab('my_reports')}
                    onNavigateToAuthority={() => setCurrentView('authority')}
                  />
                ) : (
                  <CitizenMyReports
                    reports={reports}
                    onFileNewReport={() => setCitizenTab('report')}
                    onSelectReportDetail={(rep) => setSelectedReport(rep)}
                  />
                )}
              </div>
            )}
          </div>
          )
        )}

        {/* VIEW 3: FIELD CREW CONSOLE */}
        {currentView === 'field_crew' && (
          !fieldCrewUser ? (
            <EmployeeLogin portalType="field_crew" onLogin={setFieldCrewUser} onBack={() => setCurrentView('landing')} />
          ) : (
            <div className="flex-1 flex flex-col bg-slate-100">
              <FieldCrewHeader onLogout={() => { setFieldCrewUser(null); setCurrentView('landing'); }} />
              <FieldCrewConsole
                reports={reports}
                onUpdateReport={handleUpdateReport}
                onSelectReport={(rep) => setSelectedReport(rep)}
              />
            </div>
          )
        )}
      </main>

      {/* 3. Detailed Report Modal / Inspector Drawer */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateReport={handleUpdateReport}
        />
      )}

      {/* Universal Footer */}
      {currentView !== 'landing' && (
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            CivicTrack &bull; Municipal Issue Detection & Resolution System &bull; Metro West DPW
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span>CAD INTEGRATION: ONLINE</span>
            <span>&bull;</span>
            <span>CRS: EPSG:4326 / 3857</span>
            <span>&bull;</span>
            <span className="text-emerald-700 font-semibold">ALL UNITS ACTIVE</span>
          </div>
        </div>
      </footer>
      )}

    </div>
  );
}
