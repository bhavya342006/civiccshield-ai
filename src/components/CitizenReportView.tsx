import React, { useState } from 'react';
import {
  IncidentCategory,
  IncidentPriority,
  SupportedRegion,
  Incident,
  AIDetectionResult,
} from '../types/incident';
import { SUPPORTED_REGIONS } from '../data/seedIncidents';
import { LocationPickerMap } from './LocationPickerMap';
import { incidentService } from '../services/incidentService';
import {
  AlertCircle,
  CheckCircle2,
  Camera,
  MapPin,
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface CitizenReportViewProps {
  currentRegion: SupportedRegion;
  onReportSubmitted: (newIncident: Incident) => void;
  onOpenMap: () => void;
}

const CATEGORIES: { group: string; items: IncidentCategory[] }[] = [
  {
    group: 'Road Damage (1-12)',
    items: [
      'Potholes',
      'Deep potholes',
      'Road cracks',
      'Longitudinal cracks',
      'Transverse cracks',
      'Alligator cracking',
      'Broken road surfaces',
      'Road subsidence',
      'Uneven road surfaces',
      'Damaged road shoulders',
      'Road erosion',
      'Road obstructions',
    ],
  },
  {
    group: 'Drainage & Water (13-24)',
    items: [
      'Water leakage',
      'Burst water pipelines',
      'Waterlogging',
      'Flooded roads',
      'Blocked drains',
      'Overflowing drains',
      'Open drainage holes',
      'Damaged manholes',
      'Open manholes',
      'Missing manhole covers',
      'Sewer overflow',
      'Damaged drainage infrastructure',
    ],
  },
  {
    group: 'Street & Public Infrastructure (25-43)',
    items: [
      'Broken streetlights',
      'Non-functioning streetlights',
      'Damaged traffic signs',
      'Damaged road barriers',
      'Damaged pedestrian crossings',
      'Damaged footpaths',
      'Unsafe pedestrian walkways',
      'Broken kerbs',
      'Damaged public infrastructure',
      'Exposed electrical wires',
      'Fallen electrical wires',
      'Fallen trees',
      'Fallen branches',
      'Debris on roads',
      'Garbage accumulation',
      'Illegal dumping',
      'Damaged bus-stop infrastructure',
      'Unsafe roadside construction',
      'Other civic infrastructure issues',
    ],
  },
];

export const CitizenReportView: React.FC<CitizenReportViewProps> = ({
  currentRegion,
  onReportSubmitted,
  onOpenMap,
}) => {
  const regionConfig = SUPPORTED_REGIONS[currentRegion] || SUPPORTED_REGIONS.Hyderabad;
  const [centerLat, centerLng] = regionConfig.center;

  // Form State
  const [category, setCategory] = useState<IncidentCategory>('Deep potholes');
  const [priority, setPriority] = useState<IncidentPriority>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Map Selected Location State
  const [selectedLoc, setSelectedLoc] = useState({
    lat: centerLat,
    lng: centerLng,
    name: `${currentRegion} Main Road`,
    address: `${currentRegion}, ${regionConfig.state}`,
  });

  // Attached AI Detection
  const [attachedAi, setAttachedAi] = useState<AIDetectionResult | null>(null);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle location update from interactive LocationPickerMap
  const handleLocationChange = (loc: {
    lat: number;
    lng: number;
    name: string;
    address?: string;
  }) => {
    setSelectedLoc({
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      address: loc.address || `${loc.name}, ${currentRegion}`,
    });
  };

  // Sample photo generator with simulated AI defect detection
  const handleLoadSamplePhoto = (sampleType: 'pothole' | 'crack' | 'manhole') => {
    if (sampleType === 'pothole') {
      setPhotoUrl(
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
      );
      setCategory('Deep potholes');
      setTitle('Dangerous Deep Asphalt Pothole');
      setDescription(
        'Significant pothole located in active vehicular lane. Edges are sharp and exposed aggregate is flying when heavy buses pass.'
      );
      setPriority('critical');
      setAttachedAi({
        detectedCategory: 'Pothole (Severity Grade 3)',
        confidence: 0.96,
        severityScore: 9.1,
        damageType: 'Asphalt Delamination & Cavity',
        bbox: [24, 35, 52, 48],
        measuredSurfaceDamageEstimated: '~0.85m diameter, 10cm depth',
        measurementMethod: 'Visual Estimate',
        modelSource: 'CivicShield YOLOv11-RoadDefect Edge',
        detectionTimestamp: new Date().toISOString(),
      });
    } else if (sampleType === 'crack') {
      setPhotoUrl(
        'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80'
      );
      setCategory('Alligator cracking');
      setTitle('Extensive Network Asphalt Cracks');
      setDescription(
        'Alligator and longitudinal cracking pattern spreading along road crown. Prone to water infiltration and rapid breakdown.'
      );
      setPriority('high');
      setAttachedAi({
        detectedCategory: 'Longitudinal & Fatigue Cracking',
        confidence: 0.89,
        severityScore: 7.4,
        damageType: 'Fatigue / Alligator Cracking',
        bbox: [15, 20, 70, 60],
        measuredSurfaceDamageEstimated: 'Over 25 meters surface length',
        measurementMethod: 'Visual Estimate',
        modelSource: 'CivicShield YOLOv11-RoadDefect Edge',
        detectionTimestamp: new Date().toISOString(),
      });
    } else {
      setPhotoUrl(
        'https://images.unsplash.com/photo-1584463699042-4b26792b95fa?auto=format&fit=crop&w=800&q=80'
      );
      setCategory('Open manholes');
      setTitle('Displaced Chamber Lid on Pedestrian Shoulder');
      setDescription(
        'Heavy stormwater chamber lid ajar. Critical fall danger for pedestrians, elderly, and two-wheelers.'
      );
      setPriority('critical');
      setAttachedAi({
        detectedCategory: 'Displaced Utility Manhole / Lid',
        confidence: 0.93,
        severityScore: 9.4,
        damageType: 'Infrastructure Dislocation',
        bbox: [28, 22, 45, 55],
        measuredSurfaceDamageEstimated: '0.65m open drop',
        measurementMethod: 'Visual Estimate',
        modelSource: 'CivicShield YOLOv11-RoadDefect Edge',
        detectionTimestamp: new Date().toISOString(),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a short descriptive title for the hazard.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide hazard details so authorities can deploy the right crew.');
      return;
    }
    if (!selectedLoc.lat || !selectedLoc.lng) {
      setFormError('Please select a valid location on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new genuine citizen report saved to shared incident service
      const newReport = incidentService.createIncident({
        title: title.trim(),
        category,
        priority,
        status: 'new_report',
        triagePriorityRationale: `Citizen submitted report with recommended ${priority.toUpperCase()} priority. Pending municipal triage.`,
        description: description.trim(),
        location: {
          name: selectedLoc.name || `${currentRegion} Incident Site`,
          region: currentRegion,
          lat: selectedLoc.lat,
          lng: selectedLoc.lng,
          address: selectedLoc.address,
          accuracyMeters: 5,
        },
        photoUrl: photoUrl.trim() || undefined,
        isDemo: false,
        dataSource: 'GENUINE_CITIZEN_REPORT',
        reporter: {
          name: isAnonymous ? 'Anonymous Citizen' : reporterName.trim() || 'Civic Citizen',
          isAnonymous,
        },
        aiDetection: attachedAi || undefined,
      });

      setSubmittedIncident(newReport);
      onReportSubmitted(newReport);
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError('Error submitting report: ' + err.message);
    }
  };

  // If successfully submitted, display confirmation view
  if (submittedIncident) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 rounded-2xl border border-emerald-500/40 bg-slate-900/90 shadow-2xl text-slate-100">
        <div className="flex items-center gap-3 text-emerald-400 mb-4 pb-4 border-b border-slate-800">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Report Successfully Dispatched</h3>
            <p className="text-xs text-slate-400">
              Your genuine citizen report has been logged and synchronized with the Authority Command Center.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Official Incident ID
              </span>
              <span className="font-mono text-cyan-300 font-bold text-sm">
                {submittedIncident.id}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Initial Status
              </span>
              <span className="font-semibold text-blue-400 uppercase">
                {submittedIncident.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Hazard Category
              </span>
              <span className="font-medium text-slate-200">
                {submittedIncident.category}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Priority Level
              </span>
              <span className="font-semibold uppercase text-orange-400">
                {submittedIncident.priority}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Stored Geographic Coordinates
            </span>
            <div className="font-mono text-cyan-400">
              Lat: {submittedIncident.location.lat.toFixed(6)}, Lng: {submittedIncident.location.lng.toFixed(6)}
            </div>
            <div className="text-slate-300">{submittedIncident.location.name}</div>
            <div className="text-slate-400 text-[11px]">{submittedIncident.location.address}</div>
          </div>

          {submittedIncident.aiDetection && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-cyan-300">
              <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                <Bot className="h-4 w-4" />
                <span>AI Computer Vision Defect Record Linked</span>
              </div>
              <p className="text-[11px] text-cyan-200">
                {submittedIncident.aiDetection.detectedCategory} &bull; Score {submittedIncident.aiDetection.severityScore}/10
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              onClick={onOpenMap}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 transition shadow-lg shadow-cyan-900/30 text-xs"
            >
              <span>View On Live Incident Map</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedIncident(null);
                setTitle('');
                setDescription('');
                setPhotoUrl('');
                setAttachedAi(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 pb-12">
      {/* View Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="h-4 w-4" />
          <span>Citizen Civic Response Portal</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Report Road Hazard or Infrastructure Defect
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select the exact location on the interactive OpenStreetMap below. Your report is directly synchronized to the Municipal Authority Command Center.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Interactive Map Location Picker */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-bold font-mono">
                1
              </span>
              <h3 className="text-sm font-semibold text-white">
                Select Exact Geographic Location
              </h3>
            </div>
            <span className="text-[11px] text-cyan-400">
              Region: {regionConfig.displayName}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Click anywhere on the map or drag the pin. You can also search for a road name or click <strong>Use My GPS</strong>.
          </p>

          <LocationPickerMap
            initialLat={selectedLoc.lat}
            initialLng={selectedLoc.lng}
            selectedName={selectedLoc.name}
            onLocationChange={handleLocationChange}
            className="h-80 w-full"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Road / Landmark Name
              </label>
              <input
                type="text"
                value={selectedLoc.name}
                onChange={(e) => setSelectedLoc({ ...selectedLoc, name: e.target.value })}
                placeholder="e.g. Hitec City Main Road, Cyber Towers Junction"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Full Address / Description
              </label>
              <input
                type="text"
                value={selectedLoc.address || ''}
                onChange={(e) => setSelectedLoc({ ...selectedLoc, address: e.target.value })}
                placeholder="Near Peddamma Temple Metro, Jubilee Hills"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Problem Details & Category */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-bold font-mono">
              2
            </span>
            <h3 className="text-sm font-semibold text-white">
              Hazard Category &amp; Severity Assessment
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Problem Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {CATEGORIES.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.items.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Citizen Recommended Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="critical">Critical (Immediate collision or fall hazard)</option>
                <option value="high">High (Severe road obstruction or deep defect)</option>
                <option value="medium">Medium (Moderate road wear, surface crack)</option>
                <option value="low">Low (Minor cosmetic issue)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Short Hazard Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Pothole on Flyover Down-Ramp causing skidding"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Detailed Description &amp; Traffic Impact *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the depth, exact lane, proximity to intersections, and whether two-wheelers are being affected..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none leading-relaxed"
              required
            />
          </div>
        </div>

        {/* Step 3: Photo Upload & AI Computer Vision Defect Scanner */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-bold font-mono">
                3
              </span>
              <h3 className="text-sm font-semibold text-white">
                Photo Evidence &amp; AI Defect Analysis
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Optional</span>
          </div>

          {/* Quick Demo Pre-load buttons */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
            <span className="text-[11px] text-slate-400 font-semibold block mb-2">
              ⚡ Quick Load Hackathon Test Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLoadSamplePhoto('pothole')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition"
              >
                Sample 1: Deep Pothole
              </button>
              <button
                type="button"
                onClick={() => handleLoadSamplePhoto('crack')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition"
              >
                Sample 2: Road Surface Crack
              </button>
              <button
                type="button"
                onClick={() => handleLoadSamplePhoto('manhole')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition"
              >
                Sample 3: Open Manhole
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Photo URL / Hosted Image
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Photo & Attached AI Analysis Preview */}
          {photoUrl && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black max-h-56 flex items-center justify-center">
                <img
                  src={photoUrl}
                  alt="Road hazard preview"
                  className="max-h-56 w-full object-cover"
                />
                {attachedAi?.bbox && (
                  <div
                    className="absolute border-2 border-cyan-400 bg-cyan-400/20 rounded pointer-events-none"
                    style={{
                      left: `${attachedAi.bbox[0]}%`,
                      top: `${attachedAi.bbox[1]}%`,
                      width: `${attachedAi.bbox[2]}%`,
                      height: `${attachedAi.bbox[3]}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 bg-cyan-600 text-black font-bold font-mono text-[9px] px-1 py-0.5 rounded">
                      {attachedAi.detectedCategory} ({(attachedAi.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                )}
              </div>

              {attachedAi && (
                <div className="rounded-lg bg-cyan-950/30 border border-cyan-800/60 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-cyan-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Bot className="h-4 w-4" />
                      Attached Computer Vision Defect Diagnostics
                    </span>
                    <span className="font-mono text-[10px]">
                      {(attachedAi.confidence * 100).toFixed(0)}% Visual Confidence
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Defect Type: <strong>{attachedAi.damageType}</strong> &bull; Estimated Area: {attachedAi.measuredSurfaceDamageEstimated}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Reporter Details */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-bold font-mono">
              4
            </span>
            <h3 className="text-sm font-semibold text-white">
              Reporter Identification
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Submit report anonymously</span>
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Your Full Name or Handle
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {formError && (
          <div className="p-3 rounded-xl border border-red-500/50 bg-red-950/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-6 shadow-xl shadow-cyan-900/30 transition text-sm disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Dispatching to Authority Command...' : 'Submit Incident to Authority Command Center'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
