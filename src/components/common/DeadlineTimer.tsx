import React, { useState, useEffect } from 'react';
import { CivicIssue } from '../../types';
import {
  computeSlaStatus,
  formatSlaRemainingTime,
  formatLocalDeadlineDate,
  getSlaDurationHours,
} from '../../config/slaConfig';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

interface DeadlineTimerProps {
  issue: CivicIssue;
  variant?: 'card' | 'compact' | 'badge';
  className?: string;
}

export const DeadlineTimer: React.FC<DeadlineTimerProps> = ({
  issue,
  variant = 'card',
  className = '',
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Auto-updating ticker timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 10000); // Ticks every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const slaDurationHours =
    issue.slaDurationHours ||
    getSlaDurationHours(issue.category, issue.severity, issue.title);

  // Compute fallback deadline if missing
  const startedAtIso =
    issue.slaStartedAt ||
    new Date(Date.now() - 2 * 3600000).toISOString();
  const deadlineIso =
    issue.slaDeadlineAt ||
    new Date(new Date(startedAtIso).getTime() + slaDurationHours * 3600000).toISOString();

  const currentSlaStatus = computeSlaStatus({ ...issue, slaDeadlineAt: deadlineIso }, nowMs);
  const remaining = formatSlaRemainingTime(deadlineIso, nowMs);

  // Calculate visual progress percentage (0% = start, 100% = deadline reached)
  const startMs = new Date(startedAtIso).getTime();
  const deadlineMs = new Date(deadlineIso).getTime();
  const totalMs = Math.max(1, deadlineMs - startMs);
  const elapsedMs = Math.max(0, nowMs - startMs);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  // Progress Bar styling based on SLA state
  const getProgressTrackColor = () => {
    if (issue.status === 'Resolved') return 'bg-[#34A853]';
    if (currentSlaStatus === 'ESCALATED' || remaining.isPassed) return 'bg-[#EA4335]';
    if (currentSlaStatus === 'URGENT') return 'bg-[#EA4335]';
    if (currentSlaStatus === 'DUE_SOON') return 'bg-[#FBBC05]';
    return 'bg-[#4285F4]';
  };

  const getStatusBadgeStyle = () => {
    if (issue.status === 'Resolved') {
      return 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]';
    }
    switch (currentSlaStatus) {
      case 'ESCALATED':
      case 'OVERDUE':
        return 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]';
      case 'URGENT':
        return 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF] animate-pulse';
      case 'DUE_SOON':
        return 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]';
      default:
        return 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]';
    }
  };

  const getStatusLabel = () => {
    if (issue.status === 'Resolved') {
      return issue.wasResolvedWithinSLA !== false
        ? '✓ Resolved Within SLA'
        : 'Resolved (Exceeded SLA)';
    }
    switch (currentSlaStatus) {
      case 'ESCALATED':
        return 'Automatically Escalated';
      case 'OVERDUE':
        return 'SLA Overdue';
      case 'URGENT':
        return 'Urgent (< 6h)';
      case 'DUE_SOON':
        return 'Due Soon';
      default:
        return 'In Progress';
    }
  };

  // -------------------------------------------------------------
  // VARIANT: COMPACT (For Feed Cards)
  // -------------------------------------------------------------
  if (variant === 'compact') {
    if (issue.status === 'Resolved') {
      return (
        <span
          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border bg-[#E6F4EA] text-[#137333] border-[#CEEAD6] ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
          Resolved within SLA
        </span>
      );
    }

    if (currentSlaStatus === 'ESCALATED' || remaining.isPassed) {
      return (
        <span
          className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF] ${className}`}
        >
          <AlertTriangle className="w-3 h-3 mr-1 shrink-0 animate-bounce" />
          {remaining.isPassed ? 'Deadline Passed • Escalated' : 'Escalated'}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${
          currentSlaStatus === 'DUE_SOON' || currentSlaStatus === 'URGENT'
            ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
            : 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]'
        } ${className}`}
      >
        <Clock className="w-3 h-3 mr-1 shrink-0" />
        ⏱ {remaining.text}
      </span>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: BADGE (Minimal Pill)
  // -------------------------------------------------------------
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider border ${getStatusBadgeStyle()} ${className}`}
      >
        {getStatusLabel()}
      </span>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: CARD (Full SLA Card for Details View)
  // -------------------------------------------------------------
  return (
    <div
      className={`bg-white rounded-xl border border-[#DADCE0] shadow-elevation-1 overflow-hidden font-sans ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-[#4285F4] text-white p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#FBBC05]" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
              DEADLINE TIMER / SLA
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-white">
              {issue.category} • {slaDurationHours} Hour SLA
            </h4>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border bg-white/20 text-white border-white/30`}
        >
          {slaDurationHours >= 24 ? `${Math.round(slaDurationHours / 24)} Day SLA` : `${slaDurationHours}h SLA`}
        </span>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4">
        {/* Countdown display */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
              Time Remaining
            </span>
            <span
              className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                issue.status === 'Resolved'
                  ? 'text-[#137333]'
                  : remaining.isPassed || currentSlaStatus === 'ESCALATED'
                  ? 'text-[#C5221F]'
                  : currentSlaStatus === 'DUE_SOON' || currentSlaStatus === 'URGENT'
                  ? 'text-[#B06000]'
                  : 'text-[#1A73E8]'
              }`}
            >
              {issue.status === 'Resolved' ? 'Completed' : remaining.text}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
              SLA Status
            </span>
            <span
              className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded border uppercase tracking-wider ${getStatusBadgeStyle()}`}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {/* Visual Progress Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
            <span>Resolution Window Progress</span>
            <span className="font-mono font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getProgressTrackColor()}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Deadline Date & Time */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DADCE0] text-xs text-[#5F6368]">
          <div>
            <span className="text-[10px] font-medium uppercase text-[#5F6368] block">
              Submitted (Local Time)
            </span>
            <span className="font-medium text-[#202124]">
              {formatLocalDeadlineDate(startedAtIso)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium uppercase text-[#5F6368] block">
              Deadline (Local Time)
            </span>
            <span className="font-semibold text-[#202124]">
              {formatLocalDeadlineDate(deadlineIso)}
            </span>
          </div>
        </div>

        {/* AUTOMATIC ESCALATION WARNING BANNER (If Deadline Passed & Unresolved) */}
        {(currentSlaStatus === 'ESCALATED' || (remaining.isPassed && issue.status !== 'Resolved')) && (
          <div className="bg-[#FCE8E6] border-2 border-[#C5221F] rounded-lg p-3.5 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 text-[#C5221F] font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-[#C5221F] shrink-0" />
              <span>⚠ DEADLINE PASSED — AUTOMATICALLY ESCALATED</span>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              This complaint exceeded its {slaDurationHours}-hour SLA resolution window and has been automatically escalated by the server-side monitoring engine.
            </p>
            <div className="bg-white/80 p-2.5 rounded border border-[#FAD2CF] space-y-1 text-xs text-[#202124]">
              <div className="flex justify-between">
                <span className="font-medium text-[#5F6368]">Escalated To:</span>
                <span className="font-bold text-[#C5221F]">
                  {issue.escalatedTo || 'Municipal HQ / Admin Control Center'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#5F6368]">Reason:</span>
                <span className="italic">{issue.escalationReason || 'SLA deadline exceeded'}</span>
              </div>
              {issue.escalatedAt && (
                <div className="flex justify-between">
                  <span className="font-medium text-[#5F6368]">Escalated At:</span>
                  <span>{formatLocalDeadlineDate(issue.escalatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlineTimer;
