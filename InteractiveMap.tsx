import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Incident,
  IncidentLifecycleStage,
  IncidentPriority,
  RoadCorridor,
} from '../types/incident';
import {
  Layers,
  Play,
  Pause,
  AlertTriangle,
  LocateFixed,
  Scan,
} from 'lucide-react';

interface InteractiveMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  center: [number, number];
  zoom?: number;
  className?: string;
  enableControls?: boolean;
  activeCorridor?: RoadCorridor | null;
  scanProgressPercent?: number; // 0 - 100
  isScanningActive?: boolean;
  onScanIncidentDetected?: (incidentId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  center,
  zoom = 13,
  className = 'h-full w-full',
  enableControls = true,
  activeCorridor = null,
  scanProgressPercent = 0,
  isScanningActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorsLayerRef = useRef<L.LayerGroup | null>(null);
  const scanHeadMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeTileLayer, setActiveTileLayer] = useState<'dark' | 'osm'>('dark');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    );

    darkTiles.addTo(map);
    (map as any)._currentTileLayer = darkTiles;

    const corridorsGroup = L.layerGroup().addTo(map);
    corridorsLayerRef.current = corridorsGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // Tile layer switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ((map as any)._currentTileLayer) {
      map.removeLayer((map as any)._currentTileLayer);
    }

    let newLayer: L.TileLayer;
    if (activeTileLayer === 'dark') {
      newLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
    } else {
      newLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
    }

    newLayer.addTo(map);
    (map as any)._currentTileLayer = newLayer;
  }, [activeTileLayer]);

  // Render Road Corridors & Scanning Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const corridorsGroup = corridorsLayerRef.current;
    if (!map || !corridorsGroup) return;

    corridorsGroup.clearLayers();

    if (!activeCorridor) return;

    // Render segments of the active corridor
    activeCorridor.segments.forEach((seg) => {
      let color = '#0284c7';
      let className = '';

      if (seg.status === 'critical') {
        color = '#ef4444';
        className = 'road-scan-critical-red';
      } else if (seg.status === 'elevated_risk') {
        color = '#f97316';
      } else if (seg.status === 'scanning') {
        color = '#06b6d4';
        className = 'road-scan-flowing-blue';
      } else if (seg.status === 'verified_safe') {
        color = '#10b981';
      } else {
        color = '#38bdf8';
      }

      // Base solid shadow line for glow
      L.polyline(seg.coordinates, {
        color,
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
      }).addTo(corridorsGroup);

      // Main styled line
      const line = L.polyline(seg.coordinates, {
        color,
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        className,
      }).addTo(corridorsGroup);

      line.bindTooltip(
        `<b>${seg.name}</b><br/>Status: ${seg.status.toUpperCase()}<br/>Risk Index: ${seg.riskScore}/100`,
        { sticky: true }
      );
    });

    // Animate scan head along the route
    if (isScanningActive && activeCorridor.segments.length > 0) {
      // Calculate position along corridor points
      const allPoints = activeCorridor.segments.flatMap((s) => s.coordinates);
      const totalPoints = allPoints.length;
      const pointIndex = Math.min(
        totalPoints - 1,
        Math.floor((scanProgressPercent / 100) * totalPoints)
      );
      const currentCoord = allPoints[pointIndex] || allPoints[0];

      if (scanHeadMarkerRef.current) {
        map.removeLayer(scanHeadMarkerRef.current);
      }

      const scanHeadHtml = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 9999px; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 12px #22d3ee;"></div>
        </div>
      `;

      const scanHeadIcon = L.divIcon({
        html: scanHeadHtml,
        className: 'scan-head-beacon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const sMarker = L.marker(currentCoord, { icon: scanHeadIcon }).addTo(map);
      sMarker.bindPopup(`<b>Scanning Vehicle Position</b><br/>Progress: ${scanProgressPercent.toFixed(0)}%`);
      scanHeadMarkerRef.current = sMarker;
    } else if (scanHeadMarkerRef.current) {
      map.removeLayer(scanHeadMarkerRef.current);
      scanHeadMarkerRef.current = null;
    }
  }, [activeCorridor, scanProgressPercent, isScanningActive]);

  // Render Incident Markers with Category SVGs and Pulsing Animations
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    incidents.forEach((incident) => {
      const isSelected = selectedIncident?.id === incident.id;
      const markerHtml = createMarkerHtml(
        incident.priority,
        incident.status,
        incident.category,
        animationsEnabled,
        isSelected
      );

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-civic-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([incident.location.lat, incident.location.lng], {
        icon,
      });

      const popupContent = `
        <div style="font-family: inherit; min-width: 220px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; font-family: monospace;">${
              incident.id
            }</span>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 9999px; text-transform: uppercase; font-weight: 700; ${getStatusBadgeStyle(
              incident.status
            )}">${incident.status.replace(/_/g, ' ')}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 600; color: #f8fafc; margin: 0 0 4px 0;">${
            incident.title
          }</h4>
          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0; line-height: 1.4;">${
            incident.location.name
          }</p>
          <div style="display: flex; gap: 4px; font-size: 10px; color: #cbd5e1; margin-bottom: 6px;">
            <span style="background: rgba(30, 41, 59, 0.9); padding: 2px 6px; border-radius: 4px;">${
              incident.category
            }</span>
            <span style="background: rgba(30, 41, 59, 0.9); padding: 2px 6px; border-radius: 4px;">Priority: ${
              incident.priority.toUpperCase()
            }</span>
          </div>
          ${
            incident.isDemo
              ? `<div style="font-size: 9px; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px dashed rgba(245, 158, 11, 0.4); padding: 2px 6px; border-radius: 4px; margin-bottom: 6px;">SYNTHETIC DEMO INCIDENT</div>`
              : `<div style="font-size: 9px; color: #34d399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 4px; margin-bottom: 6px;">VERIFIED CITIZEN REPORT</div>`
          }
          <div style="font-size: 10px; color: #38bdf8; text-decoration: underline; cursor: pointer; text-align: right; margin-top: 4px;">Click marker to inspect &rarr;</div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectIncident(incident);
      });

      marker.addTo(markersGroup);
    });
  }, [incidents, selectedIncident?.id, animationsEnabled]);

  // Pan to selected incident when changed
  useEffect(() => {
    if (!selectedIncident || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(
      [selectedIncident.location.lat, selectedIncident.location.lng],
      { animate: true, duration: 0.8 }
    );
  }, [selectedIncident?.id]);

  // Handle Geolocation
  const handleRequestUserLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Locating your position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setLocationStatus('Location found');

        const map = mapInstanceRef.current;
        if (map) {
          map.setView(coords, 15, { animate: true });

          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }

          const userHtml = `
            <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 26px; height: 26px; border-radius: 9999px; background: rgba(14, 165, 233, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 12px; height: 12px; border-radius: 9999px; background: #0284c7; border: 2px solid #ffffff; box-shadow: 0 0 10px #38bdf8;"></div>
            </div>
          `;

          const userIcon = L.divIcon({
            html: userHtml,
            className: 'user-loc-marker',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          const uMarker = L.marker(coords, { icon: userIcon }).addTo(map);
          uMarker.bindPopup('<b>Your Current Location</b><br/>Browser verified GPS');
          userMarkerRef.current = uMarker;
        }

        setTimeout(() => setLocationStatus(null), 3000);
      },
      (err) => {
        setLocationStatus(null);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Map remains centered on selected region.');
        } else {
          setGeoError('Unable to retrieve location: ' + err.message);
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl border border-slate-800 bg-[#080d1a]`}>
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {enableControls && (
        <>
          {/* Top-Right Map Controls Toolbar */}
          <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 flex-wrap justify-end">
            {/* Tile Layer Toggle */}
            <button
              onClick={() =>
                setActiveTileLayer(activeTileLayer === 'dark' ? 'osm' : 'dark')
              }
              title={`Switch to ${activeTileLayer === 'dark' ? 'Street' : 'Dark Matrix'} map`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:border-cyan-500 hover:text-cyan-400 transition shadow"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>{activeTileLayer === 'dark' ? 'Dark Matrix' : 'Street Map'}</span>
            </button>

            {/* Animation Toggle */}
            <button
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              title={animationsEnabled ? 'Pause marker pulse animations' : 'Resume marker pulse animations'}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:border-cyan-500 hover:text-cyan-400 transition shadow"
            >
              {animationsEnabled ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pulse ON</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-slate-400" />
                  <span>Pulse Paused</span>
                </>
              )}
            </button>

            {/* Geolocation Button */}
            <button
              onClick={handleRequestUserLocation}
              title="Locate my position (GPS)"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:border-cyan-500 hover:text-cyan-400 transition shadow"
            >
              <LocateFixed className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">My GPS</span>
            </button>
          </div>

          {/* Bottom-Left Live Legend */}
          <div className="absolute bottom-3 left-3 z-[400] rounded-xl border border-slate-800 bg-slate-950/95 p-3 backdrop-blur text-xs text-slate-300 shadow-2xl max-w-sm">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Incident Visual Legend
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {incidents.length} active markers
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                <span className="text-red-300 font-medium">Critical Hazards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
                <span className="text-orange-300 font-medium">High Priority</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                <span className="text-blue-300 font-medium">Pending / Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></span>
                <span className="text-cyan-300 font-medium">Under Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
                <span className="text-purple-300 font-medium">Assigned / Field</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                <span className="text-emerald-300 font-medium">Resolved & Verified</span>
              </div>
            </div>

            {/* Road Scan Lines Legend */}
            {activeCorridor && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] space-y-1">
                <span className="font-semibold text-cyan-300 block">Road Scan Simulator Overlays:</span>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-1 bg-cyan-400 rounded"></span>
                  <span className="text-cyan-200">Blue Flow: Active Scan Corridor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-1 bg-red-500 rounded"></span>
                  <span className="text-red-300">Red: Detected Critical Hazard Segment</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {locationStatus && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400] rounded-full border border-cyan-500/50 bg-slate-900/95 px-4 py-1.5 text-xs font-medium text-cyan-300 shadow-xl backdrop-blur flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          {locationStatus}
        </div>
      )}

      {geoError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400] rounded-lg border border-amber-500/50 bg-slate-950/95 px-4 py-2 text-xs font-medium text-amber-300 shadow-xl backdrop-blur flex items-center gap-2 max-w-md">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{geoError}</span>
          <button
            onClick={() => setGeoError(null)}
            className="ml-auto text-slate-400 hover:text-slate-200"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

// SVG icon selector by category
function getCategorySvgIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('pothole')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>`;
  }
  if (c.includes('water') || c.includes('flood')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
  }
  if (c.includes('drain') || c.includes('manhole') || c.includes('sewer')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`;
  }
  if (c.includes('light') || c.includes('electrical') || c.includes('wire')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
  }
  if (c.includes('garbage') || c.includes('dumping') || c.includes('debris')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  }
  if (c.includes('pedestrian') || c.includes('footpath') || c.includes('walkway')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="5" r="2"/><path d="M10 22v-6l-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4l-2 2v6"/></svg>`;
  }
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 22 20 2 20 12 2"/></svg>`;
}

function createMarkerHtml(
  priority: IncidentPriority,
  status: IncidentLifecycleStage,
  category: string,
  animationsEnabled: boolean,
  isSelected: boolean
): string {
  let mainColor = '#3b82f6';
  let pulseClass = 'pulse-ring-medium';
  let glowColor = 'rgba(59, 130, 246, 0.6)';

  if (status === 'resolved') {
    mainColor = '#10b981';
    pulseClass = 'pulse-ring-resolved';
    glowColor = 'rgba(16, 185, 129, 0.6)';
  } else if (status === 'assigned' || status === 'inspection_in_progress') {
    mainColor = '#a855f7';
    pulseClass = 'pulse-ring-purple';
    glowColor = 'rgba(168, 85, 247, 0.7)';
  } else if (status === 'under_review' || status === 'initial_triage') {
    mainColor = '#06b6d4';
    pulseClass = 'pulse-ring-review';
    glowColor = 'rgba(6, 182, 212, 0.6)';
  } else if (priority === 'critical') {
    mainColor = '#ef4444';
    pulseClass = 'pulse-ring-critical';
    glowColor = 'rgba(239, 68, 68, 0.85)';
  } else if (priority === 'high') {
    mainColor = '#f97316';
    pulseClass = 'pulse-ring-high';
    glowColor = 'rgba(249, 115, 22, 0.75)';
  } else {
    mainColor = '#3b82f6';
    pulseClass = 'pulse-ring-pending';
    glowColor = 'rgba(59, 130, 246, 0.6)';
  }

  const anim = animationsEnabled ? pulseClass : '';
  const selectedBorder = isSelected
    ? 'border: 3px solid #ffffff; box-shadow: 0 0 18px #38bdf8; transform: scale(1.15);'
    : '';
  const svgIcon = getCategorySvgIcon(category);

  return `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${
        animationsEnabled
          ? `<div class="${anim}" style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background: ${glowColor}; pointer-events: none;"></div>`
          : ''
      }
      <div style="position: relative; z-index: 2; width: 26px; height: 26px; border-radius: 9999px; background: #080d1a; border: 2px solid ${mainColor}; display: flex; align-items: center; justify-content: center; color: ${mainColor}; ${selectedBorder} box-shadow: 0 0 10px ${glowColor};">
        ${svgIcon}
      </div>
    </div>
  `;
}

function getStatusBadgeStyle(status: IncidentLifecycleStage): string {
  switch (status) {
    case 'resolved':
      return 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);';
    case 'assigned':
    case 'inspection_in_progress':
      return 'background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);';
    case 'under_review':
    case 'initial_triage':
    case 'inspection_submitted':
      return 'background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.4);';
    case 'repair_required':
    case 'repair_in_progress':
      return 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);';
    default:
      return 'background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);';
  }
}
