import React from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import { getAssetUrl } from '../../utils/assetUrl';
import { createRipple } from '../common/MaterialRipple';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ThumbsUp,
  X,
  HardHat,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface IssueTrackerModalProps {
  issue: CivicIssue | null;
  onClose: () => void;
}

export const IssueTrackerModal: React.FC<IssueTrackerModalProps> = ({ issue, onClose }) => {
  const { upvoteReport, t } = useApp();

  if (!issue) return null;

  const statuses = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'] as const;
  const currentStatusIndex = statuses.indexOf(issue.status);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-50 text-mat-critical border-mat-critical/30';
      case 'High':
        return 'bg-orange-50 text-mat-high border-mat-high/30';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-mat-medium/40';
      default:
        return 'bg-blue-50 text-mat-low border-mat-low/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded shadow-elevation-8 w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[92vh]">
        {/* Top Header (Google Blue with Accent Strip) */}
        <div className="bg-[#4285F4] text-white relative flex-shrink-0">
          <div className="google-accent-bar" />
          <div className="p-4 sm:p-5 flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-medium bg-white/20 text-white px-2 py-0.5 rounded border border-white/30">
                  #{issue.ticketNumber}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                    issue.severity
                  )}`}
                >
                  {t.severities[issue.severity]}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-medium text-white mt-2 leading-snug">
                {issue.title}
              </h3>
              <p className="text-xs text-white/80 flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#FBBC05] mr-1 flex-shrink-0" />
                <span className="truncate">{issue.location.address}</span>
              </p>
            </div>

            <button
              onClick={(e) => {
                createRipple(e);
                onClose();
              }}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 ripple-surface"
              aria-label="Close tracking details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div className="bg-[#F8F9FA] border-b border-[#DADCE0] px-4 py-3.5 flex-shrink-0">
          <div className="flex items-center justify-between relative">
            {/* Background connecting bar */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
            
            {/* Active connecting bar (Google Blue) */}
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-[#4285F4] transition-all duration-500 -z-0"
              style={{
                width: `${(Math.max(0, currentStatusIndex) / (statuses.length - 1)) * 92}%`,
              }}
            />

            {statuses.map((step, idx) => {
              const isCompleted = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;

              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all shadow-elevation-1 ${
                      isCompleted
                        ? 'bg-[#4285F4] text-white ring-4 ring-[#4285F4]/15'
                        : 'bg-white text-gray-500 border border-gray-300'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium tracking-wide whitespace-nowrap uppercase ${
                      isCurrent
                        ? 'text-[#1A73E8] font-bold'
                        : isCompleted
                        ? 'text-[#202124]'
                        : 'text-[#5F6368]'
                    }`}
                  >
                    {t.statuses[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Before & After Photos (If Resolved) */}
          {issue.status === 'Resolved' && issue.afterPhotoUrl ? (
            <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-[#137333] font-medium text-xs">
                  <Sparkles className="w-4 h-4 text-[#34A853]" />
                  <span>Resolution Verification (Before & After)</span>
                </div>
                <span className="text-[10px] bg-[#34A853] text-white px-2 py-0.5 rounded font-medium uppercase tracking-wide">
                  Verified Cleaned
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Before Photo */}
                <div className="relative rounded overflow-hidden border border-gray-200 shadow-elevation-1 aspect-video">
                  <img
                    src={issue.photoUrl}
                    alt="Before resolution"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = getAssetUrl('issues/garbage.jpg');
                      if (target.src !== fallback) target.src = fallback;
                    }}
                  />
                  <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                    {t.beforePhoto}
                  </span>
                </div>

                {/* After Photo */}
                <div className="relative rounded overflow-hidden border-2 border-[#34A853] shadow-elevation-1 aspect-video">
                  <img
                    src={issue.afterPhotoUrl}
                    alt="After resolution"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = getAssetUrl('issues/garbage_after.jpg');
                      if (target.src !== fallback) target.src = fallback;
                    }}
                  />
                  <span className="absolute bottom-1 left-1 bg-[#34A853] text-white text-[9px] font-medium px-1.5 py-0.5 rounded shadow-sm">
                    {t.afterPhoto}
                  </span>
                </div>
              </div>

              {issue.resolutionRemarks && (
                <div className="mt-2.5 bg-white p-2.5 rounded border border-[#CEEAD6] text-xs text-[#202124]">
                  <span className="font-medium text-[#137333] block mb-0.5">{t.workerRemarks}:</span>
                  <p className="italic text-[11px] text-[#5F6368]">{issue.resolutionRemarks}</p>
                </div>
              )}
            </div>
          ) : (
            /* Single or Multi-Photo Evidence */
            <div className="space-y-2">
              <div className="relative rounded overflow-hidden border border-gray-200 shadow-elevation-1 aspect-video bg-gray-900">
                <img
                  src={issue.photoUrl}
                  alt={issue.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallback = getAssetUrl('issues/garbage.jpg');
                    if (target.src !== fallback) target.src = fallback;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded">
                  Report Photo • {issue.createdAt}
                </span>
              </div>

              {issue.photos && issue.photos.length > 1 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {issue.photos.map((p, idx) => (
                    <div key={idx} className="relative rounded overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                      <img src={p} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[8px] font-medium px-1 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description & Voice Transcription */}
          <div className="bg-[#FAFAFA] rounded p-3.5 border border-[#DADCE0] space-y-2">
            <h4 className="text-xs font-medium text-[#202124] uppercase tracking-wider">{t.describeIssue}</h4>
            <p className="text-xs text-[#202124] leading-relaxed">{issue.description}</p>

            {issue.voiceNoteTranscription && (
              <div className="bg-white p-2.5 rounded border border-[#DADCE0] flex items-start space-x-2">
                <Volume2 className="w-4 h-4 text-[#4285F4] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-medium text-[#5F6368] block uppercase tracking-wider">
                    Voice Note Audio Transcript
                  </span>
                  <p className="text-[11px] text-[#202124] italic">
                    "{issue.voiceNoteTranscription}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Worker Info (If available) */}
          {issue.assignedWorkerName && (
            <div className="bg-[#E8F0FE] border border-[#D2E3FC] rounded p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-medium">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase text-[#1A73E8] tracking-wider">
                    {t.assignedWorker}
                  </span>
                  <h5 className="text-xs font-medium text-[#202124]">{issue.assignedWorkerName}</h5>
                  <p className="text-[10px] text-[#5F6368]">Target SLA: ~{issue.targetResolutionHours || 4} hours</p>
                </div>
              </div>

              <span className="text-[11px] bg-white text-[#1A73E8] border border-[#D2E3FC] font-medium px-2 py-1 rounded">
                On Field
              </span>
            </div>
          )}

          {/* Timeline of Events */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[#202124] flex items-center uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#5F6368] mr-1.5" />
              {t.timeline}
            </h4>

            <div className="space-y-2 divide-y divide-gray-100 border border-[#DADCE0] rounded p-3 bg-white">
              {issue.timeline.map((evt) => (
                <div key={evt.id} className="pt-2 first:pt-0 flex items-start space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#4285F4] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#202124]">{evt.title}</span>
                      <span className="text-[10px] text-[#5F6368]">{evt.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#5F6368] leading-snug">{evt.description}</p>
                    <span className="text-[9px] text-[#5F6368] block mt-0.5">By {evt.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions: Upvote / Boost & Close */}
        <div className="p-3 bg-[#F8F9FA] border-t border-[#DADCE0] flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            onClick={(e) => {
              createRipple(e);
              upvoteReport(issue.id);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded font-medium text-xs uppercase tracking-wider transition-all ripple-surface min-h-touch ${
              issue.hasUpvoted
                ? 'bg-[#4285F4] text-white shadow-elevation-2'
                : 'bg-white border border-[#DADCE0] text-[#202124] hover:bg-[#F8F9FA] shadow-elevation-1'
            }`}
            aria-label={`Upvote issue. Currently ${issue.upvotes} votes`}
          >
            <ThumbsUp className={`w-4 h-4 ${issue.hasUpvoted ? 'fill-white' : ''}`} />
            <span>
              {issue.hasUpvoted ? t.upvoted : t.upvote} ({issue.upvotes})
            </span>
          </button>

          <button
            onClick={(e) => {
              createRipple(e);
              onClose();
            }}
            className="px-5 py-2.5 text-[#1A73E8] hover:bg-[#E8F0FE] rounded text-xs font-medium uppercase tracking-wider transition-colors ripple-surface min-h-touch"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
