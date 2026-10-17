import React, { useState } from 'react';
import {
  Incident,
  IncidentCategory,
  IncidentPriority,
  IncidentLifecycleStage,
  SupportedRegion,
  QuickFilterCategory,
  RoadCorridor,
} from '../types/incident';
import { SUPPORTED_REGIONS } from '../data/seedIncidents';
import { InteractiveMap } from './InteractiveMap';
import { RoadScanSimulator } from './RoadScanSimulator';
import { VoiceAssistantBar } from './VoiceAssistantBar';
import {
  Filter,
  Search,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Scan,
  Volume2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LiveIncidentMapViewProps {
  incidents: Incident[];
  selectedRegion: SupportedRegion;
  onSelectIncident: (inc: Incident) => void;
  selectedIncident: Incident | null;
}

export const LiveIncidentMapView: React.FC<LiveIncidentMapViewProps> = ({
  incidents,
  selectedRegion,
  onSelectIncident,
  selectedIncident,
}) => {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dataSourceFilter, setDataSourceFilter] = useState<'all' | 'genuine' | 'demo'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Road Scan Simulator State
  const [showRoadScanHud, setShowRoadScanHud] = useState(false);
  const [activeCorridor, setActiveCorridor] = useState<RoadCorridor | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Voice Assistant Bar toggle
  const [showVoiceBar, setShowVoiceBar] = useState(true);

  const regionConfig = SUPPORTED_REGIONS[selectedRegion] || SUPPORTED_REGIONS.Hyderabad;

  // Filter logic
  const filteredIncidents = incidents.filter((inc) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q) ||
        inc.location.name.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Quick filter classification
    if (quickFilter !== 'all') {
      const c = inc.category.toLowerCase();
      if (quickFilter === 'potholes' && !c.includes('pothole')) return false;
      if (quickFilter === 'road-damage' && !(c.includes('road') || c.includes('pothole') || c.includes('crack') || c.includes('kerb'))) return false;
      if (quickFilter === 'drainage' && !(c.includes('drain') || c.includes('manhole') || c.includes('sewer') || c.includes('water'))) return false;
      if (quickFilter === 'waterlogging' && !(c.includes('waterlog') || c.includes('flood'))) return false;
      if (quickFilter === 'streetlights' && !c.includes('light')) return false;
      if (quickFilter === 'electrical' && !(c.includes('electrical') || c.includes('wire'))) return false;
      if (quickFilter === 'garbage' && !(c.includes('garbage') || c.includes('dumping') || c.includes('debris'))) return false;
      if (quickFilter === 'pedestrian' && !(c.includes('pedestrian') || c.includes('footpath') || c.includes('walkway'))) return false;
      if (quickFilter === 'infrastructure' && !(c.includes('infrastructure') || c.includes('barrier') || c.includes('bus-stop') || c.includes('sign') || c.includes('construction'))) return false;
      if (quickFilter === 'other' && !(c.includes('other') || c.includes('obstruction'))) return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && inc.priority !== priorityFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;

    // Data Source filter
    if (dataSourceFilter === 'genuine' && inc.isDemo) return false;
    if (dataSourceFilter === 'demo' && !inc.isDemo) return false;

    return true;
  });

  // Calculate live counts dynamically from data
  const criticalCount = incidents.filter((i) => i.priority === 'critical' && i.status !== 'resolved').length;
  const inProgressCount = incidents.filter((i) => i.status === 'assigned' || i.status === 'inspection_in_progress' || i.status === 'repair_in_progress').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="relative flex flex-col h-[calc(100vh-4.5rem)] overflow-hidden bg-[#080d1a]">
      {/* Top Quick Metrics & Simulation Controls Bar */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-950/90 backdrop-blur z-10">
        <div className="flex items-center justify-between px-3 py-2 text-xs gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-semibold">{sidebarOpen ? 'Hide List' : 'Show List'}</span>
            </button>

            {/* Toggle Road Scan Simulator HUD */}
            <button
              onClick={() => setShowRoadScanHud(!showRoadScanHud)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold transition ${
                showRoadScanHud
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_10px_#06b6d4]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-400'
              }`}
            >
              <Scan className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>{showRoadScanHud ? 'Hide Scan HUD' : 'Road Scan Simulator'}</span>
            </button>

            {/* Toggle Voice Assistant Bar */}
            <button
              onClick={() => setShowVoiceBar(!showVoiceBar)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Voice Assistant</span>
            </button>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Total Hazards:</span>
              <span className="font-bold text-white font-mono">{incidents.length}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/60 border border-red-900/80">
              <Flame className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-300 font-bold">{criticalCount} Critical</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-900/80">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-purple-300 font-bold">{inProgressCount} Active Field</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-900/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">{resolvedCount} Resolved</span>
            </div>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0 mr-1">
            Quick Filters:
          </span>
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'road-damage', label: 'Road Damage' },
            { id: 'potholes', label: 'Potholes' },
            { id: 'drainage', label: 'Drainage & Water' },
            { id: 'waterlogging', label: 'Waterlogging' },
            { id: 'streetlights', label: 'Streetlights' },
            { id: 'electrical', label: 'Electrical Hazards' },
            { id: 'garbage', label: 'Garbage & Debris' },
            { id: 'pedestrian', label: 'Pedestrian Safety' },
            { id: 'infrastructure', label: 'Infrastructure Damage' },
            { id: 'other', label: 'Other Civic Issues' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setQuickFilter(item.id as QuickFilterCategory)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition font-medium ${
                quickFilter === item.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Assistant Bar (Optional Expandable) */}
      {showVoiceBar && (
        <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800">
          <VoiceAssistantBar />
        </div>
      )}

      {/* Main Map + Sidebar Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Collapsible Incident List Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-80 sm:w-96 translate-x-0' : 'w-0 -translate-x-full'
          } transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-950/95 flex flex-col z-20 overflow-hidden shadow-2xl`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, category, or road name..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[9px] text-slate-400 font-semibold uppercase block mb-0.5">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-semibold uppercase block mb-0.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="all">All Stages</option>
                  <option value="new_report">New Report</option>
                  <option value="under_review">Under Review</option>
                  <option value="assigned">Assigned</option>
                  <option value="inspection_in_progress">Inspecting</option>
                  <option value="inspection_submitted">Inspect Done</option>
                  <option value="resolved">Resolved</option>
                  <option value="reopened">Reopened</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-semibold uppercase block mb-0.5">
                  Source
                </label>
                <select
                  value={dataSourceFilter}
                  onChange={(e) => setDataSourceFilter(e.target.value as any)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="genuine">Verified Citizen</option>
                  <option value="demo">Synthetic Demo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Incident List Header */}
          <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
            {(quickFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || dataSourceFilter !== 'all' || search) && (
              <button
                onClick={() => {
                  setQuickFilter('all');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                  setDataSourceFilter('all');
                  setSearch('');
                }}
                className="text-cyan-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* List of Incidents */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-2 opacity-70" />
                <p className="font-semibold text-slate-300">No Incidents Found</p>
                <p className="mt-1 text-slate-500">Try adjusting your category or priority filters.</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                return (
                  <div
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className={`p-3 text-xs cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-cyan-400'
                        : 'hover:bg-slate-900/70 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-cyan-300">
                        {incident.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            incident.priority === 'critical'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : incident.priority === 'high'
                              ? 'bg-orange-950 text-orange-400 border border-orange-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {incident.priority}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {incident.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-medium text-slate-100 line-clamp-1">
                      {incident.title}
                    </h4>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{incident.location.name}</span>
                      <span className="text-[9px] font-mono text-cyan-400">
                        {incident.isDemo ? 'SYNTHETIC DEMO' : 'CITIZEN REPORT'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real Leaflet Map */}
        <div className="flex-1 h-full relative">
          <InteractiveMap
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onSelectIncident={onSelectIncident}
            center={regionConfig.center}
            zoom={regionConfig.zoom}
            activeCorridor={showRoadScanHud ? activeCorridor : null}
            scanProgressPercent={scanProgress}
            isScanningActive={isScanningActive}
          />

          {/* Floating Road Scan Simulator HUD */}
          {showRoadScanHud && (
            <div className="absolute top-3 left-3 z-[400] w-80 sm:w-96">
              <RoadScanSimulator
                onCorridorSelect={(c) => setActiveCorridor(c)}
                onProgressUpdate={(p) => setScanProgress(p)}
                onScanStateChange={(s) => setIsScanningActive(s)}
                onIncidentDetected={(id) => {
                  const inc = incidents.find((i) => i.id === id);
                  if (inc) onSelectIncident(inc);
                }}
                incidents={incidents}
                onOpenIncident={onSelectIncident}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
