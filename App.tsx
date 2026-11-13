/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Incident,
  SupportedRegion,
  IncidentCategory,
  IncidentPriority,
  AIDetectionResult,
  IncidentLifecycleStage,
} from './types/incident';
import { SUPPORTED_REGIONS } from './data/seedIncidents';
import { incidentService } from './services/incidentService';
import { LiveIncidentMapView } from './components/LiveIncidentMapView';
import { CitizenReportView } from './components/CitizenReportView';
import { AuthorityDashboardView } from './components/AuthorityDashboardView';
import { VolunteerNetworkView } from './components/VolunteerNetworkView';
import { AIDetectionLab } from './components/AIDetectionLab';
import { ActiveRoadScannerView } from './components/ActiveRoadScannerView';
import { IncidentDetailsModal } from './components/IncidentDetailsModal';
import { FullDemoRunner } from './components/FullDemoRunner';
import {
  Shield,
  MapPin,
  FileText,
  Building2,
  Users,
  Bot,
  RotateCcw,
  Activity,
  Database,
  Info,
  Radio,
  ExternalLink,
  ChevronDown,
  X,
  Play,
  Pause,
  Scan,
} from 'lucide-react';

type NavTab = 'live-map' | 'citizen-report' | 'active-scanner' | 'authority' | 'volunteer' | 'ai-lab';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('live-map');
  const [selectedRegion, setSelectedRegion] = useState<SupportedRegion>('Hyderabad');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSimActive, setIsSimActive] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  // Prefilled report data from AI Detection Lab
  const [prefilledAiReport, setPrefilledAiReport] = useState<{
    aiData: AIDetectionResult;
    category: IncidentCategory;
    priority: IncidentPriority;
    photoUrl: string;
  } | null>(null);

  // Subscribe to shared incident service
  useEffect(() => {
    setIncidents(incidentService.getIncidents());
    const unsubscribe = incidentService.subscribe(() => {
      setIncidents(incidentService.getIncidents());
      setIsSimActive(incidentService.getIsSimActive());
    });
    return () => unsubscribe();
  }, []);

  // When selected incident changes, keep it in sync with latest state
  useEffect(() => {
    if (selectedIncident) {
      const updated = incidents.find((i) => i.id === selectedIncident.id);
      if (updated) {
        setSelectedIncident(updated);
      }
    }
  }, [incidents]);

  // Handle region switch: if region has no incidents, automatically seed regional synthetic demo data
  const handleRegionChange = (newRegion: SupportedRegion) => {
    setSelectedRegion(newRegion);
    incidentService.loadRegionDemoDataset(newRegion);
  };

  // Toggle simulated live activity
  const handleToggleSimulation = () => {
    if (isSimActive) {
      incidentService.stopSimulatedActivity();
      setIsSimActive(false);
    } else {
      incidentService.startSimulatedActivity(7000);
      setIsSimActive(true);
    }
  };

  const handleResetDemoData = () => {
    if (
      window.confirm(
        'Reset demonstration dataset to original seed records? Genuine citizen reports will be preserved.'
      )
    ) {
      incidentService.resetDemoData();
      setSelectedIncident(null);
    }
  };

  const handleAttachFromLab = (
    aiData: AIDetectionResult,
    category: IncidentCategory,
    priority: IncidentPriority,
    photoUrl: string
  ) => {
    setPrefilledAiReport({ aiData, category, priority, photoUrl });
    setActiveTab('citizen-report');
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#080d1a]/95 backdrop-blur shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full rounded-[10px] bg-[#080d1a] flex items-center justify-center">
                <Shield className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  CivicShield <span className="text-cyan-400 font-mono">AI</span>
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                  v2.4 OSM LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Civic Intelligence &bull; OpenStreetMap &bull; Road Safety Network
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('live-map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'live-map'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Live Incident Map</span>
            </button>

            <button
              onClick={() => setActiveTab('citizen-report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'citizen-report'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Citizen Report</span>
            </button>

            <button
              onClick={() => setActiveTab('active-scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'active-scanner'
                  ? 'bg-cyan-600 text-white shadow shadow-cyan-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Scan className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Active Road Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('authority')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'authority'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Authority Command</span>
            </button>

            <button
              onClick={() => setActiveTab('volunteer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'volunteer'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Volunteer Network</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-lab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ai-lab'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span>Road Demo &amp; AI Lab</span>
            </button>
          </nav>

          {/* Right Header Controls (Region Selector, Simulation Toggle, Architecture Modal) */}
          <div className="flex items-center gap-2">
            {/* Region Selector */}
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value as SupportedRegion)}
                className="appearance-none rounded-lg border border-slate-700 bg-slate-900 pl-2.5 pr-7 py-1.5 text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
                title="Select demonstration region"
              >
                {Object.keys(SUPPORTED_REGIONS).map((reg) => (
                  <option key={reg} value={reg}>
                    📍 {reg}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Simulated Live Activity Toggle */}
            <button
              onClick={handleToggleSimulation}
              title={
                isSimActive
                  ? 'Pause simulated live activity stream'
                  : 'Activate simulated live activity feed (for demonstrations)'
              }
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                isSimActive
                  ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300 shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isSimActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="hidden xl:inline">
                {isSimActive ? 'Simulated Live: Active' : 'Simulated Feed'}
              </span>
              <span className="xl:hidden">
                {isSimActive ? 'Live' : 'Sim'}
              </span>
            </button>

            {/* Architecture / Storage Indicator */}
            <button
              onClick={() => setShowArchitectureModal(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-cyan-300 transition"
              title="System architecture & backend mode info"
            >
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline font-mono text-[11px]">LOCAL DEMO</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleResetDemoData}
              title="Reset demonstration records to initial state"
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/90 px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('live-map')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'live-map' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('citizen-report')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'citizen-report' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300'
            }`}
          >
            Citizen Report
          </button>
          <button
            onClick={() => setActiveTab('active-scanner')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'active-scanner' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300'
            }`}
          >
            Scanner
          </button>
          <button
            onClick={() => setActiveTab('authority')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'authority' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300'
            }`}
          >
            Authority
          </button>
          <button
            onClick={() => setActiveTab('volunteer')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'volunteer' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300'
            }`}
          >
            Volunteers
          </button>
          <button
            onClick={() => setActiveTab('ai-lab')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'ai-lab' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-300'
            }`}
          >
            Road Demo
          </button>
        </div>
      </header>

      {/* Top Guided Demo Toolbar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-3 sm:px-4 py-1.5 z-40">
        <FullDemoRunner
          incidents={incidents}
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
            setActiveTab('live-map');
          }}
          onFilterCritical={() => {
            setActiveTab('live-map');
          }}
          onFilterAll={() => {
            setActiveTab('live-map');
          }}
          onStartRoadScan={() => {
            setActiveTab('live-map');
          }}
          onPauseRoadScan={() => {}}
          onOpenRoadSimulator={() => {
            setActiveTab('active-scanner');
          }}
        />
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'live-map' && (
          <LiveIncidentMapView
            incidents={incidents}
            selectedRegion={selectedRegion}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            selectedIncident={selectedIncident}
          />
        )}

        {activeTab === 'active-scanner' && (
          <ActiveRoadScannerView
            onBackToHome={() => setActiveTab('live-map')}
            onNavigateToTriage={() => setActiveTab('authority')}
            onNavigateToMap={() => setActiveTab('live-map')}
          />
        )}

        {activeTab === 'citizen-report' && (
          <CitizenReportView
            currentRegion={selectedRegion}
            onReportSubmitted={(newInc) => {
              setSelectedIncident(newInc);
            }}
            onOpenMap={() => setActiveTab('live-map')}
          />
        )}

        {activeTab === 'authority' && (
          <AuthorityDashboardView
            incidents={incidents}
            selectedRegion={selectedRegion}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            selectedIncident={selectedIncident}
          />
        )}

        {activeTab === 'volunteer' && (
          <VolunteerNetworkView
            incidents={incidents}
            selectedRegion={selectedRegion}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            selectedIncident={selectedIncident}
          />
        )}

        {activeTab === 'ai-lab' && (
          <AIDetectionLab
            onAttachAndReport={handleAttachFromLab}
            onNavigateToTriage={() => setActiveTab('authority')}
            onNavigateToMap={() => setActiveTab('live-map')}
            onNavigateToScanner={() => setActiveTab('active-scanner')}
          />
        )}
      </main>

      {/* Incident Details Modal (Shown when any incident is clicked) */}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          isAuthorityMode={activeTab === 'authority'}
          isVolunteerMode={activeTab === 'volunteer'}
          onStageChange={(id: string, stage: IncidentLifecycleStage) => {
            incidentService.updateIncidentStage(id, stage, 'Authority Officer');
          }}
          onClaimTask={(id) => {
            incidentService.assignVolunteer(id, {
              id: 'VOL-HYD-07',
              name: 'Ravi Kumar',
            });
          }}
        />
      )}

      {/* System Architecture & Storage Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  CivicShield Data Architecture &amp; Deployment Mode
                </h3>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs leading-relaxed">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Current Mode:</span>
                  <span className="font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    LOCAL DEMO PERSISTENCE
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  All citizen reports, volunteer task claims, inspections, and authority sign-offs persist in your browser's local storage (<code className="text-cyan-300">civicshield_incidents_v2</code>).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Real-World &amp; Cross-Device Scaling
                </h4>
                <p className="text-slate-300">
                  Because local storage is contained in your browser session, cross-device multi-user locking requires connecting a shared backend (such as Supabase PostgreSQL with Row-Level Security or Firebase Firestore).
                </p>
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 space-y-1 text-[11px] text-slate-400">
                  <div>&bull; <strong>Mapping Engine:</strong> Leaflet + OpenStreetMap &amp; CartoDB Dark Matter. No paid Google Maps API key or billing required.</div>
                  <div>&bull; <strong>Directions:</strong> Standard external Google Maps Directions links with coordinates.</div>
                  <div>&bull; <strong>GitHub Pages:</strong> 100% static client-side bundle compatible.</div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowArchitectureModal(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
