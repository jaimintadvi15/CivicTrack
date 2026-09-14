export type ReportCategory =
  | 'road_hazard'
  | 'waste_overflow'
  | 'lighting_electrical'
  | 'water_sewer'
  | 'sidewalk_access'
  | 'traffic_signals';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ReportStatus =
  | 'submitted'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved';

export type Ward =
  | 'Ward 1 - West Harbor'
  | 'Ward 2 - Industrial Corridor'
  | 'Ward 3 - Riverfront'
  | 'Ward 4 - Midtown Central'
  | 'Ward 5 - East Heights'
  | 'Ward 6 - Southern Parklands';

export type CrewTeam =
  | 'Road Maintenance Crew #04'
  | 'Asphalt Repair Rapid Unit #12'
  | 'Sanitation & Solid Waste Team B'
  | 'Electrical & Street Lighting Crew #02'
  | 'Water & Sewer Rapid Response'
  | 'Traffic Signals & Signs Division';

export interface DuplicateReport {
  id: string;
  submittedAt: string;
  distanceMeters: number;
  photoUrl: string;
  description: string;
  reporter: string;
  status: ReportStatus;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
  fromStatus?: ReportStatus;
  toStatus?: ReportStatus;
}

export interface CivicReport {
  id: string;
  ticketNumber: string; // e.g. "MW-2026-8841"
  category: ReportCategory;
  title: string;
  description: string;
  photoUrl: string;
  resolvedPhotoUrl?: string;
  resolvedAt?: string;
  resolvedNotes?: string;
  coordinates: {
    lat: number;
    lng: number;
    // Normalized 0-100 coordinates for SVG municipal GIS map
    mapX: number;
    mapY: number;
  };
  address: string;
  crossStreet?: string;
  ward: Ward;
  severity: SeverityLevel;
  severityReason: string;
  aiConfidence: number; // e.g. 0.96
  aiExtractedDetails: {
    hazardType: string;
    dimensionEstimate?: string;
    surfaceRisk?: string;
    vehicleRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    pedestrianRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    infrastructureImpact: string;
  };
  duplicateClusterId?: string;
  duplicateCount: number;
  duplicateCluster: DuplicateReport[];
  status: ReportStatus;
  submittedAt: string;
  updatedAt: string;
  assignedCrew?: CrewTeam;
  slaDeadlineHours: number;
  slaExpiresAt: string;
  isCitizenSubmitted?: boolean;
  citizenContact?: {
    name: string;
    phone: string;
    email: string;
    anonymous: boolean;
  };
  auditLogs: AuditLogEntry[];
}

export interface FilterState {
  category: string;
  severity: string;
  ward: string;
  status: string;
  searchQuery: string;
  duplicatesOnly: boolean;
  dateRange: 'all' | 'today' | '7d' | '30d';
}

export interface CitizenUser {
  name: string;
  phone: string;
  ward: Ward;
}

export interface EmployeeUser {
  id: string;
  role: 'authority' | 'field_crew';
}

export type ActiveAppView = 'landing' | 'authority' | 'citizen' | 'field_crew';
export type AuthorityTab = 'map' | 'queue' | 'clusters';
export type CitizenTab = 'report' | 'my_reports';
