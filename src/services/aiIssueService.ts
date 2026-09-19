import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { IssueCategory, IssueSeverity, CivicIssue } from '../types';
import { simulateAIDetection, findNearbyDuplicate } from '../utils/aiSimulation';

export interface ClassifyIssueParams {
  title?: string;
  description: string;
  photoUrl?: string;
  photoFile?: File | Blob | string;
  lat: number;
  lng: number;
  address?: string;
  ward?: string;
  existingIssues?: CivicIssue[];
}

export interface ClassifyIssueResult {
  category: IssueCategory;
  severity: IssueSeverity;
  aiSummary: string;
  priorityScore: number;
  assignedDepartment: string;
  confidence: number;
  isDuplicate: boolean;
  duplicateMatch?: {
    id: string;
    ticketNumber: string;
    title: string;
    distanceMeters: number;
    reportCount: number;
  } | null;
  source: 'claude_edge_function' | 'local_intelligent_fallback';
}

const DEPARTMENT_MAP: Record<string, string> = {
  pothole: 'Roads & Infrastructure Department',
  'road damage': 'Roads & Infrastructure Department',
  streetlight: 'Electrical & Lighting Department',
  garbage: 'Solid Waste Management Department',
  'water leak': 'Water Supply & Sewerage Board (BWSSB)',
  water: 'Water Supply & Sewerage Board (BWSSB)',
  drain: 'Stormwater Drainage & Flood Control',
  other: 'General Municipal Administration HQ',
  unclassified: 'General Triage Department',
};

export const normalizeCategory = (catStr: string): IssueCategory => {
  const lower = catStr.toLowerCase();
  if (lower.includes('pothole')) return 'Pothole';
  if (lower.includes('garbage') || lower.includes('waste')) return 'Garbage';
  if (lower.includes('water') || lower.includes('leak')) return 'Water Leak';
  if (lower.includes('light') || lower.includes('lamp')) return 'Streetlight';
  if (lower.includes('drain') || lower.includes('manhole')) return 'Drain';
  if (lower.includes('road') || lower.includes('pavement')) return 'Road Damage';
  return 'Other';
};

export const normalizeSeverity = (sevStr: string): IssueSeverity => {
  const lower = sevStr.toLowerCase();
  if (lower.includes('crit')) return 'Critical';
  if (lower.includes('high')) return 'High';
  if (lower.includes('low')) return 'Low';
  return 'Medium';
};

export const calculateClientPriorityScore = (
  severity: IssueSeverity,
  reportCount: number = 1,
  ageHours: number = 0
): number => {
  const baseWeight: Record<IssueSeverity, number> = {
    Critical: 45,
    High: 30,
    Medium: 18,
    Low: 10,
  };
  const base = baseWeight[severity] || 18;
  const countBonus = Math.min(30, Math.max(0, (reportCount - 1) * 10));
  const ageBonus = Math.min(25, Math.floor(ageHours / 12) * 4);
  return Math.min(100, Math.max(5, base + countBonus + ageBonus));
};

export const getDepartmentForCategory = (category: IssueCategory | string): string => {
  return DEPARTMENT_MAP[category.toLowerCase()] || DEPARTMENT_MAP.other;
};

/**
 * Invoke the Supabase Edge Function 'classify-issue' powered by Claude API
 * with automatic fallback to local AI heuristics if edge function is unreachable.
 */
export async function classifyIssueWithAi(params: ClassifyIssueParams): Promise<ClassifyIssueResult> {
  const { title = '', description, photoUrl, lat, lng, address = '', ward = '', existingIssues = [] } = params;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('classify-issue', {
        body: {
          title,
          description,
          photoUrl,
          lat,
          lng,
          address,
          ward,
        },
      });

      if (!error && data?.success && data?.classification) {
        const cls = data.classification;
        const normCat = normalizeCategory(cls.category || 'other');
        const normSev = normalizeSeverity(cls.severity || 'medium');
        const dept = cls.assigned_department || getDepartmentForCategory(normCat);
        const dup = data.duplicate;

        return {
          category: normCat,
          severity: normSev,
          aiSummary: cls.ai_summary || `AI verified ${normCat} report requiring ${dept} action.`,
          priorityScore: cls.priority_score || calculateClientPriorityScore(normSev, dup?.new_report_count || 1),
          assignedDepartment: dept,
          confidence: 94,
          isDuplicate: Boolean(dup?.is_duplicate),
          duplicateMatch: dup?.is_duplicate
            ? {
                id: dup.duplicate_of,
                ticketNumber: dup.ticket_number || 'BLR-PREV',
                title: dup.title || 'Existing reported issue',
                distanceMeters: dup.distance_meters || 45,
                reportCount: dup.new_report_count || 2,
              }
            : null,
          source: 'claude_edge_function',
        };
      }
    } catch (err) {
      console.warn('Supabase Edge Function classify-issue unavailable, activating resilient local AI fallback:', err);
    }
  }

  // Graceful Local Intelligence Fallback (simulates Claude classification heuristics)
  const combinedText = `${title} ${description}`.trim();
  const simulated = simulateAIDetection(combinedText, title);
  const normCat = simulated.category;
  const normSev = simulated.severity;
  const dept = getDepartmentForCategory(normCat);

  // Check existing local issues for duplicates within 100 meters
  const nearby = findNearbyDuplicate(normCat, lat, lng, existingIssues);
  const isDup = Boolean(nearby);
  const reportCount = nearby ? (nearby.duplicate.reportCount || nearby.duplicate.mergedCount || 1) + 1 : 1;
  const priorityScore = calculateClientPriorityScore(normSev, reportCount);

  return {
    category: normCat,
    severity: normSev,
    aiSummary: simulated.summary,
    priorityScore,
    assignedDepartment: dept,
    confidence: Math.round(simulated.confidence * 100),
    isDuplicate: isDup,
    duplicateMatch: nearby
      ? {
          id: nearby.duplicate.id,
          ticketNumber: nearby.duplicate.ticketNumber,
          title: nearby.duplicate.title,
          distanceMeters: nearby.distanceMeters,
          reportCount,
        }
      : null,
    source: 'local_intelligent_fallback',
  };
}
