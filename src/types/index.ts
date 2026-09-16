export type IssueCategory =
  | 'Garbage'
  | 'Pothole'
  | 'Water Leak'
  | 'Streetlight'
  | 'Road Damage'
  | 'Drain'
  | 'Other';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Submitted' | 'Acknowledged' | 'In Progress' | 'Resolved';

export interface TimelineEvent {
  id: string;
  status: IssueStatus;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
}

export interface IssueLocation {
  address: string;
  ward: string;
  city: string;
  lat: number;
  lng: number;
}

export interface CivicIssue {
  id: string;
  ticketNumber: string;
  title: string;
  category: IssueCategory;
  customCategory?: string;
  severity: IssueSeverity;
  status: IssueStatus;
  description: string;
  location: IssueLocation;
  photoUrl: string;
  photos?: string[];
  afterPhotoUrl?: string;
  voiceNoteUrl?: string;
  voiceNoteTranscription?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  upvotes: number;
  hasUpvoted?: boolean;
  mergedCount: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedAt?: string;
  targetResolutionHours?: number;
  citizenId: string;
  citizenName: string;
  reporterPhone?: string;
  includeReporterContact?: boolean;
  resolutionRemarks?: string;
  resolvedAt?: string;
}


export interface FieldWorker {
  id: string;
  name: string;
  role: string;
  department: string;
  ward: string;
  phone: string;
  avatar: string;
  activeTasksCount: number;
  completedTasksCount: number;
  rating: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'reporting' | 'community' | 'speed' | 'impact';
  progress: number;
  maxProgress: number;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  ward: string;
  city: string;
  points: number;
  level: number;
  levelName: string;
  nextLevelPoints: number;
  badges: Badge[];
  reportsSubmitted: number;
  reportsResolved: number;
  impactScore: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  ward: string;
  points: number;
  reportsCount: number;
  resolvedCount: number;
  avatar: string;
  badgeTitle: string;
  isCurrentUser?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'status' | 'badge' | 'xp' | 'worker';
  timestamp: string;
  read: boolean;
  issueId?: string;
  xpEarned?: number;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';

export type UserRole = 'citizen' | 'municipal' | 'worker';

export interface AuthSession {
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  ward?: string;
  workerId?: string;
  isFirstLogin?: boolean;
}

export interface PreProvisionedUser {
  phone: string;
  name: string;
  role: UserRole;
  department?: string;
  ward?: string;
  workerId?: string;
  avatar?: string;
  inviteCode?: string;
}
