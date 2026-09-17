import { IssueCategory, IssueSeverity, SlaStatus, CivicIssue } from '../types';

/**
 * Centralized SLA Rule Configuration
 * 
 * Rules:
 * - Street Light / Streetlight -> 48 hours
 * - Open Manhole / Drain -> 6 hours
 * - Normal Pothole -> 7 days (168 hours)
 * - Water Leak -> 12 hours
 * - Garbage -> 24 hours
 * - Road Damage -> 72 hours
 * - Default / Other -> 48 hours
 */
export const CATEGORY_SLA_HOURS: Record<string, number> = {
  Streetlight: 48,
  'Street Light': 48,
  'Open Manhole': 6,
  Drain: 6,
  Drainage: 6,
  Pothole: 168, // 7 days
  'Water Leak': 12,
  Garbage: 24,
  'Road Damage': 72,
  Other: 48,
};

/**
 * Warning thresholds (in hours)
 */
export const SLA_WARNING_THRESHOLDS = {
  DUE_SOON_HOURS: 24,
  URGENT_HOURS: 6,
};

/**
 * Hierarchy for automatic escalations
 */
export const ESCALATION_HIERARCHY = [
  'Field Officer / Assigned Worker',
  'Ward Department Officer',
  'Department Head / Zonal Engineer',
  'Municipal HQ / Admin Control Center',
];

/**
 * Reusable helper to get SLA duration for any issue category/severity
 */
export const getSlaDurationHours = (
  category: IssueCategory | string,
  severity?: IssueSeverity,
  title?: string
): number => {
  // Check if title or category mentions "Open Manhole"
  if (title && title.toLowerCase().includes('manhole')) {
    return CATEGORY_SLA_HOURS['Open Manhole'];
  }

  // Critical severity overrides for emergency public hazards
  if (severity === 'Critical') {
    if (category === 'Pothole') return 24; // Critical Pothole = 24h
    if (category === 'Drain' || category === 'Water Leak') return 6;
  }

  return CATEGORY_SLA_HOURS[category] || 48;
};

/**
 * Calculates deadline ISO string given start timestamp and duration in hours
 */
export const calculateSlaDeadline = (
  startedAtIso: string | number | Date,
  durationHours: number
): string => {
  const startDate = typeof startedAtIso === 'number' || startedAtIso instanceof Date
    ? new Date(startedAtIso)
    : new Date(startedAtIso);
  const deadlineDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
  return deadlineDate.toISOString();
};

/**
 * Computes current SLA status based on deadline and resolution state
 */
export const computeSlaStatus = (
  issue: Partial<CivicIssue>,
  nowMs: number = Date.now()
): SlaStatus => {
  // If complaint is resolved
  if (issue.status === 'Resolved') {
    if (issue.wasResolvedWithinSLA !== undefined) {
      return issue.wasResolvedWithinSLA ? 'RESOLVED_WITHIN_SLA' : 'RESOLVED_OVERDUE';
    }
    if (issue.resolvedAt && issue.slaDeadlineAt) {
      const resolvedTime = new Date(issue.resolvedAt).getTime();
      const deadlineTime = new Date(issue.slaDeadlineAt).getTime();
      return !isNaN(resolvedTime) && !isNaN(deadlineTime) && resolvedTime <= deadlineTime
        ? 'RESOLVED_WITHIN_SLA'
        : 'RESOLVED_OVERDUE';
    }
    return 'RESOLVED_WITHIN_SLA';
  }

  // If already escalated
  if (issue.slaStatus === 'ESCALATED' || issue.escalatedAt) {
    return 'ESCALATED';
  }

  // Check deadline
  if (!issue.slaDeadlineAt) {
    return 'ON_TRACK';
  }

  const deadlineMs = new Date(issue.slaDeadlineAt).getTime();
  if (isNaN(deadlineMs)) return 'ON_TRACK';

  const diffMs = deadlineMs - nowMs;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return 'OVERDUE';
  }

  if (diffHours <= SLA_WARNING_THRESHOLDS.URGENT_HOURS) {
    return 'URGENT';
  }

  if (diffHours <= SLA_WARNING_THRESHOLDS.DUE_SOON_HOURS) {
    return 'DUE_SOON';
  }

  return 'ON_TRACK';
};

/**
 * Formats countdown time into human readable string
 */
export const formatSlaRemainingTime = (
  deadlineIso: string,
  nowMs: number = Date.now()
): { text: string; isPassed: boolean; totalMs: number } => {
  const deadlineMs = new Date(deadlineIso).getTime();
  if (isNaN(deadlineMs)) {
    return { text: 'N/A', isPassed: false, totalMs: 0 };
  }

  const diffMs = deadlineMs - nowMs;

  if (diffMs <= 0) {
    const elapsedMs = Math.abs(diffMs);
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (elapsedHours > 24) {
      const days = Math.floor(elapsedHours / 24);
      return { text: `Overdue by ${days}d ${elapsedHours % 24}h`, isPassed: true, totalMs: diffMs };
    }
    return { text: `Overdue by ${elapsedHours}h ${elapsedMins}m`, isPassed: true, totalMs: diffMs };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return { text: `${days}d ${remHours}h remaining`, isPassed: false, totalMs: diffMs };
  }

  if (hours === 0) {
    return { text: `${mins}m ${seconds}s remaining`, isPassed: false, totalMs: diffMs };
  }

  return { text: `${hours}h ${mins}m remaining`, isPassed: false, totalMs: diffMs };
};

/**
 * Format timestamp into User's Local Time format (e.g., "18 Sep 2026, 10:00 AM")
 */
export const formatLocalDeadlineDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};
