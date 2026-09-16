import { IssueCategory, IssueSeverity, CivicIssue } from '../types';

export interface AIDetectionResult {
  category: IssueCategory;
  severity: IssueSeverity;
  confidence: number;
  tags: string[];
  summary: string;
}

export function simulateAIDetection(
  textDescription: string,
  imageHint?: string
): AIDetectionResult {
  const combined = (textDescription + ' ' + (imageHint || '')).toLowerCase();

  if (combined.includes('pothole') || combined.includes('crater') || combined.includes('tar') || combined.includes('bump') || combined.includes('road hole')) {
    return {
      category: 'Pothole',
      severity: combined.includes('accident') || combined.includes('deep') || combined.includes('huge') ? 'High' : 'Medium',
      confidence: 0.94,
      tags: ['Asphalt Degradation', 'Traffic Hazard', 'Depth: ~15cm'],
      summary: 'AI identified severe road surface depression requiring urgent asphalt cold/hot mix patching.',
    };
  }

  if (combined.includes('garbage') || combined.includes('waste') || combined.includes('trash') || combined.includes('smell') || combined.includes('dump') || combined.includes('plastic')) {
    return {
      category: 'Garbage',
      severity: combined.includes('overflow') || combined.includes('rotten') ? 'High' : 'Medium',
      confidence: 0.96,
      tags: ['Municipal Solid Waste', 'Sanitation Risk', 'Estimated Vol: 200kg'],
      summary: 'AI detected unsegregated solid waste accumulation requiring mechanized clearance & disinfection.',
    };
  }

  if (combined.includes('water') || combined.includes('leak') || combined.includes('pipe') || combined.includes('burst') || combined.includes('flood') || combined.includes('gushing')) {
    return {
      category: 'Water Leak',
      severity: 'Critical',
      confidence: 0.98,
      tags: ['Potable Water Loss', 'Pressure Pipeline', 'High Flow Rate'],
      summary: 'AI flagged critical pressurized water distribution pipe fracture causing public resource loss.',
    };
  }

  if (combined.includes('light') || combined.includes('lamp') || combined.includes('dark') || combined.includes('electric') || combined.includes('pole') || combined.includes('bulb')) {
    return {
      category: 'Streetlight',
      severity: combined.includes('dark') ? 'Medium' : 'Low',
      confidence: 0.92,
      tags: ['Public Lighting', 'Electrical Fault', 'Night Safety Impact'],
      summary: 'AI identified luminaire failure or power relay trip affecting public pedestrian safety.',
    };
  }

  if (combined.includes('drain') || combined.includes('sewage') || combined.includes('gutter') || combined.includes('slab') || combined.includes('manhole')) {
    return {
      category: 'Drain',
      severity: 'Critical',
      confidence: 0.95,
      tags: ['Stormwater Drain', 'Missing Cover', 'High Fall Risk'],
      summary: 'AI detected exposed storm conduit or broken concrete slab requiring safety barricades & replacement.',
    };
  }

  if (combined.includes('road') || combined.includes('crack') || combined.includes('footpath') || combined.includes('pavement') || combined.includes('bridge')) {
    return {
      category: 'Road Damage',
      severity: 'Medium',
      confidence: 0.89,
      tags: ['Structural Pavement Fault', 'Curb Damage', 'Pedestrian Impediment'],
      summary: 'AI detected structural erosion on road edge or pedestrian walkway.',
    };
  }

  // Default fallback
  return {
    category: 'Garbage',
    severity: 'Medium',
    confidence: 0.85,
    tags: ['Civic Maintenance', 'Auto Classified'],
    summary: 'AI analyzed visual features and estimated priority classification.',
  };
}

// Distance calculation between 2 geo-coordinates in meters (Haversine formula)
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Check for duplicates nearby (within 150m) with same category
export function findNearbyDuplicate(
  category: IssueCategory,
  lat: number,
  lng: number,
  existingIssues: CivicIssue[]
): { duplicate: CivicIssue; distanceMeters: number } | null {
  for (const issue of existingIssues) {
    if (issue.status === 'Resolved') continue;
    if (issue.category === category) {
      const distance = getDistanceInMeters(lat, lng, issue.location.lat, issue.location.lng);
      if (distance <= 250) {
        return { duplicate: issue, distanceMeters: distance };
      }
    }
  }
  return null;
}
