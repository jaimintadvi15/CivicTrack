import { CivicIssue, IssueCategory, IssueSeverity, UserRole } from './index';

export type AIMessageSender = 'user' | 'assistant';

export interface AIMessageFact {
  label: string;
  value: string | number;
}

export interface AIMessage {
  id: string;
  sender: AIMessageSender;
  text: string;
  timestamp: string;
  referencedTickets?: string[]; // ticket numbers referenced, e.g. ['BLR-2026-8821']
  isRecommendation?: boolean;
  facts?: AIMessageFact[];
  suggestions?: string[];
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  activeTicketNumber?: string;
}

export interface ComplaintContext {
  id: string;
  ticketNumber: string;
  title: string;
  category: IssueCategory | string;
  severity: IssueSeverity;
  status: string;
  location: {
    address: string;
    ward: string;
  };
  createdAt: string;
  updatedAt: string;
  slaStatus?: string;
  slaDeadlineAt?: string;
  slaDurationHours?: number;
  assignedDepartment?: string;
  assignedWorkerName?: string;
  escalatedAt?: string;
  escalationReason?: string;
  reportCount?: number;
  upvotes?: number;
  wasResolvedWithinSLA?: boolean;
}

export interface MunicipalSummaryStats {
  total: number;
  submitted: number;
  acknowledged: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  escalated: number;
  dueSoon: number;
  criticalSeverity: number;
  categoryBreakdown: Record<string, number>;
  wardBreakdown: Record<string, number>;
  complianceRatePercent: number;
}

export interface AIRequest {
  message: string;
  history: { sender: AIMessageSender; text: string }[];
  userRole: UserRole;
  userName: string;
  userId: string;
  authorizedIssues: ComplaintContext[];
  summaryStats?: MunicipalSummaryStats;
  activeTicketNumber?: string;
}

export interface AIResponse {
  answer: string;
  referencedTickets?: string[];
  suggestions?: string[];
  facts?: AIMessageFact[];
  isRecommendation?: boolean;
}

export interface ComplaintAnalysis {
  ticketNumber: string;
  problem: string;
  category: IssueCategory | string;
  potentialSeverity: IssueSeverity;
  severityReason: string;
  urgency: 'Immediate' | 'High' | 'Standard';
  slaRisk: 'Low' | 'Moderate' | 'High' | 'Overdue';
  recommendedDepartment: string;
  recommendedAction: string;
  disclaimer: string;
}

export interface PriorityRecommendation {
  priority: IssueSeverity;
  score: number; // 0 - 100
  reason: string;
}

export interface ReportDraftResult {
  category: IssueCategory;
  title: string;
  description: string;
}

export interface ImageAnalysisResult {
  detectedCategory: IssueCategory;
  severity: IssueSeverity;
  confidence: number;
  label: string;
}
