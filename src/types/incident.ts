export type IncidentCategory =
  // Road damage (1-10)
  | 'Potholes'
  | 'Deep potholes'
  | 'Shallow potholes'
  | 'Road cracks'
  | 'Longitudinal cracks'
  | 'Transverse cracks'
  | 'Alligator cracking'
  | 'Broken road surfaces'
  | 'Uneven road surfaces'
  | 'Road subsidence'
  | 'Damaged road shoulders'
  | 'Road erosion'
  | 'Road obstructions'
  // Drainage and water (11-18)
  | 'Waterlogging'
  | 'Flooded roads'
  | 'Water leakage'
  | 'Burst water pipelines'
  | 'Blocked drains'
  | 'Open drains'
  | 'Overflowing drains'
  | 'Open drainage holes'
  | 'Damaged manholes'
  | 'Open manholes'
  | 'Missing manhole covers'
  | 'Sewer overflow'
  | 'Damaged drainage infrastructure'
  // Street, electrical & other hazards (19-28)
  | 'Fallen trees'
  | 'Fallen branches'
  | 'Fallen electrical wires'
  | 'Exposed electrical wires'
  | 'Debris on roads'
  | 'Garbage accumulation'
  | 'Illegal dumping'
  | 'Broken streetlights'
  | 'Non-functioning streetlights'
  | 'Damaged traffic signs'
  | 'Damaged road barriers'
  | 'Damaged pedestrian crossings'
  | 'Damaged footpaths'
  | 'Unsafe pedestrian walkways'
  | 'Broken kerbs'
  | 'Damaged public infrastructure'
  | 'Damaged road infrastructure'
  | 'Damaged bus-stop infrastructure'
  | 'Unsafe roadside construction'
  | 'Other civic infrastructure issues';

export type PotholeClassification =
  | 'POTHOLE DETECTED'
  | 'POSSIBLY DEEP POTHOLE'
  | 'SHALLOW POTHOLE'
  | 'SEVERE ROAD DAMAGE'
  | 'DEPTH UNKNOWN'
  | 'MANUAL MEASUREMENT REQUIRED';

export type DepthEstimationMethod =
  | 'Calibrated Stereo Depth'
  | 'Monocular Photogrammetry (Known Scale Reference)'
  | 'LiDAR Point Cloud / Time-of-Flight'
  | 'Uncalibrated Monocular RGB (Depth Unknown)'
  | 'Authorised Inspector Caliper (Physical Verification)';

export interface PotholeDimensionData {
  classification: PotholeClassification;
  estimatedDepthCm: number | null;
  estimatedDiameterCm: number | null;
  estimatedVolumeLiters?: number | null;
  estimationMethod: DepthEstimationMethod;
  calibrationReference?: string;
  isSubgradeExposed: boolean;
  manualVerification?: {
    verifiedBy: string;
    verifiedAt: string;
    actualDepthCm: number;
    actualDiameterCm: number;
    subgradeConfirmed: boolean;
    inspectorNotes: string;
  };
}

export type QuickFilterCategory =
  | 'all'
  | 'road-damage'
  | 'potholes'
  | 'drainage'
  | 'waterlogging'
  | 'streetlights'
  | 'electrical'
  | 'garbage'
  | 'pedestrian'
  | 'infrastructure'
  | 'other';

export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';

export type IncidentLifecycleStage =
  | 'new_report'
  | 'initial_triage'
  | 'under_review'
  | 'inspection_required'
  | 'assigned'
  | 'inspection_in_progress'
  | 'inspection_submitted'
  | 'repair_required'
  | 'repair_in_progress'
  | 'repair_evidence_submitted'
  | 'awaiting_authority_verification'
  | 'resolved'
  | 'reopened';

export type TriageQueueType =
  | 'new_reported'
  | 'awaiting_review'
  | 'critical'
  | 'high_priority'
  | 'suspected_duplicates'
  | 'uncertain_ai'
  | 'manual_inspection_required'
  | 'assigned_field'
  | 'inspection_submitted'
  | 'repair_awaiting_approval'
  | 'resolved'
  | 'reopened';

export type SupportedRegion =
  | 'Hyderabad'
  | 'Bengaluru'
  | 'Chennai'
  | 'Mumbai'
  | 'Delhi'
  | 'Pune';

export interface IncidentLocation {
  name: string;
  region: SupportedRegion | string;
  lat: number;
  lng: number;
  address?: string;
  accuracyMeters?: number;
  roadCorridorId?: string;
}

export interface AIDetectionResult {
  detectedCategory: string;
  confidence: number; // 0 - 1
  severityScore: number; // 1 - 10
  damageType: string;
  bbox?: [number, number, number, number]; // [x%, y%, width%, height%]
  measuredSurfaceDamageEstimated?: string; // Must be labeled as estimated / approximate
  measurementMethod: 'Visual Estimate' | 'Photogrammetric Approx' | 'Manual Required';
  modelSource: string;
  detectionTimestamp: string;
  isUncertain?: boolean;
  potholeDimensions?: PotholeDimensionData;
}

export interface IncidentHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: 'CITIZEN' | 'VOLUNTEER' | 'AUTHORITY' | 'SYSTEM' | 'DEMO_DISPATCHER';
  action: string;
  details?: string;
  fromStage?: IncidentLifecycleStage;
  toStage?: IncidentLifecycleStage;
}

export interface Incident {
  id: string; // E.g. DEMO-001, CS-HYD-4091
  title: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentLifecycleStage;
  triagePriorityRationale: string;
  description: string;
  location: IncidentLocation;
  timestamp: string;
  photoUrl?: string;
  isDemo: boolean;
  dataSource: 'GENUINE_CITIZEN_REPORT' | 'SYNTHETIC_DEMO';
  isDuplicateSuspected?: boolean;
  reporter: {
    name: string;
    isAnonymous: boolean;
    contact?: string;
  };
  aiDetection?: AIDetectionResult;
  potholeDimensions?: PotholeDimensionData;
  assignedVolunteer?: {
    id: string;
    name: string;
    phone?: string;
    assignedAt: string;
    status: 'assigned' | 'inspecting' | 'completed';
  };
  inspection?: {
    inspectorId: string;
    inspectorName: string;
    inspectionDate: string;
    notes: string;
    photoUrl?: string;
    severityConfirmed: IncidentPriority;
    recommendsClosure: boolean;
  };
  authorityReview?: {
    officerName: string;
    reviewedAt: string;
    decision: 'approved' | 'rejected' | 'reopened';
    notes: string;
  };
  history: IncidentHistoryEntry[];
}

export interface RegionConfig {
  name: SupportedRegion;
  displayName: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  state: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  coordinates: [number, number][]; // Array of [lat, lng]
  status: 'scanning' | 'critical' | 'elevated_risk' | 'monitored' | 'verified_safe';
  riskScore: number; // 0 - 100
  hazardIncidentIds: string[];
}

export interface RoadCorridor {
  id: string;
  name: string;
  region: SupportedRegion;
  description: string;
  segments: RoadSegment[];
  startCoords: [number, number];
  endCoords: [number, number];
}
