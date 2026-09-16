import React from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { getAssetUrl } from '../../utils/assetUrl';
import { isListingOwner } from '../../utils/ownership';
import { auth } from '../../lib/firebase';
import { createRipple } from '../common/MaterialRipple';
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  HardHat,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Flag,
  Trash2,
  User,
} from 'lucide-react';

interface IssueDetailPanelProps {
  issue: CivicIssue | null;
  onClose: () => void;
  onOpenFullModal?: () => void;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({
  issue,
  onClose,
  onOpenFullModal,
}) => {
  const { upvoteReport, flagReport, deleteReport, currentUser, role, t } = useApp();

  if (!issue) return null;

  const statuses = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'] as const;
  const currentStatusIndex = statuses.indexOf(issue.status);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
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
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Detail Panel Container */}
      <aside
        className="fixed top-14 sm:top-16 right-0 bottom-0 z-40 lg:z-30 w-full sm:w-[420px] xl:w-[460px] bg-white border-l border-[#DADCE0] shadow-elevation-4 lg:shadow-elevation-2 flex flex-col overflow-hidden transition-all duration-300"
        aria-label="Issue Details Reading Pane"
      >
      {/* 1. Header with Google Blue and Accent Bar */}
      <div className="bg-[#4285F4] text-white flex-shrink-0 relative">
        <div className="google-accent-bar" />
        <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-medium bg-white/20 text-white px-2 py-0.5 rounded border border-white/30">
                #{issue.ticketNumber}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                  issue.severity
                )}`}
              >
                {t.severities[issue.severity] || issue.severity}
              </span>
            </div>
            <h3 className="text-base font-medium text-white mt-1.5 leading-snug line-clamp-2">
              {issue.title}
            </h3>
            <p className="text-xs text-white/80 flex items-center mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#FBBC05] mr-1 shrink-0" />
              <span className="truncate">{issue.location.ward}</span>
            </p>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {onOpenFullModal && (
              <button
                onClick={(e) => {
                  createRipple(e);
                  onOpenFullModal();
                }}
                className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Open in Full Dialog"
                aria-label="Open in full dialog"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                createRipple(e);
                onClose();
              }}
              className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Close reading pane"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Horizontal Status Stepper */}
        <div className="bg-[#F8F9FA] rounded border border-[#DADCE0] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#5F6368] mb-3">
            <span>Progress Status</span>
            <span
              className={`px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-semibold border ${getStatusBadge(
                issue.status
              )}`}
            >
              {t.statuses[issue.status] || issue.status}
            </span>
          </div>

          <div className="flex items-center justify-between relative px-2">
            {/* Background line */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
            {/* Active line */}
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-[#4285F4] transition-all duration-500 -z-0"
              style={{
                width: `${(Math.max(0, currentStatusIndex) / (statuses.length - 1)) * 88}%`,
              }}
            />

            {statuses.map((step, idx) => {
              const isCompleted = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              return (
                <div key={step} className="flex flex-col items-center z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-[#4285F4] text-white shadow-xs'
                        : 'bg-white text-gray-400 border border-gray-300'
                    } ${isCurrent ? 'ring-2 ring-[#4285F4]/30 scale-110' : ''}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium text-center ${
                      isCurrent ? 'text-[#4285F4] font-bold' : isCompleted ? 'text-[#202124]' : 'text-[#5F6368]'
                    }`}
                  >
                    {step === 'Acknowledged' ? 'Ack' : step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Evidence Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-[#5F6368] block">
            Visual Proof & Photographic Evidence
          </label>
          {issue.status === 'Resolved' && issue.afterPhotoUrl ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#C5221F] bg-[#FCE8E6] px-1.5 py-0.2 rounded inline-block">
                  BEFORE REPORTED
                </span>
                <div className="aspect-square rounded overflow-hidden border border-[#DADCE0] bg-gray-100">
                  <img
                    src={issue.photoUrl}
                    alt="Before Issue"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getAssetUrl('issues/pothole.jpg');
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#137333] bg-[#E6F4EA] px-1.5 py-0.2 rounded inline-block">
                  AFTER RESOLVED ✓
                </span>
                <div className="aspect-square rounded overflow-hidden border border-[#34A853]/40 bg-gray-100 ring-1 ring-[#34A853]">
                  <img
                    src={issue.afterPhotoUrl}
                    alt="After Resolution Proof"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full rounded overflow-hidden border border-[#DADCE0] bg-gray-100">
              <img
                src={issue.photoUrl}
                alt={issue.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getAssetUrl('issues/pothole.jpg');
                }}
              />
            </div>
          )}
        </div>

        {/* Description & Category */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368]">
              Description
            </span>
            <span className="text-xs font-medium text-[#4285F4] bg-[#E8F0FE] border border-[#D2E3FC] px-2 py-0.5 rounded">
              {t.categories[issue.category] || issue.category}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#202124] bg-[#F8F9FA] p-3 rounded border border-[#DADCE0] leading-relaxed">
            {issue.description || 'Civic hazard reported on public roadway.'}
          </p>
        </div>

        {/* Location & BBMP Ward Info */}
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368] block">
            Location & GPS Verification
          </span>
          <div className="p-3 bg-white rounded border border-[#DADCE0] space-y-2 text-xs">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-[#4285F4] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#202124]">{issue.location.address}</p>
                <p className="text-[11px] text-[#5F6368] mt-0.5">
                  Ward: {issue.location.ward} • {issue.location.city}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-[#DADCE0]/60 flex items-center justify-between text-[11px] text-[#5F6368]">
              <span>Coordinates:</span>
              <span className="font-mono text-[#202124]">
                {issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Officer / Resolution Notes */}
        {issue.assignedWorkerName && (
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#5F6368] block">
              Assigned Field Operations
            </span>
            <div className="p-3 bg-[#E8F0FE]/40 rounded border border-[#D2E3FC] flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-[#4285F4] text-white flex items-center justify-center font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-medium text-[#202124] truncate">{issue.assignedWorkerName}</p>
                <p className="text-[11px] text-[#5F6368]">BBMP Civic Operations Team</p>
              </div>
              {issue.targetResolutionHours && (
                <div className="text-right">
                  <span className="text-[10px] text-[#5F6368] block">SLA Target</span>
                  <span className="text-xs font-bold text-[#1A73E8]">{issue.targetResolutionHours}h</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Meta */}
        <div className="p-3 rounded border border-[#DADCE0] bg-[#F8F9FA] space-y-1.5 text-xs text-[#5F6368]">
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-[#4285F4]" />
              Reported By:
            </span>
            <span className="font-medium text-[#202124]">{issue.citizenName || 'Citizen Hero'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Reported Date:
            </span>
            <span className="font-medium text-[#202124]">{issue.createdAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Last Updated:
            </span>
            <span className="font-medium text-[#202124]">{issue.updatedAt}</span>
          </div>
        </div>
      </div>

      {/* 3. Footer with Upvote Action and Flag Spam */}
      <div className="p-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              createRipple(e, 'rgba(66, 133, 244, 0.2)');
              upvoteReport(issue.id);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-medium transition-all ripple-surface ${
              issue.hasUpvoted
                ? 'bg-[#E8F0FE] text-[#1A73E8] border border-[#4285F4]'
                : 'bg-white text-[#202124] border border-[#DADCE0] hover:bg-gray-50'
            }`}
            aria-label="Upvote report"
          >
            <ThumbsUp className={`w-4 h-4 ${issue.hasUpvoted ? 'fill-[#1A73E8] text-[#1A73E8]' : ''}`} />
            <span>{issue.hasUpvoted ? 'Upvoted' : 'Upvote Issue'}</span>
            <span className="bg-gray-200 text-[#202124] text-[11px] font-bold px-1.5 py-0.2 rounded ml-1">
              {issue.upvotes}
            </span>
          </button>

          {isListingOwner(issue, currentUser, auth?.currentUser?.uid) || role === 'municipal' ? (
            <button
              onClick={() => {
                const message =
                  issue.status !== 'Submitted'
                    ? `This issue is already being worked on (${issue.status}) — are you sure you want to delete this report? This cannot be undone.`
                    : "Delete this report? This can't be undone.";
                if (window.confirm(message)) {
                  deleteReport(issue.id);
                  onClose();
                }
              }}
              title="Delete your report"
              className="p-2 rounded text-[#5F6368] hover:text-[#EA4335] hover:bg-rose-50 border border-[#DADCE0] hover:border-rose-200 transition-colors"
              aria-label="Delete report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Report this listing as spam or inappropriate? It will be hidden pending review.')) {
                  flagReport(issue.id);
                  onClose();
                }
              }}
              title="Report listing as spam"
              className="p-2 rounded text-[#5F6368] hover:text-[#EA4335] hover:bg-rose-50 border border-[#DADCE0] hover:border-rose-200 transition-colors"
              aria-label="Report listing as spam"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>

        <span className="text-[11px] text-[#5F6368]">
          {issue.upvotes > 1 ? `${issue.upvotes} citizens supported` : '1 citizen supported'}
        </span>
      </div>
    </aside>
  </>
);
};

export default IssueDetailPanel;
