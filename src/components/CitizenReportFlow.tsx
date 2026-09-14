import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  MapPin,
  Sparkles,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldAlert,
  Send,
  Sliders,
  Compass
} from 'lucide-react';
import { CivicReport, ReportCategory, SeverityLevel, Ward, CitizenUser } from '../types';
import { CIVIC_CATEGORIES } from '../data/mockReports';

interface CitizenReportFlowProps {
  user: CitizenUser;
  onSubmitReport: (newReport: CivicReport) => void;
  onNavigateToMyReports: () => void;
  onNavigateToAuthority: () => void;
}

// Preset samples for rapid testing
const DEMO_PRESETS = [
  {
    title: '4th Ave & Elm Pothole (Duplicate Cluster Match)',
    category: 'road_hazard' as ReportCategory,
    address: '430 4th Ave West near Elm St',
    ward: 'Ward 4 - Midtown Central' as Ward,
    lat: 42.3481,
    lng: -83.0568,
    mapX: 42,
    mapY: 48,
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    description: 'Deep road crater in westbound driving lane right after the pedestrian crossing. Cars are jolting and swerving dangerously.',
    triggerCluster: true,
  },
  {
    title: 'Mercer St Garbage Overflow',
    category: 'waste_overflow' as ReportCategory,
    address: '158 Mercer St Commercial Alley',
    ward: 'Ward 4 - Midtown Central' as Ward,
    lat: 42.3551,
    lng: -83.0612,
    mapX: 34,
    mapY: 36,
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    description: 'Dumpster overflowing onto the road. Debris and cardboard scattered everywhere blocking passage.',
    triggerCluster: false,
  },
  {
    title: 'Pinecrest Streetlight Luminaire Out',
    category: 'lighting_electrical' as ReportCategory,
    address: '1422 Pinecrest Blvd at 12th Ave',
    ward: 'Ward 5 - East Heights' as Ward,
    lat: 42.3612,
    lng: -83.0398,
    mapX: 74,
    mapY: 28,
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    description: 'Streetlight pole dark. Crosswalk is pitch black for students returning from after-school activities.',
    triggerCluster: false,
  },
];

export const CitizenReportFlow: React.FC<CitizenReportFlowProps> = ({
  user,
  onSubmitReport,
  onNavigateToMyReports,
  onNavigateToAuthority,
}) => {
  // Form state
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
  );
  const [description, setDescription] = useState<string>(
    'Deep road crater in westbound driving lane right after Elm St. Cars are swerving dangerously into oncoming traffic.'
  );
  const [address, setAddress] = useState<string>('432 4th Ave West & Elm St');
  const [ward, setWard] = useState<Ward>(user.ward);
  const [coords, setCoords] = useState<{ lat: number; lng: number; mapX: number; mapY: number }>({
    lat: 42.3481,
    lng: -83.0568,
    mapX: 42,
    mapY: 48,
  });

  const [reporterName, setReporterName] = useState<string>(user.name);
  const [reporterPhone, setReporterPhone] = useState<string>(user.phone);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis result state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<CivicReport | null>(null);

  const handleApplyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setPhotoUrl(preset.photoUrl);
    setDescription(preset.description);
    setAddress(preset.address);
    setWard(preset.ward);
    setCoords({
      lat: preset.lat,
      lng: preset.lng,
      mapX: preset.mapX,
      mapY: preset.mapY,
    });
    setSubmittedReport(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateCameraSnap = () => {
    setIsCameraActive(true);
    setTimeout(() => {
      // Mock shutter capture
      setPhotoUrl('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80');
      setIsCameraActive(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Realistic progressive analysis delay (800ms) - not an endless blank spinner
    setTimeout(() => {
      const ticketNumber = `MW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const is4thAve = address.toLowerCase().includes('4th ave') || description.toLowerCase().includes('pothole') || description.toLowerCase().includes('crater');

      const duplicateCluster = is4thAve
        ? [
            {
              id: 'dup-101',
              submittedAt: '2026-09-12T18:42:00Z',
              distanceMeters: 14,
              photoUrl: 'https://images.unsplash.com/photo-1584463699037-1e5b1cb3ce88?auto=format&fit=crop&w=400&q=80',
              description: 'Deep hole near the storm drain on 4th Ave. Wheel jolted hard.',
              reporter: 'Citizen #4419 (Mobile)',
              status: 'verified' as const,
            },
            {
              id: 'dup-102',
              submittedAt: '2026-09-11T07:15:00Z',
              distanceMeters: 28,
              photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
              description: 'Cars are swerving into oncoming traffic to avoid pit in front of 434 4th Ave.',
              reporter: 'Citizen #9082 (Web)',
              status: 'verified' as const,
            },
            {
              id: 'dup-103',
              submittedAt: '2026-09-10T14:20:00Z',
              distanceMeters: 45,
              photoUrl: 'https://images.unsplash.com/photo-1584463699037-1e5b1cb3ce88?auto=format&fit=crop&w=400&q=80',
              description: 'Asphalt crumbling rapidly after rainstorm.',
              reporter: 'Transit Driver #12',
              status: 'verified' as const,
            },
            {
              id: 'dup-104',
              submittedAt: '2026-09-08T09:30:00Z',
              distanceMeters: 62,
              photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
              description: 'Pothole developing right on the main tire line.',
              reporter: 'Citizen #3812',
              status: 'verified' as const,
            },
            {
              id: 'dup-105',
              submittedAt: '2026-09-06T16:04:00Z',
              distanceMeters: 75,
              photoUrl: 'https://images.unsplash.com/photo-1584463699037-1e5b1cb3ce88?auto=format&fit=crop&w=400&q=80',
              description: 'Hazardous depression in street pavement.',
              reporter: 'Citizen #7220',
              status: 'verified' as const,
            },
            {
              id: 'dup-106',
              submittedAt: '2026-09-03T11:50:00Z',
              distanceMeters: 110,
              photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
              description: 'Street surface breaking apart near curb.',
              reporter: 'Citizen #5041',
              status: 'verified' as const,
            },
            {
              id: 'dup-107',
              submittedAt: '2026-08-29T19:12:00Z',
              distanceMeters: 145,
              photoUrl: 'https://images.unsplash.com/photo-1584463699037-1e5b1cb3ce88?auto=format&fit=crop&w=400&q=80',
              description: 'Initial crack with sinking asphalt base.',
              reporter: 'Citizen #2890',
              status: 'verified' as const,
            },
          ]
        : [];

      const duplicateCount = is4thAve ? 7 : 0;
      const severity: SeverityLevel = is4thAve ? 'CRITICAL' : 'HIGH';

      const newReport: CivicReport = {
        id: `rep-citizen-${Date.now()}`,
        ticketNumber,
        category: 'road_hazard',
        title: is4thAve
          ? 'Severe road cavity spanning westbound travel lane'
          : 'Hazardous street surface disruption',
        description,
        photoUrl,
        coordinates: coords,
        address,
        ward,
        severity,
        severityReason: is4thAve
          ? 'Large pothole spanning full lane — high vehicle risk and oncoming lane swerve hazard.'
          : 'Infrastructure disruption requiring municipal field inspection.',
        aiConfidence: 0.96,
        aiExtractedDetails: {
          hazardType: 'Pothole (Depth Grade IV - Cavity)',
          dimensionEstimate: '1.2m length × 0.8m width × 11cm depth',
          surfaceRisk: 'Exposed sub-base aggregate with sharp edges',
          vehicleRisk: 'CRITICAL',
          pedestrianRisk: 'MODERATE',
          infrastructureImpact: 'Rapid degradation of road subgrade if unsealed',
        },
        duplicateClusterId: is4thAve ? 'CL-4TH-ELM' : undefined,
        duplicateCount,
        duplicateCluster,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaDeadlineHours: is4thAve ? 4 : 24,
        slaExpiresAt: new Date(Date.now() + (is4thAve ? 4 : 24) * 3600000).toISOString(),
        isCitizenSubmitted: true,
        citizenContact: {
          name: reporterName,
          phone: reporterPhone,
          email: 'resident@metrowest.org',
          anonymous: false,
        },
        auditLogs: [
          {
            id: `log-${Date.now()}-1`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            action: 'Report Submitted by Resident',
            actor: 'Citizen Mobile App (GPS Verified)',
            notes: 'Resident submitted defect report with high precision geolocation.',
          },
          {
            id: `log-${Date.now()}-2`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            action: 'Automated Computer Vision & Duplicate Cluster Linked',
            actor: 'CivicTrack Spatial Engine',
            notes: is4thAve
              ? 'Matched to active priority cluster CL-4TH-ELM (7 prior complaints within 145m radius). Upgraded to CRITICAL dispatch queue.'
              : 'Registered new spatial record. Queued for dispatcher verification.',
          },
        ],
      };

      onSubmitReport(newReport);
      setSubmittedReport(newReport);
      setIsSubmitting(false);
    }, 700);
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 text-slate-900 font-sans">
      
      {/* Informational Sub-header */}
      <div className="mb-5 pb-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Report a Street or Utility Issue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Metro West 311 &bull; Direct municipal public works triage pipeline
          </p>
        </div>

        <button
          onClick={onNavigateToMyReports}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Track My Reports</span>
        </button>
      </div>

      {/* Quick Testing Presets Bar */}
      <div className="mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono">
        <div className="text-[11px] text-slate-500 font-semibold mb-1.5 uppercase flex items-center justify-between">
          <span>Demo Scenario Presets (Instant Autofill)</span>
          <span className="text-[10px] text-blue-600 font-bold">Click to Load &amp; Test:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-700 text-[11px] transition-colors text-left truncate max-w-xs shadow-xs"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Report Form */}
      {!submittedReport ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* STEP 1: Photo Capture & Upload */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-[10px] flex items-center justify-center text-slate-800 font-bold">
                  1
                </span>
                CAPTURE HAZARD PHOTO
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Required for AI detection</span>
            </div>

            {/* Photo preview / upload dropzone */}
            {photoUrl ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-300">
                <img
                  src={photoUrl}
                  alt="Hazard preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
                  <span className="text-xs font-mono text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                    Photo Staged &bull; Ready for CV Triage
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-xs font-mono text-red-100 bg-red-700/90 hover:bg-red-700 border border-red-800 px-2.5 py-0.5 rounded shadow-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full py-2">
                <label 
                  className="custum-file-upload" 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setPhotoUrl(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="" viewBox="0 0 24 24"><g strokeWidth="0" id="SVGRepo_bgCarrier"></g><g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier"></g><g id="SVGRepo_iconCarrier"> <path fill="" d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1305 22.7175 15.5606 20.9844 15.122C20.7924 12.8136 18.858 11 16.5 11Z" clipRule="evenodd" fillRule="evenodd"></path> </g></svg>
                  </div>
                  <div className="text">
                    <span>Click to upload image</span>
                  </div>
                  <input type="file" id="file" onChange={handleFileChange} accept="image/*" />
                </label>

                {/* Optional Mock Camera button directly underneath */}
                <button
                  type="button"
                  onClick={handleSimulateCameraSnap}
                  className="mt-4 py-2 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-mono text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  {isCameraActive ? 'Snapping Viewfinder...' : 'Mock Camera Snap'}
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: GPS Location Verification & Map Pin */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-[10px] flex items-center justify-center text-slate-800 font-bold">
                  2
                </span>
                LOCATION &amp; GPS FIX
              </span>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                GPS LOCKED (&plusmn;3m)
              </span>
            </div>

            {/* Street address input */}
            <div>
              <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1 font-semibold">
                Street Address or Nearest Intersection
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 432 4th Ave West & Elm St"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Embedded Mini Interactive GIS Pin Map */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-1.5 font-medium">
                <span>DRAG PIN TO ADJUST EXACT ROAD POSITION</span>
                <span>{coords.lat.toFixed(4)}°N, {Math.abs(coords.lng).toFixed(4)}°W</span>
              </div>
              <div
                className="relative h-28 bg-[#f1f5f9] rounded overflow-hidden border border-slate-300 cursor-crosshair"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setCoords({
                    lat: 42.3481 + (y - 50) * 0.0005,
                    lng: -83.0568 + (x - 50) * 0.0005,
                    mapX: Math.round(x),
                    mapY: Math.round(y),
                  });
                }}
              >
                {/* SVG grid lines */}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="2.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="42" y1="0" x2="42" y2="100" stroke="#cbd5e1" strokeWidth="2.5" />
                  <line x1="42" y1="0" x2="42" y2="100" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="42" cy="50" r="15" fill="#ef4444" fillOpacity="0.12" stroke="#ef4444" strokeWidth="0.4" strokeDasharray="1 1" />
                  <text x="44" y="25" fill="#475569" fontSize="4" fontFamily="monospace" fontWeight="bold">ELM ST</text>
                  <text x="5" y="47" fill="#475569" fontSize="4" fontFamily="monospace" fontWeight="bold">4th AVE WEST</text>
                </svg>

                {/* Draggable pin */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${coords.mapX}%`, top: `${coords.mapY}%` }}
                >
                  <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold animate-bounce">
                    <MapPin className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ward selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1 font-semibold">
                  Jurisdiction Ward
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value as Ward)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Ward 1 - West Harbor">Ward 1 - West Harbor</option>
                  <option value="Ward 2 - Industrial Corridor">Ward 2 - Industrial Corridor</option>
                  <option value="Ward 3 - Riverfront">Ward 3 - Riverfront</option>
                  <option value="Ward 4 - Midtown Central">Ward 4 - Midtown Central</option>
                  <option value="Ward 5 - East Heights">Ward 5 - East Heights</option>
                  <option value="Ward 6 - Southern Parklands">Ward 6 - Southern Parklands</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1 font-semibold">
                  Reporter Contact (For SMS Updates)
                </label>
                <input
                  type="text"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Description */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-mono text-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-[10px] flex items-center justify-center text-slate-800 font-bold">
                  3
                </span>
                PROBLEM DESCRIPTION
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Free text narrative</span>
            </div>

            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the defect, hazards to traffic or pedestrians, approximate size, or how long it has been there..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || !photoUrl}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                <span>Processing Computer Vision &amp; Spatial Triage...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Civic Report &amp; Analyze Issue</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* INLINE REALISTIC AI ANALYSIS RESULT */
        <div className="space-y-4">
          
          {/* Submission Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between text-xs font-mono shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 text-sm">
                  REPORT LOGGED // TICKET #{submittedReport.ticketNumber}
                </span>
                <span className="text-emerald-700 block text-[11px] mt-0.5">
                  Registered with Metro West 311 CAD dispatch system
                </span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
              STATUS: SUBMITTED
            </span>
          </div>

          {/* INLINE AI ANALYSIS BOX */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 font-mono text-xs shadow-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-blue-600" />
                INLINE COMPUTER VISION &amp; SPATIAL ANALYSIS
              </span>
              <span className="text-emerald-700 text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                CONFIDENCE: {(submittedReport.aiConfidence * 100).toFixed(1)}%
              </span>
            </div>

            {/* Extracted Category & Severity Read */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase block mb-1 font-semibold">
                  Extracted Incident Category
                </span>
                <span className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Road Damage (Pothole Cavity)
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Code: RD-01 &bull; Depth Grade IV
                </span>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-[10px] text-red-700 uppercase block mb-1 font-semibold">
                  Operational Severity Assessment
                </span>
                <span className="text-sm font-bold text-red-800 font-sans flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  {submittedReport.severity} SEVERITY
                </span>
                <span className="text-[11px] text-red-700/90 block mt-1">
                  SLA Target: Rapid response within 4 hours
                </span>
              </div>
            </div>

            {/* Plain language reason */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-sans text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-mono text-[11px] block mb-1 uppercase font-bold">
                Severity Reasoning (Plain Language):
              </strong>
              "{submittedReport.severityReason}"
            </div>

            {/* THE DUPLICATE-CLUSTER CALLOUT (HIGHLIGHTED FEATURE) */}
            {submittedReport.duplicateCount > 0 ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-700" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm font-sans">
                        DUPLICATE SPATIAL CLUSTER DETECTED
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        {submittedReport.duplicateCount} similar reports within 200m in the last 30 days
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold uppercase">
                    Expedited Queue
                  </span>
                </div>

                <p className="text-xs text-amber-950 font-sans leading-relaxed">
                  Our spatial duplicate detection matched your submission with existing complaints filed by nearby motorists and residents on 4th Ave. Because multiple citizens have reported this hazard, the municipal public works team has <strong>automatically upgraded this defect to Priority Cluster #CL-4TH-ELM</strong> for immediate asphalt crew dispatch.
                </p>

                {/* Thumbnail strip of nearby matching reports */}
                <div>
                  <div className="text-[11px] font-mono text-amber-900 font-bold mb-2 flex items-center justify-between">
                    <span>NEARBY RESIDENT SUBMISSIONS IN THIS CLUSTER:</span>
                    <span className="text-amber-700 font-normal">All within 145m radius</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {submittedReport.duplicateCluster.slice(0, 4).map((dup) => (
                      <div
                        key={dup.id}
                        className="bg-white border border-amber-200 rounded p-1.5 text-[10px] font-mono shadow-xs"
                      >
                        <img
                          src={dup.photoUrl}
                          alt="Cluster report evidence"
                          className="w-full h-16 object-cover rounded mb-1"
                        />
                        <div className="text-amber-800 font-bold">{dup.distanceMeters}m away</div>
                        <div className="text-slate-600 truncate">{dup.reporter}</div>
                        <div className="text-slate-400 text-[9px]">
                          {new Date(dup.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-sans">
                <strong>Spatial Check:</strong> No duplicates found within 200m. This is recorded as a new initial defect report in Ward {submittedReport.ward.split(' - ')[0]}.
              </div>
            )}

            {/* Helpful Next Steps State */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs font-sans text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-950 block font-mono text-[11px] mb-0.5">
                  WHAT HAPPENS NEXT:
                </strong>
                <span className="leading-relaxed">
                  Your report has been placed in the Ward 4 active triage pipeline. An operational dispatcher is reviewing crew schedules, and you can track work order status, crew arrival, and verified before/after repair photos in your portal.
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onNavigateToMyReports}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                Track in "My Reports" Pipeline
              </button>

              <button
                type="button"
                onClick={onNavigateToAuthority}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>View on Authority Triage Map</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedReport(null);
                }}
                className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg font-mono text-xs transition-colors shadow-xs cursor-pointer"
              >
                File Another
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
