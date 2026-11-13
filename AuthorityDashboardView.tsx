import React, { useState } from 'react';
import {
  Incident,
  IncidentLifecycleStage,
  IncidentPriority,
  SupportedRegion,
  TriageQueueType,
} from '../types/incident';
import { SUPPORTED_REGIONS } from '../data/seedIncidents';
import { InteractiveMap } from './InteractiveMap';
import { incidentService } from '../services/incidentService';
import {
  Building2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Filter,
  Search,
  ExternalLink,
  Bot,
  Activity,
  Layers,
  Check,
  RotateCcw,
  Flag,
  FileQuestion,
  Wrench,
  XCircle,
  HelpCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface AuthorityDashboardViewProps {
  incidents: Incident[];
  selectedRegion: SupportedRegion;
  onSelectIncident: (inc: Incident) => void;
  selectedIncident: Incident | null;
}

export const AuthorityDashboardView: React.FC<AuthorityDashboardViewProps> = ({
  incidents,
  selectedRegion,
  onSelectIncident,
  selectedIncident,
}) => {
  const regionConfig = SUPPORTED_REGIONS[selectedRegion] || SUPPORTED_REGIONS.Hyderabad;

  // Selected Triage Queue Tab (1-12)
  const [activeQueue, setActiveQueue] = useState<TriageQueueType>('new_reported');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOfficer, setActiveOfficer] = useState('Superintending Engineer (GHMC / Smart City)');

  // Triage Action Dialog state
  const [overridePriority, setOverridePriority] = useState<IncidentPriority>('critical');
  const [overrideRationale, setOverrideRationale] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  // Queue counts computed dynamically from data
  const queueCounts = incidentService.getTriageQueueCounts();

  // Incidents in active queue
  const queueIncidents = incidentService.getIncidentsByQueue(activeQueue).filter((inc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.location.name.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Triage action handlers
  const handleAdvanceStage = (id: string, stage: IncidentLifecycleStage, note?: string) => {
    incidentService.updateIncidentStage(id, stage, activeOfficer, 'AUTHORITY', note);
  };

  const handleOverridePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    incidentService.changePriority(
      selectedIncident.id,
      activeOfficer,
      overridePriority,
      overrideRationale.trim() || 'Officer discretion based on physical roadway inspection.'
    );
    setShowOverrideModal(false);
    setOverrideRationale('');
  };

  const handleFlagDuplicate = (id: string) => {
    incidentService.flagDuplicate(id, activeOfficer);
  };

  const handleApproveResolution = (id: string) => {
    incidentService.authorityReview(
      id,
      'approved',
      activeOfficer,
      reviewNoteInput.trim() || 'Official inspection verified. Rectification certified complete by municipal division.'
    );
    setReviewNoteInput('');
  };

  const handleRejectResolution = (id: string) => {
    incidentService.authorityReview(
      id,
      'rejected',
      activeOfficer,
      reviewNoteInput.trim() || 'Defect repair incomplete on physical re-inspection. Ordered contractor rework.'
    );
    setReviewNoteInput('');
  };

  // Compile real live activity stream
  const allEvents = incidents
    .flatMap((inc) =>
      inc.history.map((h) => ({
        ...h,
        incidentId: inc.id,
        incidentTitle: inc.title,
        isDemo: inc.isDemo,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const QUEUES: { key: TriageQueueType; label: string; count: number; color: string }[] = [
    { key: 'new_reported', label: '1. New Reports', count: queueCounts.new_reported, color: 'text-blue-400' },
    { key: 'awaiting_review', label: '2. Awaiting Review', count: queueCounts.awaiting_review, color: 'text-cyan-400' },
    { key: 'critical', label: '3. Critical Hazards', count: queueCounts.critical, color: 'text-red-400' },
    { key: 'high_priority', label: '4. High Priority', count: queueCounts.high_priority, color: 'text-orange-400' },
    { key: 'suspected_duplicates', label: '5. Suspected Duplicates', count: queueCounts.suspected_duplicates, color: 'text-amber-400' },
    { key: 'uncertain_ai', label: '6. Uncertain AI Detections', count: queueCounts.uncertain_ai, color: 'text-purple-400' },
    { key: 'manual_inspection_required', label: '7. Inspection Required', count: queueCounts.manual_inspection_required, color: 'text-yellow-400' },
    { key: 'assigned_field', label: '8. Assigned to Field', count: queueCounts.assigned_field, color: 'text-indigo-400' },
    { key: 'inspection_submitted', label: '9. Inspection Evidence Submitted', count: queueCounts.inspection_submitted, color: 'text-teal-400' },
    { key: 'repair_awaiting_approval', label: '10. Repair Awaiting Approval', count: queueCounts.repair_awaiting_approval, color: 'text-emerald-400' },
    { key: 'resolved', label: '11. Resolved & Verified', count: queueCounts.resolved, color: 'text-green-400' },
    { key: 'reopened', label: '12. Reopened Queue', count: queueCounts.reopened, color: 'text-rose-400' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] overflow-hidden bg-[#080d1a]">
      {/* Top Authority Header & Stats */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                Municipal Operations Command &bull; Incident Triage
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                Division: {regionConfig.displayName}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">
              12-Stage Incident Triage &amp; Lifecycle Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Officer ID:</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-semibold">
              {activeOfficer}
            </span>
          </div>
        </div>

        {/* 12-Queue Horizontal Selector */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {QUEUES.map((q) => (
            <button
              key={q.key}
              onClick={() => setActiveQueue(q.key)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeQueue === q.key
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{q.label}</span>
              <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-slate-950 ${q.color}`}>
                {q.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Interactive Map + Triage Action Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left: Interactive Map */}
        <div className="flex-1 relative h-72 sm:h-96 lg:h-full">
          <InteractiveMap
            incidents={queueIncidents}
            selectedIncident={selectedIncident}
            onSelectIncident={onSelectIncident}
            center={regionConfig.center}
            zoom={regionConfig.zoom}
          />
        </div>

        {/* Right: Selected Incident Triage Actions & Officer Workflow */}
        <div className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 flex flex-col overflow-hidden shadow-2xl">
          {/* Header of right panel */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              Active Queue: <strong className="text-cyan-400">{QUEUES.find((q) => q.key === activeQueue)?.label}</strong>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {queueIncidents.length} records
            </span>
          </div>

          {/* Incident Content */}
          {selectedIncident ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* ID & Priority Badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded">
                  {selectedIncident.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      selectedIncident.priority === 'critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : selectedIncident.priority === 'high'
                        ? 'bg-orange-950 text-orange-400 border border-orange-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {selectedIncident.priority}
                  </span>
                  <button
                    onClick={() => {
                      setOverridePriority(selectedIncident.priority);
                      setOverrideRationale(selectedIncident.triagePriorityRationale || '');
                      setShowOverrideModal(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Override
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {selectedIncident.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Transparent Triage Prioritization Explanation Badge */}
              <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-3 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px] uppercase tracking-wider">
                  <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Prioritization Assessment Rationale:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed italic">
                  "{selectedIncident.triagePriorityRationale || 'Standard hazard assessment applied.'}"
                </p>
              </div>

              {/* Location details */}
              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-200 font-medium">{selectedIncident.location.name}</div>
                <div className="text-slate-400 text-[11px] font-mono">
                  Coordinates: {selectedIncident.location.lat.toFixed(6)}, {selectedIncident.location.lng.toFixed(6)}
                </div>
              </div>

              {/* Triage Actions Grid */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                  Officer Triage Execution Actions:
                </span>

                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => handleAdvanceStage(selectedIncident.id, 'under_review', 'Report accepted for technical review')}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition text-center"
                  >
                    Accept for Review
                  </button>
                  <button
                    onClick={() => handleAdvanceStage(selectedIncident.id, 'inspection_required', 'Field verification dispatched')}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition text-center"
                  >
                    Mark Inspection Required
                  </button>
                  <button
                    onClick={() => handleFlagDuplicate(selectedIncident.id)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-yellow-300 transition text-center flex items-center justify-center gap-1"
                  >
                    <Flag className="h-3 w-3" />
                    <span>Flag as Duplicate</span>
                  </button>
                  <button
                    onClick={() => handleAdvanceStage(selectedIncident.id, 'repair_required', 'Direct repair order issued')}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition text-center flex items-center justify-center gap-1"
                  >
                    <Wrench className="h-3 w-3" />
                    <span>Order Repair</span>
                  </button>
                </div>

                {/* Official Resolution Approval / Rejection */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase block">
                    Official Sign-Off / Rework Notes:
                  </label>
                  <input
                    type="text"
                    value={reviewNoteInput}
                    onChange={(e) => setReviewNoteInput(e.target.value)}
                    placeholder="Enter official sign-off or contractor rework note..."
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveResolution(selectedIncident.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 text-xs transition shadow"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve Resolution</span>
                    </button>
                    <button
                      onClick={() => handleRejectResolution(selectedIncident.id)}
                      className="px-3 rounded bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 py-1.5 text-xs transition"
                    >
                      Reject Closure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs border-b border-slate-800">
              <Layers className="h-8 w-8 text-cyan-500 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-200">No Incident Selected in Queue</p>
              <p className="mt-1">
                Select any incident from the list or click a map marker to execute triage actions.
              </p>
            </div>
          )}

          {/* Live Incident Activity Stream */}
          <div className="h-52 flex flex-col p-3 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-cyan-400" />
                Live Incident Audit Feed
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Real-Time State Transitions
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {allEvents.map((evt, idx) => (
                <div key={idx} className="rounded bg-slate-900/60 p-2 border border-slate-800/80 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-300 font-mono">{evt.incidentId}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="font-medium text-slate-200 text-[11px]">
                    {evt.action}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    By {evt.actor} ({evt.role})
                  </div>
                  {evt.details && (
                    <div className="text-[10px] text-slate-400 italic">
                      "{evt.details}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Override Priority Modal */}
      {showOverrideModal && selectedIncident && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              <span>Override Priority Rating — {selectedIncident.id}</span>
            </h3>

            <form onSubmit={handleOverridePrioritySubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  New Priority Level
                </label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value as IncidentPriority)}
                  className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="critical">Critical (Immediate danger)</option>
                  <option value="high">High (Substantial traffic hazard)</option>
                  <option value="medium">Medium (Moderate road wear)</option>
                  <option value="low">Low (Cosmetic)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Recorded Override Rationale *
                </label>
                <textarea
                  rows={3}
                  value={overrideRationale}
                  onChange={(e) => setOverrideRationale(e.target.value)}
                  placeholder="State engineering reasons for adjusting priority..."
                  className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 text-xs transition shadow"
                >
                  Confirm Priority Override
                </button>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
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
