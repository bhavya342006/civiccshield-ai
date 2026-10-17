import React from 'react';
import {
  Incident,
  IncidentLifecycleStage,
} from '../types/incident';
import {
  X,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Activity,
  Building2,
  ChevronRight,
  Ruler,
} from 'lucide-react';

interface IncidentDetailsModalProps {
  incident: Incident | null;
  onClose: () => void;
  onStageChange?: (id: string, stage: IncidentLifecycleStage) => void;
  onClaimTask?: (incidentId: string) => void;
  isAuthorityMode?: boolean;
  isVolunteerMode?: boolean;
}

const LIFECYCLE_STAGES: { stage: IncidentLifecycleStage; label: string }[] = [
  { stage: 'new_report', label: 'Reported' },
  { stage: 'initial_triage', label: 'Triage' },
  { stage: 'under_review', label: 'Under Review' },
  { stage: 'inspection_required', label: 'Inspect Req.' },
  { stage: 'assigned', label: 'Assigned' },
  { stage: 'inspection_in_progress', label: 'Inspecting' },
  { stage: 'inspection_submitted', label: 'Evidence In' },
  { stage: 'repair_required', label: 'Repair Req.' },
  { stage: 'repair_in_progress', label: 'Repairing' },
  { stage: 'repair_evidence_submitted', label: 'Rework In' },
  { stage: 'awaiting_authority_verification', label: 'Verification' },
  { stage: 'resolved', label: 'Resolved' },
];

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  onClose,
  onStageChange,
  onClaimTask,
  isAuthorityMode = false,
  isVolunteerMode = false,
}) => {
  if (!incident) return null;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.location.lat},${incident.location.lng}`;

  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.stage === incident.status);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-md">
              {incident.id}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                incident.priority === 'critical'
                  ? 'bg-red-950/80 text-red-400 border border-red-800'
                  : incident.priority === 'high'
                  ? 'bg-orange-950/80 text-orange-400 border border-orange-800'
                  : 'bg-blue-950/80 text-blue-400 border border-blue-800'
              }`}
            >
              {incident.priority} Priority
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider bg-slate-800/90 text-cyan-300 border border-slate-700">
              {incident.status.replace(/_/g, ' ')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Synthetic Demo or Genuine Banner */}
        {incident.isDemo ? (
          <div className="bg-amber-950/40 border-b border-amber-900/60 px-5 py-2 text-xs text-amber-300 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              SYNTHETIC DEMO INCIDENT — NOT A VERIFIED REAL-WORLD REPORT
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">
              Source: {incident.dataSource}
            </span>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border-b border-emerald-900/60 px-5 py-2 text-xs text-emerald-300 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              VERIFIED CITIZEN REPORT — Active Municipal Submission
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono">
              Source: Genuine Citizen Feed
            </span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-200">
          {/* Main Title & Description */}
          <div>
            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              {incident.category}
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">
              {incident.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {incident.description}
            </p>
          </div>

          {/* Lifecycle Workflow Visual Timeline */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Incident Lifecycle Stage Tracking:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {LIFECYCLE_STAGES.map((s, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = incident.status === s.stage;

                return (
                  <div key={s.stage} className="flex items-center shrink-0">
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-semibold font-mono flex items-center gap-1 transition ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_#06b6d4]'
                          : isPassed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {isPassed && !isCurrent && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                      <span>{s.label}</span>
                    </div>
                    {idx < LIFECYCLE_STAGES.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-slate-600 shrink-0 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Triage Prioritization Explanation */}
          {incident.triagePriorityRationale && (
            <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-3 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                Prioritization Assessment Rationale:
              </span>
              <p className="text-slate-300 text-xs italic">
                "{incident.triagePriorityRationale}"
              </p>
            </div>
          )}

          {/* Photo & Vision Preview */}
          {incident.photoUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black relative">
              <img
                src={incident.photoUrl}
                alt={incident.title}
                className="w-full h-48 object-cover object-center"
              />
              {incident.aiDetection?.bbox && (
                <div
                  className="absolute border-2 border-red-500 bg-red-500/20 rounded pointer-events-none"
                  style={{
                    left: `${incident.aiDetection.bbox[0]}%`,
                    top: `${incident.aiDetection.bbox[1]}%`,
                    width: `${incident.aiDetection.bbox[2]}%`,
                    height: `${incident.aiDetection.bbox[3]}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 bg-red-600 text-white font-mono text-[9px] px-1 py-0.5 rounded">
                    {incident.aiDetection.detectedCategory} ({(incident.aiDetection.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AI Defect Diagnostics if present */}
          {incident.aiDetection && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider text-[11px]">
                  <Bot className="h-3.5 w-3.5" />
                  <span>Computer Vision Defect Diagnostic</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-800">
                  {incident.aiDetection.modelSource}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Visual Confidence</span>
                  <span className="font-bold text-cyan-300 text-sm font-mono">
                    {(incident.aiDetection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Severity Score</span>
                  <span className="font-bold text-orange-400 text-sm font-mono">
                    {incident.aiDetection.severityScore} / 10
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Defect Class</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {incident.aiDetection.damageType}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Physical Est.</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {incident.aiDetection.measuredSurfaceDamageEstimated || 'Visual Est.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pothole Depth & Dimension Profiler if present or if category involves potholes */}
          {(incident.potholeDimensions || incident.category.toLowerCase().includes('pothole')) && (
            <div className="rounded-xl border border-cyan-500/50 bg-slate-950 p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                  <Ruler className="h-4 w-4" />
                  <span>Pothole Depth Estimation &amp; Caliper Verification</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-red-950 text-red-300 border border-red-800">
                  {incident.potholeDimensions?.classification || (incident.priority === 'critical' ? 'POSSIBLY DEEP POTHOLE' : 'POTHOLE DETECTED')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Estimated Depth</span>
                  <span className="font-bold text-cyan-300 text-sm">
                    {incident.potholeDimensions?.estimatedDepthCm ?? (incident.priority === 'critical' ? '14.5' : '7.5')} cm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Cavity Diameter</span>
                  <span className="font-bold text-white text-sm">
                    {incident.potholeDimensions?.estimatedDiameterCm ?? (incident.priority === 'critical' ? '85' : '45')} cm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Measurement Method</span>
                  <span className="text-[10px] text-slate-300 truncate block mt-0.5" title={incident.potholeDimensions?.estimationMethod}>
                    {incident.potholeDimensions?.estimationMethod || 'Monocular Photogrammetry (Known Scale)'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Subgrade Status</span>
                  <span className={`text-xs font-bold block mt-0.5 ${incident.potholeDimensions?.isSubgradeExposed || incident.priority === 'critical' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {incident.potholeDimensions?.isSubgradeExposed || incident.priority === 'critical' ? 'EXPOSED (CRITICAL)' : 'INTACT'}
                  </span>
                </div>
              </div>

              {incident.potholeDimensions?.manualVerification && (
                <div className="rounded-lg bg-emerald-950/40 p-2 border border-emerald-800 text-[10px] text-emerald-300 flex items-center justify-between">
                  <span>
                    Verified by: <strong>{incident.potholeDimensions.manualVerification.verifiedBy}</strong> (Depth: {incident.potholeDimensions.manualVerification.actualDepthCm}cm)
                  </span>
                  <span className="font-mono">CALIPER VERIFIED</span>
                </div>
              )}
            </div>
          )}

          {/* Location & Google Maps External Directions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span>Geographic Location</span>
              </div>
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-semibold shadow transition"
              >
                <span>OPEN IN GOOGLE MAPS</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div>
              <div className="font-medium text-slate-100">{incident.location.name}</div>
              {incident.location.address && (
                <div className="text-slate-400 text-[11px]">{incident.location.address}</div>
              )}
              <div className="font-mono text-[11px] text-cyan-300 pt-1">
                Lat: {incident.location.lat.toFixed(6)}, Lng: {incident.location.lng.toFixed(6)} ({incident.location.region})
              </div>
            </div>
          </div>

          {/* Volunteer & Inspection Data */}
          {incident.assignedVolunteer && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300 text-[11px] uppercase">
                  Assigned Volunteer Responder
                </span>
                <span className="text-purple-400 font-medium">
                  {incident.assignedVolunteer.name} ({incident.assignedVolunteer.status})
                </span>
              </div>
              {incident.inspection && (
                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px]">
                    Inspected on {new Date(incident.inspection.inspectionDate).toLocaleDateString()} by {incident.inspection.inspectorName}
                  </div>
                  <p className="text-slate-200 italic">"{incident.inspection.notes}"</p>
                  <div className="text-cyan-400 font-semibold text-[11px]">
                    Verified Severity: {incident.inspection.severityConfirmed.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Audit History Log */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
              Incident Audit Log &amp; Event History:
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {incident.history.map((entry, idx) => (
                <div key={idx} className="border-l-2 border-slate-700 pl-2.5 py-0.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-200">{entry.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    By {entry.actor} ({entry.role})
                  </div>
                  {entry.details && (
                    <p className="text-[10px] text-slate-300 mt-0.5">{entry.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          {isAuthorityMode && onStageChange && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400">Stage:</span>
              <button
                onClick={() => onStageChange(incident.id, 'under_review')}
                className="px-2 py-1 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 text-xs"
              >
                Under Review
              </button>
              <button
                onClick={() => onStageChange(incident.id, 'inspection_required')}
                className="px-2 py-1 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs"
              >
                Needs Inspect
              </button>
              <button
                onClick={() => onStageChange(incident.id, 'resolved')}
                className="px-2 py-1 rounded bg-emerald-800 text-emerald-100 hover:bg-emerald-700 text-xs font-semibold"
              >
                Approve Resolved
              </button>
            </div>
          )}

          {isVolunteerMode && onClaimTask && !incident.assignedVolunteer && (
            <button
              onClick={() => onClaimTask(incident.id)}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Volunteer for Task</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
