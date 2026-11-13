import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Search, LocateFixed, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationChange: (loc: {
    lat: number;
    lng: number;
    name: string;
    address?: string;
  }) => void;
  selectedName: string;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerProps> = ({
  initialLat,
  initialLng,
  onLocationChange,
  selectedName,
  className = 'h-72 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Matter tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // Draggable Custom Pin
    const pinHtml = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: grab;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(6, 182, 212, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 20px; height: 20px; border-radius: 9999px; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 12px #38bdf8; display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 9999px; background: #080d1a;"></div>
        </div>
      </div>
    `;

    const pinIcon = L.divIcon({
      html: pinHtml,
      className: 'picker-pin-icon',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup('<b>Selected Incident Location</b><br/>Drag or click anywhere to adjust.').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const updatedLat = Number(pos.lat.toFixed(6));
      const updatedLng = Number(pos.lng.toFixed(6));
      setCoords({ lat: updatedLat, lng: updatedLng });
      triggerReverseGeocode(updatedLat, updatedLng);
    });

    // Map click to place marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(6));
      const clickedLng = Number(e.latlng.lng.toFixed(6));
      marker.setLatLng([clickedLat, clickedLng]);
      setCoords({ lat: clickedLat, lng: clickedLng });
      triggerReverseGeocode(clickedLat, clickedLng);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync coords to parent when they change from internal triggers
  const triggerReverseGeocode = async (lat: number, lng: number) => {
    try {
      // Free OpenStreetMap reverse lookup with a friendly fallback
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        const road = data.address?.road || data.address?.suburb || 'Incident Site';
        const full = data.display_name || `${road}, [${lat}, ${lng}]`;
        onLocationChange({
          lat,
          lng,
          name: road,
          address: full,
        });
        return;
      }
    } catch {
      // Offline / fallback without erroring
    }

    onLocationChange({
      lat,
      lng,
      name: selectedName || `Road Coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
      address: `Coordinates: ${lat}, ${lng}`,
    });
  };

  // Search location using OpenStreetMap Nominatim
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchFeedback(null);

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (resp.ok) {
        const results = await resp.json();
        if (results && results.length > 0) {
          const first = results[0];
          const newLat = parseFloat(first.lat);
          const newLng = parseFloat(first.lon);

          setCoords({ lat: newLat, lng: newLng });
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
          }

          onLocationChange({
            lat: newLat,
            lng: newLng,
            name: first.name || searchQuery,
            address: first.display_name,
          });

          setSearchFeedback(`Found: ${first.display_name.slice(0, 50)}...`);
          setTimeout(() => setSearchFeedback(null), 4000);
          setIsSearching(false);
          return;
        }
      }
      setSearchFeedback('Location not found. Please click directly on the road.');
    } catch {
      setSearchFeedback('Search service currently unreachable. Click map to place pin.');
    }
    setIsSearching(false);
  };

  // Current GPS location
  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Browser geolocation is not available.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setCoords({ lat: userLat, lng: userLng });

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
          mapInstanceRef.current.setView([userLat, userLng], 17, { animate: true });
        }

        triggerReverseGeocode(userLat, userLng);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('GPS permission denied. Please click on the map to mark the spot.');
        } else {
          setGeoError('GPS lookup failed: ' + err.message);
        }
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      {/* Search and GPS Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search road, junction, landmark (e.g., Cyber Towers, MG Road)..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-9 pr-20 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1.5 rounded bg-cyan-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-cyan-500 transition disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoLoading}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-cyan-400 hover:border-cyan-500 hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
        >
          {geoLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          <span>Use My GPS</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {searchFeedback && (
        <div className="text-[11px] text-cyan-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>{searchFeedback}</span>
        </div>
      )}
      {geoError && (
        <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map Box */}
      <div className={`relative ${className} rounded-lg border border-slate-700 overflow-hidden bg-slate-950`}>
        <div ref={mapContainerRef} className="h-full w-full" />
        <div className="absolute bottom-2 left-2 z-[400] rounded bg-slate-950/85 px-2 py-1 text-[10px] text-slate-300 backdrop-blur border border-slate-800 flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-cyan-400" />
          <span>Click on map or drag pin to fine-tune exact hazard position</span>
        </div>
      </div>

      {/* Coordinate & Location Details Display */}
      <div className="flex flex-wrap items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Lat:</span>
          <span className="font-mono text-cyan-300">{coords.lat}</span>
          <span className="font-semibold text-slate-400 ml-2">Lng:</span>
          <span className="font-mono text-cyan-300">{coords.lng}</span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          OpenStreetMap &bull; High precision road coordinates
        </div>
      </div>
    </div>
  );
};
