import { CivicIssue, EscalationEvent, NotificationItem, TimelineEvent } from '../types';
import { computeSlaStatus, ESCALATION_HIERARCHY } from '../config/slaConfig';

export interface EscalationResult {
  updatedIssues: CivicIssue[];
  escalatedIssues: CivicIssue[];
  notifications: NotificationItem[];
}

/**
 * Idempotent automatic escalation engine.
 * Inspects all unresolved complaints and automatically escalates those that have passed their SLA deadline.
 */
export const evaluateAndEscalateOverdueIssues = (
  issues: CivicIssue[],
  nowMs: number = Date.now()
): EscalationResult => {
  const escalatedIssues: CivicIssue[] = [];
  const notifications: NotificationItem[] = [];

  const updatedIssues = issues.map((issue) => {
    // Skip if already resolved
    if (issue.status === 'Resolved') return issue;

    const currentSlaStatus = computeSlaStatus(issue, nowMs);

    // If deadline has passed AND issue is not already escalated
    if (
      (currentSlaStatus === 'OVERDUE' || (issue.slaDeadlineAt && new Date(issue.slaDeadlineAt).getTime() < nowMs)) &&
      issue.slaStatus !== 'ESCALATED'
    ) {
      const nowIso = new Date(nowMs).toISOString();
      const fromAuthority = issue.assignedWorkerName || 'Assigned Field Department';
      const toAuthority = ESCALATION_HIERARCHY[3]; // 'Municipal HQ / Admin Control Center'
      const escalationReason = `SLA resolution deadline (${issue.slaDurationHours || 48}h) exceeded without closure.`;

      const escalationEvent: EscalationEvent = {
        id: `esc-${issue.id}-${Date.now()}`,
        escalatedAt: nowIso,
        fromAuthority,
        toAuthority,
        reason: escalationReason,
        level: 3,
      };

      const escalationTimelineEvent: TimelineEvent = {
        id: `t-esc-${Date.now()}`,
        status: issue.status,
        timestamp: 'Just now',
        title: '⚠️ Automatically Escalated to Higher Authority',
        description: `Complaint #${issue.ticketNumber} exceeded SLA deadline. Escalated to ${toAuthority}.`,
        actor: 'CivicTrack SLA Escalation Engine',
      };

      const updatedIssue: CivicIssue = {
        ...issue,
        slaStatus: 'ESCALATED',
        escalatedAt: nowIso,
        escalatedFrom: fromAuthority,
        escalatedTo: toAuthority,
        escalationReason,
        escalationHistory: [...(issue.escalationHistory || []), escalationEvent],
        timeline: [...issue.timeline, escalationTimelineEvent],
        updatedAt: 'Just now',
      };

      escalatedIssues.push(updatedIssue);

      // Citizen Notification
      notifications.push({
        id: `notif-esc-cit-${issue.id}-${Date.now()}`,
        title: '⚠️ Complaint Escalated to Municipal HQ',
        message: `Your complaint #${issue.ticketNumber} exceeded its resolution deadline and has been automatically escalated to a higher authority.`,
        type: 'status',
        timestamp: 'Just now',
        read: false,
        issueId: issue.id,
      });

      // Municipal Admin Notification
      notifications.push({
        id: `notif-esc-admin-${issue.id}-${Date.now()}`,
        title: '🚨 SLA Breach Alert: Auto Escalation Triggered',
        message: `Complaint #${issue.ticketNumber} (${issue.category}) in ${issue.location.ward} breached SLA and was escalated to Municipal HQ.`,
        type: 'worker',
        timestamp: 'Just now',
        read: false,
        issueId: issue.id,
      });

      return updatedIssue;
    }

    // Update dynamically calculated status (DUE_SOON / URGENT / ON_TRACK) if not escalated
    // (issue.status is already guaranteed not to be 'Resolved' by the early return at the top)
    if (issue.slaStatus !== 'ESCALATED') {
      if (issue.slaStatus !== currentSlaStatus) {
        return {
          ...issue,
          slaStatus: currentSlaStatus,
        };
      }
    }

    return issue;
  });

  return {
    updatedIssues,
    escalatedIssues,
    notifications,
  };
};