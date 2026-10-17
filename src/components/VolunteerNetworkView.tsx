import React, { useState } from 'react';
import {
  Incident,
  IncidentPriority,
  SupportedRegion,
} from '../types/incident';
import { SUPPORTED_REGIONS } from '../data/seedIncidents';
import { InteractiveMap } from './InteractiveMap';
import { incidentService } from '../services/incidentService';
import {
  Users,
  CheckCircle2,
  MapPin,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  Upload,
  ArrowRight,
  Shield,
  FileText,
  UserCheck,
  ChevronRight,
  X,
} from 'lucide-react';

interface VolunteerNetworkViewProps {
  incidents: Incident[];
  selectedRegion: SupportedRegion;
  onSelectIncident: (inc: Incident) => void;
  selectedIncident: Incident | null;
}

const DEMO_VOLUNTEERS = [
  { id: 'VOL-HYD-07', name: 'Ravi Kumar', title: 'Certified Community Inspector' },
  { id: 'VOL-HYD-12', name: 'Priya Sharma', title: 'Civic Response Lead' },
  { id: 'VOL-003', name: 'Karthik Raman', title: 'Road Safety Volunteer' },
];

export const VolunteerNetworkView: React.FC<VolunteerNetworkViewProps> = ({
  incidents,
  selectedRegion,
  onSelectIncident,
  selectedIncident,
}) => {
  const regionConfig = SUPPORTED_REGIONS[selectedRegion] || SUPPORTED_REGIONS.Hyderabad;

  // Active Volunteer Profile
  const [activeVolunteer, setActiveVolunteer] = useState(DEMO_VOLUNTEERS[0]);

  // Tab: Available vs My Tasks vs Completed
  const [activeTab, setActiveTab] = useState<'available' | 'claimed' | 'completed'>('available');

  // Inspection Submission Modal state
  const [inspectingIncident, setInspectingIncident] = useState<Incident | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [confirmedSeverity, setConfirmedSeverity] = useState<IncidentPriority>('high');
  const [recommendsClosure, setRecommendsClosure] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Available tasks: not resolved, not completed, unassigned OR assigned to current volunteer
  const availableTasks = incidents.filter(
    (inc) =>
      inc.status !== 'resolved' &&
      inc.status !== 'inspection_submitted' &&
      (!inc.assignedVolunteer || inc.assignedVolunteer.status === 'assigned')
  );

  const myClaimedTasks = incidents.filter(
    (inc) =>
      inc.assignedVolunteer?.id === activeVolunteer.id &&
      inc.status !== 'resolved'
  );

  const completedTasks = incidents.filter(
    (inc) => inc.inspection && inc.inspection.inspectorId === activeVolunteer.id
  );

  // Claim a task
  const handleClaimTask = (incidentId: string) => {
    setClaimFeedback(null);
    const result = incidentService.assignVolunteer(incidentId, {
      id: activeVolunteer.id,
      name: activeVolunteer.name,
      phone: '+91 98450 XXXXX',
    });

    if (result.success) {
      setClaimFeedback({
        type: 'success',
        message: `Task ${incidentId} claimed successfully! Check "My Active Dispatches".`,
      });
      if (result.incident) {
        onSelectIncident(result.incident);
      }
    } else {
      setClaimFeedback({
        type: 'error',
        message: result.message,
      });
    }

    setTimeout(() => setClaimFeedback(null), 5000);
  };

  // Release a task
  const handleReleaseTask = (incidentId: string) => {
    incidentService.releaseAssignment(incidentId, activeVolunteer.id);
  };

  // Submit inspection findings
  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingIncident) return;

    incidentService.submitInspection(inspectingIncident.id, {
      inspectorId: activeVolunteer.id,
      inspectorName: activeVolunteer.name,
      notes: inspectionNotes.trim() || 'Visual site inspection completed. Findings logged.',
      severityConfirmed: confirmedSeverity,
      recommendsClosure,
    });

    setInspectingIncident(null);
    setInspectionNotes('');
    setClaimFeedback({
      type: 'success',
      message: 'Inspection submitted! Awaiting municipal authority review for final resolution sign-off.',
    });
    setTimeout(() => setClaimFeedback(null), 6000);
  };

  // Incidents to show on the task map based on active tab
  const displayIncidents =
    activeTab === 'available'
      ? availableTasks
      : activeTab === 'claimed'
      ? myClaimedTasks
      : completedTasks;

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] overflow-hidden bg-[#080d1a]">
      {/* Top Volunteer Network Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                CivicShield Volunteer &amp; Field Responder Network
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">
              Rapid Inspection &amp; Hazard Verification Dispatch
            </h1>
          </div>

          {/* Volunteer Profile Switcher */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Active Profile:</span>
            <select
              value={activeVolunteer.id}
              onChange={(e) => {
                const found = DEMO_VOLUNTEERS.find((v) => v.id === e.target.value);
                if (found) setActiveVolunteer(found);
              }}
              className="rounded-lg border border-cyan-800 bg-slate-900 px-3 py-1.5 text-xs text-cyan-300 font-semibold focus:border-cyan-400 focus:outline-none"
            >
              {DEMO_VOLUNTEERS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.title})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status / Claim Feedback Alert */}
        {claimFeedback && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between ${
              claimFeedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border border-red-800 text-red-300'
            }`}
          >
            <span>{claimFeedback.message}</span>
            <button
              onClick={() => setClaimFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'available'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Open Tasks Pool ({availableTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'claimed'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>My Active Dispatches ({myClaimedTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>My Completed Inspections ({completedTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split: Interactive Task Map + Task Action Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Task Map */}
        <div className="flex-1 relative h-72 sm:h-96 lg:h-full">
          <InteractiveMap
            incidents={displayIncidents}
            selectedIncident={selectedIncident}
            onSelectIncident={onSelectIncident}
            center={regionConfig.center}
            zoom={regionConfig.zoom}
          />
        </div>

        {/* Right Task Details / Claiming Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              {activeTab === 'available'
                ? 'Available Open Field Inspections'
                : activeTab === 'claimed'
                ? 'Your Claimed Missions'
                : 'Completed Reports Log'}
            </span>
            <span className="text-cyan-400 font-mono text-[11px]">
              {displayIncidents.length} tasks
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {displayIncidents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Shield className="h-8 w-8 text-cyan-500 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-200">No Tasks In This Category</p>
                <p className="mt-1 text-slate-400">
                  Switch to "Open Tasks Pool" to find nearby road hazards requiring verification.
                </p>
              </div>
            ) : (
              displayIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                const isClaimedByMe = incident.assignedVolunteer?.id === activeVolunteer.id;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.location.lat},${incident.location.lng}`;

                return (
                  <div
                    key={incident.id}
                    className={`p-3.5 text-xs transition flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-cyan-400'
                        : 'hover:bg-slate-900/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-300 font-bold text-[11px]">
                        {incident.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            incident.priority === 'critical'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-orange-950 text-orange-400 border border-orange-800'
                          }`}
                        >
                          {incident.priority}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-slate-100 line-clamp-1">
                      {incident.title}
                    </h4>

                    <p className="text-slate-300 line-clamp-2 text-[11px]">
                      {incident.description}
                    </p>

                    <div className="rounded bg-slate-900/90 p-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{incident.location.name}</span>
                      <span className="font-mono text-[10px] text-cyan-400">
                        [{incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}]
                      </span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Open in Google Maps directions button */}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 py-1.5 text-[11px] font-medium transition"
                        title="Opens Google Maps directions in a new tab"
                      >
                        <span>OPEN IN GOOGLE MAPS</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>

                      {/* Volunteer Claim / Inspect Button */}
                      {!incident.assignedVolunteer ? (
                        <button
                          onClick={() => handleClaimTask(incident.id)}
                          className="px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 text-[11px] transition shadow"
                        >
                          Volunteer for Task
                        </button>
                      ) : isClaimedByMe ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setInspectingIncident(incident);
                              setConfirmedSeverity(incident.priority);
                            }}
                            className="px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 text-[11px] transition shadow"
                          >
                            Submit Inspection
                          </button>
                          <button
                            onClick={() => handleReleaseTask(incident.id)}
                            className="px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] transition"
                            title="Release assignment back to pool"
                          >
                            Release
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Claimed by {incident.assignedVolunteer.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inspection Findings Submission Modal */}
      {inspectingIncident && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  Field Inspection Submission — {inspectingIncident.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectingIncident(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="p-5 space-y-4 text-xs">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Incident:</span>
                <p className="font-semibold text-slate-200">{inspectingIncident.title}</p>
                <p className="text-slate-400 text-[11px]">{inspectingIncident.location.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Site Verification Notes &amp; Physical Observations *
                </label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Measured 0.8m diameter, 10cm depth. Placed orange warning cone. Water pipe beneath asphalt appears dry."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Verified Severity Rating
                </label>
                <select
                  value={confirmedSeverity}
                  onChange={(e) => setConfirmedSeverity(e.target.value as IncidentPriority)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="critical">Critical (Immediate danger)</option>
                  <option value="high">High (Substantial traffic hazard)</option>
                  <option value="medium">Medium (Moderate road wear)</option>
                  <option value="low">Low (Cosmetic/Minor)</option>
                </select>
              </div>

              <div className="rounded-lg bg-cyan-950/20 border border-cyan-800/40 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recommendsClosure}
                    onChange={(e) => setRecommendsClosure(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    Recommend Resolution Sign-Off (Repair observed complete)
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 pl-5">
                  * Note: Volunteers submit inspection findings; official resolution approval is legally executed by Municipal Authority officers.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 text-xs transition shadow"
                >
                  Submit Inspection Report
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingIncident(null)}
                  className="px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
