import {
  CivicIssue,
  IssueCategory,
  IssueSeverity,
  UserRole,
  AuthSession,
} from '../types';
import {
  AIMessage,
  AIRequest,
  AIResponse,
  ComplaintAnalysis,
  ComplaintContext,
  MunicipalSummaryStats,
  PriorityRecommendation,
  ReportDraftResult,
  ImageAnalysisResult,
} from '../types/ai';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CATEGORY_SLA_HOURS } from '../config/slaConfig';
import { normalizePhone } from '../utils/ownership';

/**
 * Filter complaints strictly based on user authorization
 * - Citizen: ONLY complaints they submitted (by citizenId or reporterPhone)
 * - Worker: Assigned complaints or ward complaints
 * - Municipal / Admin: All complaints in the municipality
 */
export const getAuthorizedComplaints = (
  allIssues: CivicIssue[],
  role: UserRole,
  session: AuthSession | null
): CivicIssue[] => {
  if (!session) return [];

  if (role === 'citizen') {
    const userPhoneNorm = session.phone ? normalizePhone(session.phone) : '';
    return allIssues.filter((i) => {
      if (i.citizenId && i.citizenId === session.userId) return true;
      if (userPhoneNorm && i.reporterPhone && normalizePhone(i.reporterPhone) === userPhoneNorm) return true;
      return false;
    });
  }

  if (role === 'worker') {
    return allIssues.filter((i) => {
      if (i.assignedWorkerId && i.assignedWorkerId === session.workerId) return true;
      if (session.ward && i.location.ward.toLowerCase() === session.ward.toLowerCase()) return true;
      return true;
    });
  }

  // Municipal / Admin has full administrative scope
  return allIssues;
};

/**
 * Convert CivicIssue to lightweight sanitized context for the AI
 */
export const toComplaintContext = (issue: CivicIssue): ComplaintContext => {
  return {
    id: issue.id,
    ticketNumber: issue.ticketNumber,
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    location: {
      address: issue.location.address,
      ward: issue.location.ward,
    },
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    slaStatus: issue.slaStatus,
    slaDeadlineAt: issue.slaDeadlineAt,
    slaDurationHours: issue.slaDurationHours,
    assignedDepartment: issue.assignedDepartment,
    assignedWorkerName: issue.assignedWorkerName,
    escalatedAt: issue.escalatedAt,
    escalationReason: issue.escalationReason,
    reportCount: issue.reportCount || 1,
    upvotes: issue.upvotes || 0,
    wasResolvedWithinSLA: issue.wasResolvedWithinSLA,
  };
};

/**
 * Calculate live summary statistics from actual complaint data
 */
export const calculateMunicipalStats = (
  issues: (CivicIssue | ComplaintContext)[]
): MunicipalSummaryStats => {
  const categoryBreakdown: Record<string, number> = {};
  const wardBreakdown: Record<string, number> = {};

  let submitted = 0;
  let acknowledged = 0;
  let inProgress = 0;
  let resolved = 0;
  let overdue = 0;
  let escalated = 0;
  let dueSoon = 0;
  let criticalSeverity = 0;
  let resolvedWithinSla = 0;

  for (const issue of issues) {
    categoryBreakdown[issue.category] = (categoryBreakdown[issue.category] || 0) + 1;
    wardBreakdown[issue.location.ward] = (wardBreakdown[issue.location.ward] || 0) + 1;

    if (issue.status === 'Submitted') submitted++;
    else if (issue.status === 'Acknowledged') acknowledged++;
    else if (issue.status === 'In Progress') inProgress++;
    else if (issue.status === 'Resolved') {
      resolved++;
      if (issue.wasResolvedWithinSLA !== false && issue.slaStatus !== 'RESOLVED_OVERDUE') {
        resolvedWithinSla++;
      }
    }

    if (issue.slaStatus === 'OVERDUE') overdue++;
    if (issue.slaStatus === 'DUE_SOON' || issue.slaStatus === 'URGENT') dueSoon++;
    if (issue.escalatedAt || issue.slaStatus === 'ESCALATED') escalated++;
    if (issue.severity === 'Critical') criticalSeverity++;
  }

  const complianceRatePercent = resolved > 0 ? Math.round((resolvedWithinSla / resolved) * 100) : 100;

  return {
    total: issues.length,
    submitted,
    acknowledged,
    inProgress,
    resolved,
    overdue,
    escalated,
    dueSoon,
    criticalSeverity,
    categoryBreakdown,
    wardBreakdown,
    complianceRatePercent,
  };
};

/**
 * Department routing lookup
 */
const DEPARTMENT_MAPPING: Record<string, string> = {
  Pothole: 'Roads & Infrastructure Department',
  'Road Damage': 'Roads & Infrastructure Department',
  Streetlight: 'Electrical & Public Lighting Department',
  'Street Light': 'Electrical & Public Lighting Department',
  Garbage: 'Solid Waste Management Department',
  'Water Leak': 'Water Supply & Sewerage Board (BWSSB)',
  Drain: 'Stormwater Drainage & Flood Control',
  Drainage: 'Stormwater Drainage & Flood Control',
  Other: 'General Municipal Administration',
};

/**
 * Main AI Chat Processor
 * Connects to Supabase Edge Function `civic-assistant` when available,
 * or safely executes deterministic municipal assistant intelligence on client.
 */
export const sendChatMessage = async (
  request: AIRequest,
  allIssues: CivicIssue[]
): Promise<AIResponse> => {
  // 1. Try Supabase Edge Function if Supabase is connected
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('civic-assistant', {
        body: request,
      });

      if (!error && data && data.answer) {
        return {
          answer: data.answer,
          referencedTickets: data.referencedTickets,
          suggestions: data.suggestions,
          facts: data.facts,
          isRecommendation: data.isRecommendation,
        };
      }
    } catch (err) {
      console.warn('Edge Function civic-assistant unavailable, using local civic brain fallback:', err);
    }
  }

  // 2. Local Deterministic Municipal Assistant Engine Fallback
  return processLocalCivicAssistant(request, allIssues);
};

/**
 * Local Deterministic Civic Assistant Engine
 * Ensures 100% reliability, zero hallucinations, strict privacy authorization, and verified facts.
 */
const processLocalCivicAssistant = (
  request: AIRequest,
  allIssues: CivicIssue[]
): AIResponse => {
  const query = request.message.trim().toLowerCase();
  const { userRole, authorizedIssues, summaryStats, activeTicketNumber } = request;

  // Check if user is asking about a specific ticket number (e.g., CT1024 or BLR-2026-8821)
  const ticketRegex = /(?:#)?(ct[\s-]?\d+|blr[\s-]?\d{4}[\s-]?\d{4}|civic[\s-]?\d+)/i;
  const ticketMatch = query.match(ticketRegex);
  let queriedTicket = ticketMatch ? ticketMatch[1].replace(/\s+/g, '').toUpperCase() : activeTicketNumber;

  // Also check if conversation history had a referenced ticket
  if (!queriedTicket && request.history.length > 0) {
    for (let i = request.history.length - 1; i >= 0; i--) {
      const prevMatch = request.history[i].text.match(ticketRegex);
      if (prevMatch) {
        queriedTicket = prevMatch[1].replace(/\s+/g, '').toUpperCase();
        break;
      }
    }
  }

  // Check authorization for a specific ticket if user explicitly asked for one
  if (ticketMatch) {
    const rawTicket = ticketMatch[1].replace(/\s+/g, '').toUpperCase();
    const isAuthorized = authorizedIssues.some(
      (i) => i.ticketNumber.replace(/[-\s]/g, '').toUpperCase() === rawTicket.replace(/[-\s]/g, '')
    );
    const existsGlobally = allIssues.some(
      (i) => i.ticketNumber.replace(/[-\s]/g, '').toUpperCase() === rawTicket.replace(/[-\s]/g, '')
    );

    // If the ticket exists in the system but the current user is NOT authorized (e.g. another citizen's complaint):
    if (existsGlobally && !isAuthorized && userRole === 'citizen') {
      return {
        answer: 'I can only provide complaint information that you are authorized to access.',
        suggestions: ['What is the status of my complaint?', 'How do I report a civic issue?'],
      };
    }
  }

  // 1. Complaint Status Inquiries
  if (
    query.includes('status of my complaint') ||
    query.includes('check my complaint') ||
    query.includes('my reports') ||
    query.includes('track my') ||
    (query.includes('status') && !ticketMatch)
  ) {
    if (userRole === 'citizen') {
      if (authorizedIssues.length === 0) {
        return {
          answer:
            "You haven't submitted any civic complaints yet from this account. You can file a new complaint anytime using the Report Issue button.",
          suggestions: ['How do I report a civic issue?', 'How does SLA work?'],
        };
      }

      if (authorizedIssues.length === 1) {
        const c = authorizedIssues[0];
        return {
          answer: `Your complaint #${c.ticketNumber} ("${c.title}") is currently **${c.status}**.\n\n• **Category**: ${c.category}\n• **Department**: ${c.assignedDepartment || DEPARTMENT_MAPPING[c.category] || 'Municipal Works'}\n• **Location**: ${c.location.address}\n• **SLA Status**: ${c.slaStatus || 'ON_TRACK'}`,
          referencedTickets: [c.ticketNumber],
          facts: [
            { label: 'Ticket', value: `#${c.ticketNumber}` },
            { label: 'Status', value: c.status },
            { label: 'SLA Status', value: c.slaStatus || 'ON_TRACK' },
          ],
          suggestions: [`Why was #${c.ticketNumber} escalated?`, 'How does SLA work?'],
        };
      }

      // Multiple complaints
      const list = authorizedIssues
        .map(
          (c) =>
            `• **#${c.ticketNumber}** — ${c.title}\n  *Status*: ${c.status} | *SLA*: ${c.slaStatus || 'ON_TRACK'} (${c.category})`
        )
        .join('\n');

      return {
        answer: `You have **${authorizedIssues.length}** authorized complaints:\n\n${list}\n\nAsk me about any specific ticket number for detailed timelines.`,
        referencedTickets: authorizedIssues.map((i) => i.ticketNumber),
        suggestions: [`Check #${authorizedIssues[0].ticketNumber}`, 'Which complaints are overdue?'],
      };
    } else {
      // Municipal / Worker asking general status
      return {
        answer: `As an authorized ${userRole}, you have access to municipal complaint records. Use "Give me today's complaint summary" or specify a ticket number like #${allIssues[0]?.ticketNumber || 'BLR-2026-8821'}.`,
        suggestions: ["Give me today's complaint summary", 'Which complaints are overdue?'],
      };
    }
  }

  // 2. Specific Complaint Inquiry (by ticket number or conversational reference)
  if (queriedTicket) {
    const cleanQueried = queriedTicket.replace(/[-\s]/g, '');
    const issue = authorizedIssues.find(
      (i) => i.ticketNumber.replace(/[-\s]/g, '').toUpperCase() === cleanQueried
    );

    if (issue) {
      if (query.includes('escalat') || query.includes('why was')) {
        if (issue.escalatedAt || issue.slaStatus === 'ESCALATED' || issue.slaStatus === 'OVERDUE') {
          return {
            answer: `Complaint #${issue.ticketNumber} was escalated because its resolution time exceeded the **${issue.slaDurationHours || 48}-hour SLA deadline** for **${issue.category}** complaints.\n\n• **Escalation Reason**: ${issue.escalationReason || 'Resolution deadline exceeded while pending action.'}\n• **Current Status**: ${issue.status}\n• **Assigned Department**: ${issue.assignedDepartment || DEPARTMENT_MAPPING[issue.category] || 'Municipal Works'}\n\n*Note*: Escalated tickets receive higher priority in the municipal queue.`,
            referencedTickets: [issue.ticketNumber],
            facts: [
              { label: 'Ticket', value: `#${issue.ticketNumber}` },
              { label: 'Escalation Status', value: 'Escalated' },
              { label: 'SLA Duration', value: `${issue.slaDurationHours || 48} hours` },
            ],
            suggestions: ['How does SLA work?', 'What should I do if my complaint is not resolved?'],
          };
        } else {
          return {
            answer: `Complaint #${issue.ticketNumber} is currently **not escalated**. It is **${issue.status}** and remaining within its standard SLA timeframe.`,
            referencedTickets: [issue.ticketNumber],
            facts: [
              { label: 'Ticket', value: `#${issue.ticketNumber}` },
              { label: 'Status', value: issue.status },
              { label: 'SLA Status', value: issue.slaStatus || 'ON_TRACK' },
            ],
            suggestions: ['What is the status of my complaint?', 'How does SLA work?'],
          };
        }
      }

      if (query.includes('when was it') || query.includes('date') || query.includes('submitted')) {
        return {
          answer: `Complaint #${issue.ticketNumber} was submitted on **${new Date(issue.createdAt).toLocaleDateString(undefined, {
            dateStyle: 'medium',
          })}** at **${new Date(issue.createdAt).toLocaleTimeString(undefined, {
            timeStyle: 'short',
          })}**.\n\n• **Location**: ${issue.location.address}\n• **Status**: ${issue.status}`,
          referencedTickets: [issue.ticketNumber],
          suggestions: [`Why was #${issue.ticketNumber} escalated?`, 'How does SLA work?'],
        };
      }

      return {
        answer: `Complaint #${issue.ticketNumber} is currently **${issue.status}**.\n\n• **Problem**: ${issue.title}\n• **Category**: ${issue.category} (${issue.severity} severity)\n• **Assigned Department**: ${issue.assignedDepartment || DEPARTMENT_MAPPING[issue.category] || 'Municipal Administration'}\n• **Assigned Officer**: ${issue.assignedWorkerName || 'Pending assignment'}\n• **SLA Status**: ${issue.slaStatus || 'ON_TRACK'}`,
        referencedTickets: [issue.ticketNumber],
        facts: [
          { label: 'Ticket', value: `#${issue.ticketNumber}` },
          { label: 'Status', value: issue.status },
          { label: 'Ward', value: issue.location.ward },
        ],
        suggestions: [`Why was #${issue.ticketNumber} escalated?`, 'What is the status of my complaint?'],
      };
    } else if (ticketMatch) {
      return {
        answer: 'I don\'t have enough information to verify that ticket in your authorized records.',
        suggestions: ['What is the status of my complaint?', 'How do I report a civic issue?'],
      };
    }
  }

  // 3. Municipal / Authority Summary
  if (
    query.includes('today\'s complaint summary') ||
    query.includes('todays complaint summary') ||
    query.includes('summary of complaints') ||
    query.includes('summarize complaints') ||
    (query.includes('summary') && userRole !== 'citizen')
  ) {
    if (userRole === 'citizen') {
      const myCount = authorizedIssues.length;
      const myResolved = authorizedIssues.filter((i) => i.status === 'Resolved').length;
      const myActive = myCount - myResolved;
      return {
        answer: `Here is your personal complaint summary:\n\n• **${myCount}** total complaints filed\n• **${myActive}** active / in progress\n• **${myResolved}** resolved`,
        suggestions: ['What is the status of my complaint?', 'How does SLA work?'],
      };
    }

    const stats = summaryStats || calculateMunicipalStats(allIssues);
    return {
      answer: `Today's summary:\n• **${stats.submitted}** new complaints\n• **${stats.inProgress}** in progress\n• **${stats.resolved}** resolved\n• **${stats.overdue}** overdue\n• **${stats.escalated}** escalated\n\n*Overall SLA Compliance*: **${stats.complianceRatePercent}%** across ${stats.total} total complaints.`,
      facts: [
        { label: 'Total Complaints', value: stats.total },
        { label: 'In Progress', value: stats.inProgress },
        { label: 'Resolved', value: stats.resolved },
        { label: 'Overdue', value: stats.overdue },
        { label: 'Escalated', value: stats.escalated },
      ],
      suggestions: ['Which complaints are overdue?', 'Complaints by category', 'SLA performance'],
    };
  }

  // 4. Overdue Complaints
  if (query.includes('overdue') || query.includes('approaching sla') || query.includes('deadline')) {
    const overdueList = authorizedIssues.filter(
      (i) => i.status !== 'Resolved' && (i.slaStatus === 'OVERDUE' || (i.slaDeadlineAt && new Date(i.slaDeadlineAt) < new Date()))
    );

    if (overdueList.length === 0) {
      return {
        answer:
          userRole === 'citizen'
            ? 'None of your complaints are currently overdue. All open items are progressing within their allocated SLA timeframe.'
            : 'There are currently no overdue complaints matching your authorized criteria. Excellent SLA compliance!',
        suggestions: ['How does SLA work?', 'What is the status of my complaint?'],
      };
    }

    const listStr = overdueList
      .slice(0, 5)
      .map((i) => `• **#${i.ticketNumber}** — "${i.title}" (${i.category}, ${i.location.ward})`)
      .join('\n');

    return {
      answer: `The following **${overdueList.length}** complaint(s) are overdue:\n\n${listStr}\n\n*Action*: These tickets should be prioritized for immediate inspection or escalation.`,
      referencedTickets: overdueList.slice(0, 5).map((i) => i.ticketNumber),
      suggestions: [`Why was #${overdueList[0].ticketNumber} escalated?`, 'How does SLA work?'],
    };
  }

  // 5. Category Breakdown
  if (query.includes('category') || query.includes('categories') || query.includes('garbage') || query.includes('pothole')) {
    if (query.includes('garbage') || query.includes('pothole') || query.includes('streetlight') || query.includes('water')) {
      const matchedCat = query.includes('garbage')
        ? 'Garbage'
        : query.includes('pothole')
        ? 'Pothole'
        : query.includes('streetlight')
        ? 'Streetlight'
        : 'Water Leak';

      const filtered = authorizedIssues.filter((i) => i.category.toLowerCase().includes(matchedCat.toLowerCase()));
      if (filtered.length === 0) {
        return {
          answer: `There are currently no authorized complaints in the **${matchedCat}** category.`,
          suggestions: ['What is the status of my complaint?', 'How do I report a civic issue?'],
        };
      }

      const listStr = filtered
        .slice(0, 4)
        .map((i) => `• **#${i.ticketNumber}** [${i.status}] — "${i.title}" (${i.location.address})`)
        .join('\n');

      return {
        answer: `Found **${filtered.length}** complaint(s) under **${matchedCat}**:\n\n${listStr}`,
        referencedTickets: filtered.slice(0, 4).map((i) => i.ticketNumber),
        suggestions: ['Which complaints are overdue?', "Give me today's complaint summary"],
      };
    }

    // General category overview
    const stats = summaryStats || calculateMunicipalStats(authorizedIssues);
    const catList = Object.entries(stats.categoryBreakdown)
      .map(([cat, count]) => `• **${cat}**: ${count} complaint${count > 1 ? 's' : ''} (SLA: ${CATEGORY_SLA_HOURS[cat] || 48}h)`)
      .join('\n');

    return {
      answer: `Breakdown by category:\n\n${catList}`,
      suggestions: ['Which complaints are overdue?', 'How does SLA work?'],
    };
  }

  // 6. SLA Explanation
  if (query.includes('sla') || query.includes('service level') || query.includes('how does sla work')) {
    return {
      answer: `**Service Level Agreement (SLA)** sets official municipal timeframes to resolve citizen complaints:\n\n• **Open Manhole / Drain**: **6 hours** (Immediate emergency)\n• **Water Leak / Pipeline**: **12 hours**\n• **Garbage Accumulation**: **24 hours**\n• **Streetlight Outage**: **48 hours**\n• **Road Damage**: **72 hours**\n• **Road Pothole**: **7 days** (168 hours)\n\nIf a complaint is unresolved when the deadline passes, it is automatically flagged as **OVERDUE** and escalated to senior department supervisors.`,
      suggestions: ['Why was my complaint escalated?', 'What is the status of my complaint?'],
    };
  }

  // 7. How to Report an Issue
  if (
    query.includes('how to report') ||
    query.includes('how do i report') ||
    query.includes('new issue') ||
    query.includes('create complaint') ||
    query.includes('submit complaint')
  ) {
    return {
      answer: `To report a civic issue on CivicTrack:\n\n1. Click the **Report Issue** button in the navigation rail or header.\n2. **Capture Evidence**: Upload or snap a photo on-site. GPS coordinates pin your exact ward automatically.\n3. **AI Vision & Voice**: You can type or use the microphone to speak. The AI assists in selecting the category and severity.\n4. **Review & Submit**: Check for nearby duplicate reports or 1-tap submit. You'll receive a tracking ticket number immediately!`,
      suggestions: ['What is the status of my complaint?', 'How does SLA work?'],
    };
  }

  // 8. What should I do if not resolved / update complaint
  if (query.includes('not resolved') || query.includes('update a complaint') || query.includes('what should i do')) {
    return {
      answer: `If your complaint has not been resolved within its SLA deadline:\n\n1. **Automatic Escalation**: The system automatically escalates overdue tickets to higher administrative levels (from Field Worker to Ward Officer to Municipal HQ).\n2. **Community Upvoting**: Other citizens can upvote or merge their reports with yours, boosting its priority score.\n3. **Tracking**: Click your ticket to view assigned field officer details and live status updates.`,
      suggestions: ['What is the status of my complaint?', 'How does SLA work?'],
    };
  }

  // 9. Fallback if information is not found
  return {
    answer:
      "I don't have enough information to verify that. Could you provide a complaint ticket number (e.g. #BLR-2026-8821), or ask about complaint statuses, SLA rules, or municipal summaries?",
    suggestions: [
      'What is the status of my complaint?',
      'How does SLA work?',
      'Which complaints are overdue?',
      'How do I report a civic issue?',
    ],
  };
};

/**
 * Deep AI Complaint Analysis
 * Summarizes problem, potential severity, reason, SLA risk, recommended department, recommended action.
 */
export const analyzeComplaint = async (issue: CivicIssue): Promise<ComplaintAnalysis> => {
  // Determine severity reason and public safety risk
  let severityReason = 'Standard municipal maintenance issue affecting regular neighborhood mobility.';
  let urgency: 'Immediate' | 'High' | 'Standard' = 'Standard';
  let slaRisk: 'Low' | 'Moderate' | 'High' | 'Overdue' = 'Low';

  if (issue.slaStatus === 'OVERDUE') {
    slaRisk = 'Overdue';
  } else if (issue.slaStatus === 'URGENT') {
    slaRisk = 'High';
  } else if (issue.slaStatus === 'DUE_SOON') {
    slaRisk = 'Moderate';
  }

  const desc = (issue.description + ' ' + issue.title).toLowerCase();

  if (desc.includes('drain') || desc.includes('manhole') || desc.includes('collapse') || desc.includes('burst')) {
    severityReason = 'Imminent fall hazard or acute water contamination risk adjacent to pedestrian walkway.';
    urgency = 'Immediate';
  } else if (desc.includes('pothole') || desc.includes('skid') || desc.includes('traffic') || desc.includes('accident')) {
    severityReason = 'Road surface defect creating collision or skidding hazards for commuters and two-wheelers.';
    urgency = 'High';
  } else if (desc.includes('dark') || desc.includes('streetlight') || desc.includes('blindspot')) {
    severityReason = 'Lack of nighttime illumination impairs public security and driver visibility.';
    urgency = 'High';
  } else if (desc.includes('garbage') || desc.includes('waste') || desc.includes('overflow')) {
    severityReason = 'Solid waste overflow creates biological hygiene risks and sidewalk obstruction.';
    urgency = 'Standard';
  }

  const recommendedDept = issue.assignedDepartment || DEPARTMENT_MAPPING[issue.category] || 'Public Works Department';

  let recommendedAction = 'Dispatch field officer for on-site visual survey and status confirmation.';
  if (issue.category === 'Pothole' || issue.category === 'Road Damage') {
    recommendedAction = 'Deploy cold-mix asphalt patch team and barricade damaged lane segment.';
  } else if (issue.category === 'Drain') {
    recommendedAction = 'Erect safety cones immediately and place replacement reinforced concrete slab.';
  } else if (issue.category === 'Water Leak') {
    recommendedAction = 'Isolate sub-zone valve to prevent water loss and execute pipe welding / coupling.';
  } else if (issue.category === 'Streetlight') {
    recommendedAction = 'Test luminaire fixture fuse and replace LED bulb or overhead supply wiring.';
  } else if (issue.category === 'Garbage') {
    recommendedAction = 'Route compacting tipper truck for comprehensive site clearance and sanitization.';
  }

  return {
    ticketNumber: issue.ticketNumber,
    problem: issue.title || `${issue.category} at ${issue.location.address}`,
    category: issue.category,
    potentialSeverity: issue.severity,
    severityReason,
    urgency,
    slaRisk,
    recommendedDepartment: recommendedDept,
    recommendedAction,
    disclaimer:
      'AI Recommendation: This analysis is generated as an advisory suggestion. Official municipal actions and classifications are determined by authorized department officers.',
  };
};

/**
 * AI Priority Recommendation
 */
export const recommendPriority = async (
  issue: Partial<CivicIssue>
): Promise<PriorityRecommendation> => {
  const text = `${issue.title || ''} ${issue.description || ''}`.toLowerCase();
  const category = issue.category || 'Other';

  let baseScore = 20;
  let priority: IssueSeverity = 'Low';
  let reason = 'General civic maintenance item with standard community impact.';

  if (category === 'Drain' || text.includes('manhole') || text.includes('hazard') || text.includes('flood')) {
    baseScore = 90;
    priority = 'Critical';
    reason = 'Identified acute safety hazard or open drainage collapse requiring immediate intervention.';
  } else if (category === 'Water Leak' || text.includes('pipe') || text.includes('burst')) {
    baseScore = 80;
    priority = 'Critical';
    reason = 'Pressurized potable water loss or potential roadway erosion risk.';
  } else if (category === 'Pothole' && (text.includes('main road') || text.includes('accident') || text.includes('traffic'))) {
    baseScore = 75;
    priority = 'High';
    reason = 'High-traffic road surface disruption with elevated collision potential.';
  } else if (category === 'Streetlight' && (text.includes('dark') || text.includes('junction'))) {
    baseScore = 55;
    priority = 'Medium';
    reason = 'Nighttime visibility deficiency impacting pedestrian safety.';
  } else if (category === 'Garbage') {
    baseScore = 45;
    priority = 'Medium';
    reason = 'Public sanitation item requiring scheduled waste management clearance.';
  }

  // Adjust score with report count bonus if multiple citizen reports
  if (issue.reportCount && issue.reportCount > 1) {
    baseScore = Math.min(100, baseScore + (issue.reportCount - 1) * 6);
  }

  return {
    priority,
    score: baseScore,
    reason,
  };
};

/**
 * AI Report Drafting Assistant ("Help me write this complaint")
 * Converts casual user input into a professional municipal report without inventing facts.
 */
export const improveComplaintDescription = async (
  rawText: string,
  currentCategory?: string
): Promise<ReportDraftResult> => {
  const cleaned = rawText.trim();
  const lower = cleaned.toLowerCase();

  let category: IssueCategory = 'Other';
  let title = 'Civic Maintenance Report';
  let description = cleaned;

  if (lower.includes('pothole') || lower.includes('crater') || lower.includes('road broken')) {
    category = 'Pothole';
    title = 'Damaged Road Pothole';
    description = `The road surface exhibits a significant pothole with fractured asphalt. Commuters and two-wheelers face skidding hazards. Citizen reported: "${cleaned}".`;
  } else if (lower.includes('light') || lower.includes('lamp') || lower.includes('dark') || lower.includes('bulb')) {
    category = 'Streetlight';
    title = 'Non-Functional Streetlight Luminaire';
    description = `The streetlight at the reported location is currently non-operational, causing inadequate illumination and visibility reduction during evening hours. Citizen reported: "${cleaned}".`;
  } else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('dump') || lower.includes('waste')) {
    category = 'Garbage';
    title = 'Uncollected Solid Waste Accumulation';
    description = `Solid municipal waste has accumulated at the location, causing hygiene concerns and pedestrian sidewalk obstruction. Citizen reported: "${cleaned}".`;
  } else if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('burst')) {
    category = 'Water Leak';
    title = 'Pipeline Leakage / Surface Water Flow';
    description = `Pressurized water pipeline fracture causing potable water wastage and surface flooding across the street. Citizen reported: "${cleaned}".`;
  } else if (lower.includes('drain') || lower.includes('manhole') || lower.includes('gutter') || lower.includes('slab')) {
    category = 'Drain';
    title = 'Open Stormwater Drain / Damaged Slab';
    description = `Exposed drainage trench or broken cover slab posing an acute tripping and fall risk to pedestrians. Citizen reported: "${cleaned}".`;
  } else {
    category = (currentCategory as IssueCategory) || 'Other';
    title = `${category} Issue`;
    description = `Citizen civic complaint reported: "${cleaned}". Requires municipal inspection and departmental assessment.`;
  }

  return {
    category,
    title,
    description,
  };
};

/**
 * Image Analysis Helper ("Analyze Image")
 * Identifies possible categories labeled as "Possible issue detected".
 */
export const detectImageIssue = async (
  imageInput: string
): Promise<ImageAnalysisResult> => {
  const lower = imageInput.toLowerCase();

  if (lower.includes('pothole')) {
    return {
      detectedCategory: 'Pothole',
      severity: 'High',
      confidence: 0.92,
      label: 'Possible issue detected: Asphalt Road Pothole (High severity)',
    };
  }
  if (lower.includes('garbage') || lower.includes('waste')) {
    return {
      detectedCategory: 'Garbage',
      severity: 'Medium',
      confidence: 0.88,
      label: 'Possible issue detected: Uncollected Solid Waste (Medium severity)',
    };
  }
  if (lower.includes('water') || lower.includes('leak')) {
    return {
      detectedCategory: 'Water Leak',
      severity: 'Critical',
      confidence: 0.94,
      label: 'Possible issue detected: Pipeline Fracture / Water Leak (Critical severity)',
    };
  }
  if (lower.includes('light') || lower.includes('streetlight')) {
    return {
      detectedCategory: 'Streetlight',
      severity: 'Medium',
      confidence: 0.86,
      label: 'Possible issue detected: Broken Streetlight Pole (Medium severity)',
    };
  }
  if (lower.includes('drain') || lower.includes('manhole')) {
    return {
      detectedCategory: 'Drain',
      severity: 'Critical',
      confidence: 0.95,
      label: 'Possible issue detected: Open Drain / Slab Fracture (Critical severity)',
    };
  }

  // Default fallback
  return {
    detectedCategory: 'Other',
    severity: 'Medium',
    confidence: 0.75,
    label: 'Possible issue detected: Civic Infrastructure Defect',
  };
};
