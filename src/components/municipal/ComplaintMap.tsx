import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CivicIssue } from '../../types';
import L from 'leaflet';

interface ComplaintMapProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onAssignWorker: (issue: CivicIssue) => void;
  selectedCategory: string;
  selectedSeverity: string;
  heightClassName?: string;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  onSelectIssue,
  onAssignWorker,
  selectedCategory,
  selectedSeverity,
  heightClassName = 'h-[360px] sm:h-[400px] lg:h-[420px]',
}) => {
  const { issues } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filter issues based on category & severity
  const filteredIssues = issues.filter((issue) => {
    const matchCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    return matchCategory && matchSeverity;
  });

  // Get Marker Color based on severity & status (Google Brand Palette)
  const getMarkerColor = (issue: CivicIssue): string => {
    if (issue.status === 'Resolved') return '#34A853'; // Google Green
    switch (issue.severity) {
      case 'Critical':
        return '#EA4335'; // Google Red
      case 'High':
        return '#F9AB00'; // Google Deep Yellow / Orange
      case 'Medium':
        return '#FBBC05'; // Google Yellow
      default:
        return '#4285F4'; // Google Blue
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.6412],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size once rendered
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      const handleResize = () => {
        map.invalidateSize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Update Markers when filtered issues change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredIssues.forEach((issue) => {
      const color = getMarkerColor(issue);
      const isResolved = issue.status === 'Resolved';

      // Custom HTML Pin
      const customIcon = L.divIcon({
        className: 'custom-civic-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 11px;
              font-weight: 900;
              text-align: center;
            ">
              ${isResolved ? '✓' : issue.severity[0]}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([issue.location.lat, issue.location.lng], {
        icon: customIcon,
      });

      // Custom Popup HTML
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 text-slate-900 min-w-[220px] font-sans';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-mono font-bold bg-[#F1F3F4] text-[#202124] px-1.5 py-0.5 rounded">
            #${issue.ticketNumber}
          </span>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isResolved
              ? 'bg-[#E6F4EA] text-[#137333]'
              : issue.severity === 'Critical'
              ? 'bg-[#FCE8E6] text-[#C5221F]'
              : 'bg-[#FEF7E0] text-[#78350F]'
          }">
            ${issue.status}
          </span>
        </div>
        <h4 class="font-bold text-xs text-[#202124] leading-snug mb-1">${issue.title}</h4>
        <p class="text-[10px] text-[#5F6368] mb-2">${issue.location.address}</p>
        <img src="${issue.photoUrl}" alt="${issue.title}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
        <div class="flex space-x-1.5">
          <button id="btn-view-${issue.id}" class="flex-1 py-1.5 bg-[#4285F4] hover:bg-[#1A73E8] text-white rounded text-[11px] font-medium uppercase tracking-wider">
            View
          </button>
          ${
            !isResolved && !issue.assignedWorkerName
              ? `<button id="btn-assign-${issue.id}" class="flex-1 py-1.5 bg-[#34A853] hover:bg-[#2D9247] text-white rounded text-[11px] font-medium uppercase tracking-wider">
                  Assign
                </button>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`btn-view-${issue.id}`);
        if (viewBtn) {
          viewBtn.onclick = () => onSelectIssue(issue);
        }
        const assignBtn = document.getElementById(`btn-assign-${issue.id}`);
        if (assignBtn) {
          assignBtn.onclick = () => onAssignWorker(issue);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredIssues, onSelectIssue, onAssignWorker]);

  return (
    <div className={`relative w-full ${heightClassName} rounded-xl overflow-hidden border border-[#DADCE0] shadow-elevation-1`}>
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Severity Heatmap Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs p-3 rounded shadow-elevation-4 border border-[#DADCE0] z-[1000] text-xs">
        <h5 className="font-medium text-[#202124] mb-1.5 flex items-center justify-between uppercase tracking-wider text-[11px]">
          <span>Complaint Severity & Density</span>
          <span className="text-[10px] text-[#5F6368] font-normal lowercase">
            ({filteredIssues.length} pins)
          </span>
        </h5>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#EA4335] shadow-xs" />
            <span className="text-[#5F6368] font-medium">Critical Priority</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F9AB00] shadow-xs" />
            <span className="text-[#5F6368] font-medium">High Priority</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FBBC05] shadow-xs" />
            <span className="text-[#5F6368] font-medium">Medium Priority</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#34A853] shadow-xs" />
            <span className="text-[#5F6368] font-medium">Resolved Cleaned</span>
          </div>
        </div>
      </div>
    </div>
  );
};
