import React, { useState, useEffect, useRef } from 'react';
import {
  Incident,
  IncidentCategory,
  IncidentPriority,
  PotholeClassification,
  DepthEstimationMethod,
  PotholeDimensionData,
} from '../types/incident';
import { incidentService } from '../services/incidentService';
import { voiceAssistantService } from '../services/voiceAssistantService';
import {
  Shield,
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipForward,
  Camera,
  Navigation,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Scan,
  Gauge,
  Activity,
  Layers,
  Info,
  Radio,
  Sliders,
  Eye,
  EyeOff,
  Video,
  VideoOff,
  Crosshair,
  MapPin,
  RefreshCw,
  Ruler,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface ActiveRoadScannerViewProps {
  onBackToHome: () => void;
  onNavigateToTriage?: () => void;
  onNavigateToMap?: () => void;
}

export interface ScannerScenario {
  id: string;
  category: IncidentCategory;
  group: 'Road damage' | 'Drainage and water' | 'Other road hazards';
  displayTitle: string;
  trackingId: string;
  demoConfidence: number; // e.g. 91%
  simulatedDistanceMeters: number; // e.g. 14
  priority: IncidentPriority;
  rdd2022Class: string;
  description: string;
  voiceAlertText: string;
  bbox: [number, number, number, number]; // [left%, top%, width%, height%]
  coordinates: { lat: number; lng: number; name: string };
  bgRoadImage: string;
  // Pothole depth profile data
  potholeData?: PotholeDimensionData;
}

// 28 Complete Scenarios categorized exactly as requested
export const SCANNER_SCENARIOS_28: ScannerScenario[] = [
  // --- ROAD DAMAGE (1 - 10) ---
  {
    id: 'sc-1-pothole',
    group: 'Road damage',
    category: 'Potholes',
    displayTitle: 'ASPHALT SURFACE POTHOLE',
    trackingId: 'DEMO-TRK-101',
    demoConfidence: 89,
    simulatedDistanceMeters: 18,
    priority: 'high',
    rdd2022Class: 'D40 (Pothole Cavity)',
    description: 'Circular asphalt depression with visible surface rim degradation. Cavity depth approximately 7.5cm, diameter ~45cm.',
    voiceAlertText: 'Road hazard ahead: Asphalt Surface Pothole, 18 meters ahead on right lane. Reduce speed.',
    bbox: [34, 52, 32, 28],
    coordinates: { lat: 17.4428, lng: 78.3772, name: 'Madhapur Main Road, Hitec City' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    potholeData: {
      classification: 'POTHOLE DETECTED',
      estimatedDepthCm: 7.5,
      estimatedDiameterCm: 45,
      estimatedVolumeLiters: 11.9,
      estimationMethod: 'Monocular Photogrammetry (Known Scale Reference)',
      calibrationReference: 'Standard 15cm white lane marking width',
      isSubgradeExposed: false,
    },
  },
  {
    id: 'sc-2-deep-pothole',
    group: 'Road damage',
    category: 'Deep potholes',
    displayTitle: 'CRITICAL DEEP ASPHALT CAVITY (GRADE 3)',
    trackingId: 'DEMO-TRK-102',
    demoConfidence: 96,
    simulatedDistanceMeters: 11,
    priority: 'critical',
    rdd2022Class: 'D40 (Severe Cavity Delamination)',
    description: 'Severe structural base cavity with exposed sharp subgrade stone. Depth 14.5cm, diameter ~85cm. High risk of two-wheeler rim damage and tyre blowout.',
    voiceAlertText: 'Critical hazard ahead: Deep Pothole Cavity, 11 meters ahead. Severe vehicle damage risk.',
    bbox: [30, 48, 38, 36],
    coordinates: { lat: 17.4504, lng: 78.3809, name: 'Cyber Towers Flyover Down-Ramp' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    potholeData: {
      classification: 'POSSIBLY DEEP POTHOLE',
      estimatedDepthCm: 14.5,
      estimatedDiameterCm: 85,
      estimatedVolumeLiters: 82.2,
      estimationMethod: 'Calibrated Stereo Depth',
      calibrationReference: 'Tire track baseline 1550mm disparity',
      isSubgradeExposed: true,
    },
  },
  {
    id: 'sc-3-shallow-pothole',
    group: 'Road damage',
    category: 'Shallow potholes',
    displayTitle: 'SHALLOW ASPHALT WEARING CAVITY',
    trackingId: 'DEMO-TRK-103',
    demoConfidence: 87,
    simulatedDistanceMeters: 22,
    priority: 'medium',
    rdd2022Class: 'D40 (Minor Surface Raveling)',
    description: 'Minor asphalt surface wearing course peeling. Depth 3.2cm, diameter ~28cm. Base subgrade intact.',
    voiceAlertText: 'Caution: Shallow asphalt cavity 22 meters ahead. Road maintenance required.',
    bbox: [38, 56, 24, 22],
    coordinates: { lat: 17.4478, lng: 78.3812, name: 'Hitec City Phase 2 Outer Radial' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    potholeData: {
      classification: 'SHALLOW POTHOLE',
      estimatedDepthCm: 3.2,
      estimatedDiameterCm: 28,
      estimatedVolumeLiters: 1.9,
      estimationMethod: 'Monocular Photogrammetry (Known Scale Reference)',
      calibrationReference: 'Kerb shadow geometry line',
      isSubgradeExposed: false,
    },
  },
  {
    id: 'sc-4-road-cracks',
    group: 'Road damage',
    category: 'Road cracks',
    displayTitle: 'LONGITUDINAL WHEELPATH CRACK',
    trackingId: 'DEMO-TRK-104',
    demoConfidence: 86,
    simulatedDistanceMeters: 25,
    priority: 'medium',
    rdd2022Class: 'D10 (Longitudinal Fracture)',
    description: 'Continuous linear fracture along vehicular wheel path spanning 28 meters. Requires crack slurry sealant.',
    voiceAlertText: 'Caution: Longitudinal road crack network spanning 25 meters ahead.',
    bbox: [22, 42, 56, 44],
    coordinates: { lat: 17.4589, lng: 78.3614, name: 'Kondapur Botanical Garden Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-5-alligator-cracking',
    group: 'Road damage',
    category: 'Alligator cracking',
    displayTitle: 'FATIGUE ALLIGATOR CRACK NETWORK',
    trackingId: 'DEMO-TRK-105',
    demoConfidence: 91,
    simulatedDistanceMeters: 19,
    priority: 'high',
    rdd2022Class: 'D20 (Alligator Fatigue Cracking)',
    description: 'Interconnected web-like asphalt fracture network indicating subgrade water infiltration and base failure.',
    voiceAlertText: 'Warning: Severe alligator fatigue cracking network 19 meters ahead.',
    bbox: [20, 36, 60, 52],
    coordinates: { lat: 17.4610, lng: 78.3580, name: 'Kothaguda Junction Arterial' },
    bgRoadImage: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-6-broken-road-surface',
    group: 'Road damage',
    category: 'Broken road surfaces',
    displayTitle: 'SHATTERED ROAD SURFACE DELAMINATION',
    trackingId: 'DEMO-TRK-106',
    demoConfidence: 93,
    simulatedDistanceMeters: 16,
    priority: 'high',
    rdd2022Class: 'D40/D20 (Aggregate Stripping)',
    description: 'Extensive surface breakup with loose gravel and broken asphalt flakes creating traction loss.',
    voiceAlertText: 'Alert: Shattered road surface and loose gravel 16 meters ahead.',
    bbox: [18, 46, 64, 40],
    coordinates: { lat: 17.4470, lng: 78.3840, name: 'Cyber Gateway Radial Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-7-uneven-road',
    group: 'Road damage',
    category: 'Uneven road surfaces',
    displayTitle: 'UNEVEN ROAD CORRUGATION & RUTTING',
    trackingId: 'DEMO-TRK-107',
    demoConfidence: 85,
    simulatedDistanceMeters: 28,
    priority: 'medium',
    rdd2022Class: 'Surface Deformation / Rutting',
    description: 'Longitudinal wheel path ruts exceeding 4cm depth due to heavy transit bus loading.',
    voiceAlertText: 'Notice: Uneven road surface and pavement rutting 28 meters ahead.',
    bbox: [16, 50, 68, 38],
    coordinates: { lat: 17.4390, lng: 78.3750, name: 'Durgam Cheruvu Radial Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-8-road-subsidence',
    group: 'Road damage',
    category: 'Road subsidence',
    displayTitle: 'STRUCTURAL ROAD BED SUBSIDENCE VOID',
    trackingId: 'DEMO-TRK-108',
    demoConfidence: 94,
    simulatedDistanceMeters: 14,
    priority: 'critical',
    rdd2022Class: 'Subgrade Settlement Cavity',
    description: 'Sudden sub-surface cavity causing pavement sag over underground stormwater pipe. Precursor to sinkhole formation.',
    voiceAlertText: 'Critical warning: Road bed subsidence void detected 14 meters ahead. Halt lane transit.',
    bbox: [26, 40, 48, 44],
    coordinates: { lat: 17.4310, lng: 78.3980, name: 'Jubilee Hills Road No. 10' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    potholeData: {
      classification: 'SEVERE ROAD DAMAGE',
      estimatedDepthCm: 18.0,
      estimatedDiameterCm: 110,
      estimatedVolumeLiters: 171.0,
      estimationMethod: 'LiDAR Point Cloud / Time-of-Flight',
      calibrationReference: 'Time-of-flight laser depth mesh',
      isSubgradeExposed: true,
    },
  },
  {
    id: 'sc-9-damaged-shoulder',
    group: 'Road damage',
    category: 'Damaged road shoulders',
    displayTitle: 'ERODED HIGHWAY SHOULDER DROP-OFF',
    trackingId: 'DEMO-TRK-109',
    demoConfidence: 88,
    simulatedDistanceMeters: 20,
    priority: 'high',
    rdd2022Class: 'Shoulder Drop-Off Hazard',
    description: '15cm abrupt vertical drop-off between asphalt edge and unpaved shoulder. High rollover risk for overtaking vehicles.',
    voiceAlertText: 'Warning: Severe road shoulder drop-off on left side 20 meters ahead.',
    bbox: [4, 52, 28, 40],
    coordinates: { lat: 17.4240, lng: 78.3490, name: 'Financial District Outer Expressway' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-10-road-erosion',
    group: 'Road damage',
    category: 'Road erosion',
    displayTitle: 'RUNOFF CORRIDOR ROAD EMBANKMENT EROSION',
    trackingId: 'DEMO-TRK-110',
    demoConfidence: 90,
    simulatedDistanceMeters: 23,
    priority: 'high',
    rdd2022Class: 'Embankment Slump Defect',
    description: 'Unchannelled monsoon runoff carving gouges into road foundation embankment.',
    voiceAlertText: 'Notice: Roadside embankment erosion encroaching active lane 23 meters ahead.',
    bbox: [68, 46, 28, 44],
    coordinates: { lat: 17.4520, lng: 78.3680, name: 'Hafeezpet Arterial Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
  },

  // --- DRAINAGE AND WATER (11 - 18) ---
  {
    id: 'sc-11-waterlogging',
    group: 'Drainage and water',
    category: 'Waterlogging',
    displayTitle: 'MONSOON WATERLOGGING & STANDING RUNOFF',
    trackingId: 'DEMO-TRK-111',
    demoConfidence: 92,
    simulatedDistanceMeters: 17,
    priority: 'high',
    rdd2022Class: 'Surface Flooding / Drainage Choke',
    description: 'Standing runoff water depth ~30cm flooding left driving lane across 35 meters. Conceals submerged pothole cavities.',
    voiceAlertText: 'Alert: Standing water accumulation ahead. Hydroplaning hazard. Slow down.',
    bbox: [16, 52, 66, 40],
    coordinates: { lat: 17.4401, lng: 78.3489, name: 'Gachibowli ORR Arterial' },
    bgRoadImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-12-flooded-road',
    group: 'Drainage and water',
    category: 'Flooded roads',
    displayTitle: 'ARTERIAL ROADWAY INUNDATION',
    trackingId: 'DEMO-TRK-112',
    demoConfidence: 95,
    simulatedDistanceMeters: 15,
    priority: 'critical',
    rdd2022Class: 'Severe Roadway Inundation',
    description: 'Complete cross-artery submergence exceeding 45cm water depth. Impassable for light vehicles and two-wheelers.',
    voiceAlertText: 'Critical alert: Flooded roadway ahead. High water hazard. Divert immediately.',
    bbox: [10, 44, 80, 50],
    coordinates: { lat: 17.4415, lng: 78.3450, name: 'Gachibowli Flyover Service Underpass' },
    bgRoadImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-13-water-leakage',
    group: 'Drainage and water',
    category: 'Water leakage',
    displayTitle: 'HIGH-PRESSURE WATER MAIN BLOWOUT',
    trackingId: 'DEMO-TRK-113',
    demoConfidence: 89,
    simulatedDistanceMeters: 26,
    priority: 'high',
    rdd2022Class: 'Sub-base Hydraulic Erosion',
    description: 'Pressurized municipal supply line leaking through asphalt seams, eroding road sub-base.',
    voiceAlertText: 'Notice: Pressurized water pipeline blowout spilling onto road surface ahead.',
    bbox: [20, 50, 58, 38],
    coordinates: { lat: 17.4215, lng: 78.3510, name: 'Wipro Circle, Financial District' },
    bgRoadImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-14-blocked-drain',
    group: 'Drainage and water',
    category: 'Blocked drains',
    displayTitle: 'DEBRIS-BLOCKED STORMWATER INLET',
    trackingId: 'DEMO-TRK-114',
    demoConfidence: 88,
    simulatedDistanceMeters: 16,
    priority: 'high',
    rdd2022Class: 'Catchpit Inlet Choke',
    description: 'Plastic waste and construction silt choking kerb inlet catchpit, causing stormwater back-up.',
    voiceAlertText: 'Warning: Blocked stormwater drain with overflow on road shoulder ahead.',
    bbox: [6, 56, 32, 34],
    coordinates: { lat: 17.4355, lng: 78.4012, name: 'Jubilee Hills Road No. 45' },
    bgRoadImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-15-open-drain',
    group: 'Drainage and water',
    category: 'Open drains',
    displayTitle: 'UNPROTECTED OPEN STORMWATER CHANNEL',
    trackingId: 'DEMO-TRK-115',
    demoConfidence: 93,
    simulatedDistanceMeters: 12,
    priority: 'critical',
    rdd2022Class: 'Uncovered Open Channel Hazard',
    description: 'Uncovered 1.2m deep roadside stormwater conduit without safety railing or marker flags.',
    voiceAlertText: 'Critical hazard: Unprotected open roadside drain 12 meters ahead.',
    bbox: [4, 48, 34, 46],
    coordinates: { lat: 17.4380, lng: 78.3910, name: 'Madhapur Metro Pillar Corridor' },
    bgRoadImage: 'https://images.unsplash.com/photo-1584463699042-4b26792b95fa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-16-open-manhole',
    group: 'Drainage and water',
    category: 'Open manholes',
    displayTitle: 'DISPLACED STORM CHAMBER - OPEN MANHOLE',
    trackingId: 'DEMO-TRK-116',
    demoConfidence: 96,
    simulatedDistanceMeters: 9,
    priority: 'critical',
    rdd2022Class: 'D00 (Cast-Iron Manhole Chamber Void)',
    description: 'Heavy cast-iron lid dislodged, exposing a 2.5m vertical fall void directly in traffic lane.',
    voiceAlertText: 'Emergency hazard: Open manhole void 9 meters ahead. Stop immediately.',
    bbox: [32, 36, 36, 48],
    coordinates: { lat: 17.4326, lng: 78.4071, name: 'Road No. 36 Jubilee Hills' },
    bgRoadImage: 'https://images.unsplash.com/photo-1584463699042-4b26792b95fa?auto=format&fit=crop&w=1200&q=80',
    potholeData: {
      classification: 'SEVERE ROAD DAMAGE',
      estimatedDepthCm: 250.0,
      estimatedDiameterCm: 65,
      estimatedVolumeLiters: 829.0,
      estimationMethod: 'Authorised Inspector Caliper (Physical Verification)',
      calibrationReference: 'Standard 650mm circular chamber frame',
      isSubgradeExposed: true,
    },
  },
  {
    id: 'sc-17-missing-manhole',
    group: 'Drainage and water',
    category: 'Missing manhole covers',
    displayTitle: 'MISSING SEWER INSPECTION CHAMBER LID',
    trackingId: 'DEMO-TRK-117',
    demoConfidence: 94,
    simulatedDistanceMeters: 13,
    priority: 'critical',
    rdd2022Class: 'Missing Chamber Shield',
    description: 'Sanitary sewer chamber completely open and unshielded near pedestrian crossing.',
    voiceAlertText: 'Critical warning: Missing sewer chamber cover 13 meters ahead.',
    bbox: [28, 40, 42, 44],
    coordinates: { lat: 17.4461, lng: 78.3892, name: 'Madhapur 100 Feet Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1584463699042-4b26792b95fa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-18-sewer-overflow',
    group: 'Drainage and water',
    category: 'Sewer overflow',
    displayTitle: 'SANITARY SEWER SURCHARGE OVERFLOW',
    trackingId: 'DEMO-TRK-118',
    demoConfidence: 89,
    simulatedDistanceMeters: 21,
    priority: 'high',
    rdd2022Class: 'Contaminated Sewer Surcharge',
    description: 'Underground sewer line surcharge overflowing onto pedestrian footpath and driving lanes. Biological hazard.',
    voiceAlertText: 'Warning: Sewage overflow on road surface 21 meters ahead. Biological hazard.',
    bbox: [24, 48, 54, 40],
    coordinates: { lat: 17.4430, lng: 78.3810, name: 'Cyber Towers Service Lane' },
    bgRoadImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  },

  // --- OTHER ROAD HAZARDS (19 - 28) ---
  {
    id: 'sc-19-fallen-tree',
    group: 'Other road hazards',
    category: 'Fallen trees',
    displayTitle: 'STORM-FALLEN TREE ACROSS LANES',
    trackingId: 'DEMO-TRK-119',
    demoConfidence: 93,
    simulatedDistanceMeters: 22,
    priority: 'critical',
    rdd2022Class: 'Arterial Corridor Blockage',
    description: 'Heavy Gulmohar tree trunk snapped following thunderstorm, blocking two outbound lanes.',
    voiceAlertText: 'Critical hazard: Fallen tree blocking two lanes of traffic ahead.',
    bbox: [14, 42, 70, 46],
    coordinates: { lat: 17.4260, lng: 78.4110, name: 'KBR Park Perimeter Ring Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-20-fallen-wire',
    group: 'Other road hazards',
    category: 'Fallen electrical wires',
    displayTitle: 'FALLEN ELECTRICAL WIRE CONDUCTOR',
    trackingId: 'DEMO-TRK-168',
    demoConfidence: 91,
    simulatedDistanceMeters: 14,
    priority: 'critical',
    rdd2022Class: 'Live Conductor Hazard',
    description: 'Snapped high-tension feeder cable sagging across highway shoulder. Severe electrocution danger.',
    voiceAlertText: 'High-risk road hazard ahead: Fallen Wire Conductor. Stay alert and follow local road safety rules.',
    bbox: [22, 38, 56, 44],
    coordinates: { lat: 17.4475, lng: 78.3725, name: 'Mindspace Inorbit Link Arterial' },
    bgRoadImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-21-road-debris',
    group: 'Other road hazards',
    category: 'Debris on roads',
    displayTitle: 'SCATTERED HEAVY CONSTRUCTION DEBRIS',
    trackingId: 'DEMO-TRK-121',
    demoConfidence: 90,
    simulatedDistanceMeters: 15,
    priority: 'high',
    rdd2022Class: 'Vehicle Transit Spill',
    description: 'Uncovered concrete fragments spilled from tipper truck obstructing left lane. Tyre puncture and swerving risk.',
    voiceAlertText: 'Alert: Heavy construction aggregate and debris spilled on driving lane.',
    bbox: [24, 46, 50, 42],
    coordinates: { lat: 17.4330, lng: 78.3620, name: 'Gachibowli Flyover Underpass' },
    bgRoadImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-22-garbage-accumulation',
    group: 'Other road hazards',
    category: 'Garbage accumulation',
    displayTitle: 'UNREGULATED ROADSIDE SOLID WASTE ACCUMULATION',
    trackingId: 'DEMO-TRK-122',
    demoConfidence: 86,
    simulatedDistanceMeters: 19,
    priority: 'medium',
    rdd2022Class: 'Roadside Waste Encroachment',
    description: 'Solid commercial trash heaps spilling into driving corridor, obstructing drainage channel.',
    voiceAlertText: 'Caution: Garbage accumulation and roadside waste blocking shoulder.',
    bbox: [6, 54, 38, 36],
    coordinates: { lat: 17.4190, lng: 78.3440, name: 'Nanakramguda Outer Circle' },
    bgRoadImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-23-broken-streetlight',
    group: 'Other road hazards',
    category: 'Broken streetlights',
    displayTitle: 'NON-FUNCTIONAL STREETLIGHT ARRAY',
    trackingId: 'DEMO-TRK-123',
    demoConfidence: 88,
    simulatedDistanceMeters: 30,
    priority: 'medium',
    rdd2022Class: 'Illumination Deficit Blackspot',
    description: 'High-mast luminaire array dark, creating 90-meter blackspot near pedestrian crossing.',
    voiceAlertText: 'Notice: Dark corridor ahead. Non-functional streetlights over 90 meters.',
    bbox: [26, 22, 48, 58],
    coordinates: { lat: 17.4520, lng: 78.3710, name: 'HITEC City Phase 2 Bypass' },
    bgRoadImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-24-damaged-sign',
    group: 'Other road hazards',
    category: 'Damaged traffic signs',
    displayTitle: 'IMPACT-DAMAGED REGULATORY TRAFFIC SIGN',
    trackingId: 'DEMO-TRK-124',
    demoConfidence: 84,
    simulatedDistanceMeters: 21,
    priority: 'medium',
    rdd2022Class: 'Traffic Sign Defect',
    description: 'Vehicular collision twisted mandatory speed regulatory signboard away from oncoming driver view.',
    voiceAlertText: 'Warning: Damaged traffic signboard obscured on highway shoulder.',
    bbox: [70, 32, 24, 52],
    coordinates: { lat: 17.4410, lng: 78.3940, name: 'Durgam Cheruvu Cable Bridge Approach' },
    bgRoadImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-25-unsafe-crossing',
    group: 'Other road hazards',
    category: 'Damaged pedestrian crossings',
    displayTitle: 'DAMAGED PEDESTRIAN CROSSING & SIGNAL FAULT',
    trackingId: 'DEMO-TRK-125',
    demoConfidence: 91,
    simulatedDistanceMeters: 17,
    priority: 'high',
    rdd2022Class: 'Crosswalk Warning Deficit',
    description: 'Pedestrian pelican beacon non-functional with eroded zebra markings in school zone.',
    voiceAlertText: 'Alert: Damaged pedestrian crossing ahead. Yield to pedestrians.',
    bbox: [20, 38, 58, 48],
    coordinates: { lat: 17.4372, lng: 78.3582, name: 'Gachibowli Stadium Service Road' },
    bgRoadImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-26-damaged-footpath',
    group: 'Other road hazards',
    category: 'Damaged footpaths',
    displayTitle: 'SHATTERED FOOTPATH KERB & PEDESTRIAN RISK',
    trackingId: 'DEMO-TRK-126',
    demoConfidence: 87,
    simulatedDistanceMeters: 24,
    priority: 'medium',
    rdd2022Class: 'Footway Kerb Dislocation',
    description: 'Paver blocks displaced along footpath, forcing pedestrians into oncoming motorized traffic lane.',
    voiceAlertText: 'Caution: Damaged pedestrian footpath forcing pedestrian detour into road.',
    bbox: [68, 52, 28, 40],
    coordinates: { lat: 17.4435, lng: 78.3860, name: 'Madhapur 36 Circle' },
    bgRoadImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-27-road-obstruction',
    group: 'Other road hazards',
    category: 'Road obstructions',
    displayTitle: 'UNAUTHORIZED ROADSIDE CORRIDOR OBSTRUCTION',
    trackingId: 'DEMO-TRK-127',
    demoConfidence: 89,
    simulatedDistanceMeters: 16,
    priority: 'high',
    rdd2022Class: 'Unregulated Lane Encroachment',
    description: 'Commercial construction barricade and materials dumped without reflective hazard cones.',
    voiceAlertText: 'Warning: Construction materials obstructing right lane 16 meters ahead.',
    bbox: [32, 44, 46, 44],
    coordinates: { lat: 17.4350, lng: 78.3690, name: 'Bio-Diversity Junction Expressway' },
    bgRoadImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sc-28-damaged-infrastructure',
    group: 'Other road hazards',
    category: 'Damaged road infrastructure',
    displayTitle: 'BUCKLED STEEL HIGHWAY CRASH BARRIER',
    trackingId: 'DEMO-TRK-128',
    demoConfidence: 92,
    simulatedDistanceMeters: 18,
    priority: 'critical',
    rdd2022Class: 'W-Beam Guardrail Collision Defect',
    description: '8m section of steel W-beam median barrier buckled and protruding into express lane following heavy vehicle collision.',
    voiceAlertText: 'Critical hazard: Protruding metal crash barrier encroaching express lane ahead.',
    bbox: [16, 40, 56, 48],
    coordinates: { lat: 17.4390, lng: 78.3610, name: 'Gachibowli Expressway Flyover' },
    bgRoadImage: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80',
  },
];

export interface SessionLoggedDetection {
  id: string;
  category: IncidentCategory;
  displayTitle: string;
  priority: IncidentPriority;
  detectionSource: string;
  timestamp: string;
  reviewStatus: 'Pending Review' | 'Reviewed' | 'Dispatched';
  submissionStatus: 'Not Submitted' | 'Submitted';
  incidentId?: string;
  confidence: number;
  simulatedDistance: number;
  coordinates: { lat: number; lng: number; name: string };
  description: string;
  potholeData?: PotholeDimensionData;
}

export const ActiveRoadScannerView: React.FC<ActiveRoadScannerViewProps> = ({
  onBackToHome,
  onNavigateToTriage,
  onNavigateToMap,
}) => {
  // Scenario Selection & Continuous Drive State
  const [scenarioIndex, setScenarioIndex] = useState(1); // Default to Deep Pothole (Scenario 2)
  const activeScenario = SCANNER_SCENARIOS_28[scenarioIndex];

  // Drive Mode: Continuous vs Manual Step
  const [driveMode, setDriveMode] = useState<'continuous' | 'step'>('continuous');
  const [driveSpeedKmh, setDriveSpeedKmh] = useState<number>(48);
  const [distanceCountdown, setDistanceCountdown] = useState<number>(activeScenario.simulatedDistanceMeters);

  // Scanner Operating Modes
  const [mode, setMode] = useState<'simulator' | 'camera'>('simulator');
  const [isScanning, setIsScanning] = useState(false); // Does not start automatically
  const [reducedMotion, setReducedMotion] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Does not start automatically
  const [showDetections, setShowDetections] = useState(true);

  // Category Filter Tabs
  const [selectedGroup, setSelectedGroup] = useState<'All' | 'Road damage' | 'Drainage and water' | 'Other road hazards'>('All');

  // Performance Telemetry
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());

  // Voice Subtitles
  const [currentSubtitle, setCurrentSubtitle] = useState<string>(
    'Voice alerts on standby. Enable voice to hear spoken road safety notifications.'
  );

  // Live Camera State & Frame Capture
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraOpticalDetections, setCameraOpticalDetections] = useState<
    { id: string; label: string; bbox: [number, number, number, number]; confidence: number }[]
  >([]);

  // Browser Geolocation Status
  const [gpsStatus, setGpsStatus] = useState<{
    hasActualCoords: boolean;
    lat?: number;
    lng?: number;
    accuracy?: number;
    message: string;
  }>({
    hasActualCoords: false,
    message: 'GPS coordinate lock unavailable. Using predefined demonstration coordinates.',
  });

  // Detection Log for Session
  const [sessionDetections, setSessionDetections] = useState<SessionLoggedDetection[]>([
    {
      id: 'DET-101',
      category: 'Potholes',
      displayTitle: 'Asphalt Surface Pothole',
      priority: 'high',
      detectionSource: 'DEMO ENGINE (RDD2022)',
      timestamp: '10:14:20 AM',
      reviewStatus: 'Pending Review',
      submissionStatus: 'Not Submitted',
      confidence: 89,
      simulatedDistance: 18,
      coordinates: { lat: 17.4428, lng: 78.3772, name: 'Madhapur Main Road, Hitec City' },
      description: 'Circular asphalt depression with visible surface rim degradation.',
      potholeData: SCANNER_SCENARIOS_28[0].potholeData,
    },
    {
      id: 'DET-102',
      category: 'Deep potholes',
      displayTitle: 'Critical Deep Asphalt Cavity (Grade 3)',
      priority: 'critical',
      detectionSource: 'DEMO ENGINE (RDD2022)',
      timestamp: '10:18:45 AM',
      reviewStatus: 'Dispatched',
      submissionStatus: 'Submitted',
      incidentId: 'INC-7193',
      confidence: 96,
      simulatedDistance: 11,
      coordinates: { lat: 17.4504, lng: 78.3809, name: 'Cyber Towers Flyover Down-Ramp' },
      description: 'Severe structural base cavity with exposed sharp subgrade stone. Depth 14.5cm.',
      potholeData: SCANNER_SCENARIOS_28[1].potholeData,
    },
  ]);

  // Selected detection details modal
  const [selectedLogItem, setSelectedLogItem] = useState<SessionLoggedDetection | null>(null);

  // Pothole Depth Estimation Profiler Modal
  const [showDepthProfiler, setShowDepthProfiler] = useState(false);
  const [profilerScenario, setProfilerScenario] = useState<ScannerScenario>(SCANNER_SCENARIOS_28[1]);
  const [selectedEstimationMethod, setSelectedEstimationMethod] = useState<DepthEstimationMethod>(
    profilerScenario.potholeData?.estimationMethod || 'Monocular Photogrammetry (Known Scale Reference)'
  );

  // Field Caliper Manual Input State
  const [caliperDepthInput, setCaliperDepthInput] = useState<number>(
    profilerScenario.potholeData?.estimatedDepthCm || 12.0
  );
  const [caliperDiameterInput, setCaliperDiameterInput] = useState<number>(
    profilerScenario.potholeData?.estimatedDiameterCm || 70.0
  );
  const [caliperSubgradeExposed, setCaliperSubgradeExposed] = useState<boolean>(
    profilerScenario.potholeData?.isSubgradeExposed || true
  );
  const [inspectorNameInput, setInspectorNameInput] = useState<string>('Officer S. Varma (GHMC-QA-09)');
  const [caliperSavedSuccess, setCaliperSavedSuccess] = useState<boolean>(false);

  // Canvas Animation Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const roadOffsetRef = useRef<number>(0);
  const continuousTimerRef = useRef<any>(null);

  // Request Actual Browser GPS
  const handleRequestGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus({
            hasActualCoords: true,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            message: `Actual Browser GPS Locked: ${pos.coords.latitude.toFixed(5)}°, ${pos.coords.longitude.toFixed(5)}° (±${Math.round(pos.coords.accuracy)}m)`,
          });
        },
        (err) => {
          setGpsStatus({
            hasActualCoords: false,
            message: `GPS permission denied or unavailable (${err.message}). Using predefined demonstration coordinates.`,
          });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsStatus({
        hasActualCoords: false,
        message: 'Browser does not support Geolocation. Using predefined demonstration coordinates.',
      });
    }
  };

  useEffect(() => {
    handleRequestGps();
  }, []);

  // Sync Profiler inputs when profiler scenario changes
  useEffect(() => {
    if (profilerScenario.potholeData) {
      setSelectedEstimationMethod(profilerScenario.potholeData.estimationMethod);
      setCaliperDepthInput(profilerScenario.potholeData.estimatedDepthCm || 10.0);
      setCaliperDiameterInput(profilerScenario.potholeData.estimatedDiameterCm || 60.0);
      setCaliperSubgradeExposed(profilerScenario.potholeData.isSubgradeExposed);
    }
  }, [profilerScenario.id]);

  // Live Camera Setup & Controlled Optical Frame Capture
  useEffect(() => {
    let captureInterval: any = null;

    if (mode === 'camera') {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setIsCameraActive(true);
            }
          })
          .catch((err) => {
            setCameraError(
              `Camera access unavailable (${err.name}: ${err.message}). Reverting to Simulator Mode.`
            );
            setMode('simulator');
          });

        // Run frame edge sampling loop every 600ms
        captureInterval = setInterval(() => {
          if (!isScanning) return;
          const video = videoRef.current;
          const hiddenCanvas = hiddenCanvasRef.current;
          if (!video || !hiddenCanvas || video.readyState < 2) return;

          const ctx = hiddenCanvas.getContext('2d');
          if (!ctx) return;

          hiddenCanvas.width = 320;
          hiddenCanvas.height = 240;
          ctx.drawImage(video, 0, 0, 320, 240);

          // Simulated browser frame edge analysis: detect dark anomaly or high contrast in lower road region
          try {
            const imgData = ctx.getImageData(80, 120, 160, 100);
            const data = imgData.data;
            let darkPixelCount = 0;
            for (let i = 0; i < data.length; i += 4) {
              const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              if (lum < 55) darkPixelCount++;
            }

            const darkRatio = darkPixelCount / (data.length / 4);

            if (darkRatio > 0.15) {
              const opticalDet = {
                id: 'CAM-TRK-' + Math.floor(100 + Math.random() * 900),
                label: darkRatio > 0.35 ? 'POSSIBLY DEEP CAVITY' : 'ROAD DEFECT CONTRAST',
                bbox: [28, 48, 44, 38] as [number, number, number, number],
                confidence: Math.min(0.96, Math.max(0.78, 0.7 + darkRatio * 0.4)),
              };
              setCameraOpticalDetections([opticalDet]);

              // Log to session table if not already added
              setSessionDetections((prev) => {
                const recent = prev[0];
                if (recent && recent.timestamp === 'Just now (WebCam)') return prev;
                return [
                  {
                    id: 'DET-CAM-' + Math.floor(1000 + Math.random() * 9000),
                    category: 'Deep potholes',
                    displayTitle: opticalDet.label,
                    priority: darkRatio > 0.35 ? 'critical' : 'high',
                    detectionSource: 'CLIENT WEBCAM OPTICAL EDGE (Luminance Anomaly)',
                    timestamp: new Date().toLocaleTimeString(),
                    reviewStatus: 'Pending Review',
                    submissionStatus: 'Not Submitted',
                    confidence: Math.round(opticalDet.confidence * 100),
                    simulatedDistance: 12,
                    coordinates: activeScenario.coordinates,
                    description: 'Client browser frame luminance anomaly detected in central driving cone.',
                  },
                  ...prev.slice(0, 29),
                ];
              });
            } else {
              setCameraOpticalDetections([]);
            }
          } catch (e) {
            // Frame security fallback
          }
        }, 600);
      } else {
        setCameraError('Webcam API is not supported in this browser. Using Simulator Mode.');
        setMode('simulator');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setIsCameraActive(false);
      }
    }

    return () => {
      if (captureInterval) clearInterval(captureInterval);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mode, isScanning]);

  // Continuous Corridor Tour Driver Loop: smoothly decrements distance and advances scenarios
  useEffect(() => {
    if (!isScanning || driveMode !== 'continuous') {
      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
      return;
    }

    continuousTimerRef.current = setInterval(() => {
      setDistanceCountdown((prev) => {
        if (prev <= 4) {
          // Hazard passed! Advance to next scenario
          const nextIdx = (scenarioIndex + 1) % SCANNER_SCENARIOS_28.length;
          setScenarioIndex(nextIdx);
          const nextSc = SCANNER_SCENARIOS_28[nextIdx];

          // Log newly encountered hazard
          setSessionDetections((old) => {
            if (old.some((item) => item.displayTitle === nextSc.displayTitle)) return old;
            return [
              {
                id: `DET-${nextSc.id.replace('sc-', '')}`,
                category: nextSc.category,
                displayTitle: nextSc.displayTitle,
                priority: nextSc.priority,
                detectionSource: 'DEMO ENGINE (RDD2022 CONTINUOUS)',
                timestamp: new Date().toLocaleTimeString(),
                reviewStatus: 'Pending Review',
                submissionStatus: 'Not Submitted',
                confidence: nextSc.demoConfidence,
                simulatedDistance: nextSc.simulatedDistanceMeters,
                coordinates: nextSc.coordinates,
                description: nextSc.description,
                potholeData: nextSc.potholeData,
              },
              ...old,
            ];
          });

          if (voiceEnabled) {
            triggerVoiceAnnouncement(nextSc.voiceAlertText);
          } else {
            setCurrentSubtitle(nextSc.voiceAlertText);
          }

          return nextSc.simulatedDistanceMeters;
        }
        return prev - 2;
      });
    }, 900);

    return () => {
      if (continuousTimerRef.current) clearInterval(continuousTimerRef.current);
    };
  }, [isScanning, driveMode, scenarioIndex, voiceEnabled]);

  // Road Perspective Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = isScanning;

    const render = (now: number) => {
      // Calculate dynamic FPS
      frameCountRef.current++;
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (mode === 'simulator') {
        const horizonY = height * 0.40;

        // Perspective Road Polygon
        const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        roadGrad.addColorStop(0, 'rgba(8, 14, 28, 0.45)');
        roadGrad.addColorStop(1, 'rgba(4, 8, 18, 0.88)');

        ctx.fillStyle = roadGrad;
        ctx.beginPath();
        ctx.moveTo(width * 0.38, horizonY);
        ctx.lineTo(width * 0.62, horizonY);
        ctx.lineTo(width * 0.96, height);
        ctx.lineTo(width * 0.04, height);
        ctx.closePath();
        ctx.fill();

        // Increment road offset if active and reduced motion is off
        if (active && !reducedMotion) {
          const speedMultiplier = driveSpeedKmh / 40;
          roadOffsetRef.current = (roadOffsetRef.current + 2.8 * speedMultiplier) % 40;
        }

        const numSegments = 12;

        // Perspective Yellow Dashed Centre Line
        for (let i = 0; i < numSegments; i++) {
          const t1 = Math.pow((i * 40 + roadOffsetRef.current) / (numSegments * 40), 2.1);
          const t2 = Math.pow(((i + 0.45) * 40 + roadOffsetRef.current) / (numSegments * 40), 2.1);

          if (t1 < 1 && t2 < 1) {
            const y1 = horizonY + t1 * (height - horizonY);
            const y2 = horizonY + t2 * (height - horizonY);
            const x1 = width * 0.5;
            const x2 = width * 0.5;
            const lineWidth = 2 + t1 * 8;

            ctx.strokeStyle = '#eab308'; // Yellow dashed line
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }

        // White / Grey Perspective Road Edges
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(width * 0.38, horizonY);
        ctx.lineTo(width * 0.04, height);
        ctx.moveTo(width * 0.62, horizonY);
        ctx.lineTo(width * 0.96, height);
        ctx.stroke();

        // Moving Left & Right Rumble Strips
        for (let i = 0; i < numSegments; i++) {
          const t1 = Math.pow((i * 40 + roadOffsetRef.current) / (numSegments * 40), 2.1);
          const t2 = Math.pow(((i + 0.5) * 40 + roadOffsetRef.current) / (numSegments * 40), 2.1);

          if (t1 < 1 && t2 < 1) {
            const y1 = horizonY + t1 * (height - horizonY);
            const y2 = horizonY + t2 * (height - horizonY);

            const lx1 = width * 0.38 - t1 * (width * 0.38 - width * 0.04);
            const lx2 = width * 0.38 - t2 * (width * 0.38 - width * 0.04);
            const rx1 = width * 0.62 + t1 * (width * 0.96 - width * 0.62);
            const rx2 = width * 0.62 + t2 * (width * 0.96 - width * 0.62);

            const isWhite = i % 2 === 0;
            ctx.strokeStyle = isWhite ? '#ffffff' : '#f97316';
            ctx.lineWidth = 2 + t1 * 6;

            ctx.beginPath();
            ctx.moveTo(lx1, y1);
            ctx.lineTo(lx2, y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(rx1, y1);
            ctx.lineTo(rx2, y2);
            ctx.stroke();
          }
        }
      }

      // Windscreen Laser Scanning Beam Sweep
      if (active && !reducedMotion) {
        const sweepProgress = (Math.sin(now / 500) + 1) / 2;
        const scanY = height * 0.38 + sweepProgress * (height * 0.56);

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, scanY);
        ctx.lineTo(width * 0.9, scanY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (active) {
      animFrameRef.current = requestAnimationFrame(render);
    } else {
      render(performance.now());
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isScanning, mode, reducedMotion, driveSpeedKmh]);

  // Voice Alert Handlers
  const triggerVoiceAnnouncement = (text: string) => {
    setCurrentSubtitle(text);
    if (voiceEnabled) {
      voiceAssistantService.speak(text, 'alert', true);
    }
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next) {
      triggerVoiceAnnouncement(activeScenario.voiceAlertText);
    } else {
      voiceAssistantService.stop();
      setCurrentSubtitle('Voice alerts muted.');
    }
  };

  const handleRepeatAlert = () => {
    triggerVoiceAnnouncement(activeScenario.voiceAlertText);
  };

  const handleStopVoice = () => {
    voiceAssistantService.stop();
    setCurrentSubtitle('Voice audio stopped.');
  };

  // Scenario Selection
  const handleSelectScenario = (idx: number) => {
    setScenarioIndex(idx);
    const newSc = SCANNER_SCENARIOS_28[idx];
    setDistanceCountdown(newSc.simulatedDistanceMeters);

    // Log to session table
    setSessionDetections((prev) => {
      if (prev.some((d) => d.displayTitle === newSc.displayTitle)) return prev;
      return [
        {
          id: `DET-${newSc.id.replace('sc-', '')}`,
          category: newSc.category,
          displayTitle: newSc.displayTitle,
          priority: newSc.priority,
          detectionSource: mode === 'camera' ? 'LIVE WEBCAM STREAM' : 'DEMO ENGINE (RDD2022)',
          timestamp: new Date().toLocaleTimeString(),
          reviewStatus: 'Pending Review',
          submissionStatus: 'Not Submitted',
          confidence: newSc.demoConfidence,
          simulatedDistance: newSc.simulatedDistanceMeters,
          coordinates: newSc.coordinates,
          description: newSc.description,
          potholeData: newSc.potholeData,
        },
        ...prev,
      ];
    });

    if (isScanning && voiceEnabled) {
      triggerVoiceAnnouncement(newSc.voiceAlertText);
    } else {
      setCurrentSubtitle(newSc.voiceAlertText);
    }
  };

  const handleNextScenario = () => {
    const nextIdx = (scenarioIndex + 1) % SCANNER_SCENARIOS_28.length;
    handleSelectScenario(nextIdx);
  };

  // Controls
  const handleStartScanning = () => {
    setIsScanning(true);
    triggerVoiceAnnouncement(activeScenario.voiceAlertText);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    voiceAssistantService.stop();
    setCurrentSubtitle('Road scanner stopped. Systems on standby.');
  };

  const handleRestartScanner = () => {
    handleSelectScenario(0);
    setIsScanning(true);
  };

  // Dispatch to Incident Triage
  const handleSendToIncidentTriage = (sc: ScannerScenario | SessionLoggedDetection) => {
    const newInc = incidentService.createIncident({
      title: `${sc.displayTitle} (Active Road Scanner)`,
      category: sc.category,
      priority: sc.priority,
      status: 'initial_triage',
      triagePriorityRationale: `Automated detection generated by CivicShield Active Road Scanner. Identified with ${
        'demoConfidence' in sc ? sc.demoConfidence : sc.confidence
      }% optical confidence. Tracking ID: ${'trackingId' in sc ? sc.trackingId : sc.id}. ${
        sc.potholeData ? `Pothole Depth: ${sc.potholeData.estimatedDepthCm}cm (${sc.potholeData.classification})` : ''
      }`,
      description: `Automated active optical dashcam detection: ${sc.description}. Simulated distance: approx. ${
        'simulatedDistanceMeters' in sc ? sc.simulatedDistanceMeters : sc.simulatedDistance
      }m ahead.`,
      location: {
        name: sc.coordinates.name,
        region: 'Hyderabad',
        lat: sc.coordinates.lat,
        lng: sc.coordinates.lng,
        address: `${sc.coordinates.name}, Telangana`,
        accuracyMeters: 5,
      },
      photoUrl: 'bgRoadImage' in sc ? sc.bgRoadImage : undefined,
      isDemo: true,
      dataSource: 'SYNTHETIC_DEMO',
      reporter: {
        name: 'CivicShield Active Optical Dashcam [SIM]',
        isAnonymous: false,
      },
      aiDetection: {
        detectedCategory: sc.displayTitle,
        confidence: ('demoConfidence' in sc ? sc.demoConfidence : sc.confidence) / 100,
        severityScore: sc.priority === 'critical' ? 9.2 : sc.priority === 'high' ? 7.8 : 6.0,
        damageType: 'rdd2022Class' in sc ? sc.rdd2022Class : 'RDD2022 Synthetic Class',
        bbox: 'bbox' in sc ? sc.bbox : [20, 40, 60, 40],
        measuredSurfaceDamageEstimated: `Approx. ${'simulatedDistanceMeters' in sc ? sc.simulatedDistanceMeters : sc.simulatedDistance}m corridor`,
        measurementMethod: 'Visual Estimate',
        modelSource: mode === 'camera' ? 'Client WebCam Optical Scanner' : 'CivicShield YOLOv11-RoadDefect [SIM]',
        detectionTimestamp: new Date().toISOString(),
        potholeDimensions: sc.potholeData,
      },
      potholeDimensions: sc.potholeData,
    });

    setSessionDetections((prev) =>
      prev.map((d) =>
        d.id === (('trackingId' in sc ? sc.trackingId : sc.id) || d.id) || d.displayTitle === sc.displayTitle
          ? {
              ...d,
              reviewStatus: 'Dispatched',
              submissionStatus: 'Submitted',
              incidentId: newInc.id,
            }
          : d
      )
    );

    triggerVoiceAnnouncement(
      `Road hazard dispatched to municipal triage queue. Incident record ${newInc.id} generated.`
    );
  };

  // Save Field Caliper Measurement into Pothole Profiler
  const handleSaveCaliperMeasurement = () => {
    // Automatically classify based on depth and subgrade
    let computedClass: PotholeClassification = 'POTHOLE DETECTED';
    let computedPriority: IncidentPriority = 'high';

    if (caliperDepthInput >= 10.0 || caliperSubgradeExposed) {
      computedClass = caliperDepthInput >= 15.0 ? 'SEVERE ROAD DAMAGE' : 'POSSIBLY DEEP POTHOLE';
      computedPriority = 'critical';
    } else if (caliperDepthInput < 5.0 && !caliperSubgradeExposed) {
      computedClass = 'SHALLOW POTHOLE';
      computedPriority = 'medium';
    }

    const updatedDimensions: PotholeDimensionData = {
      classification: computedClass,
      estimatedDepthCm: caliperDepthInput,
      estimatedDiameterCm: caliperDiameterInput,
      estimatedVolumeLiters: Math.round(((Math.PI * Math.pow(caliperDiameterInput / 2, 2) * caliperDepthInput) / 1000) * 10) / 10,
      estimationMethod: 'Authorised Inspector Caliper (Physical Verification)',
      calibrationReference: 'Direct physical mechanical caliper vernier gauge',
      isSubgradeExposed: caliperSubgradeExposed,
      manualVerification: {
        verifiedBy: inspectorNameInput,
        verifiedAt: new Date().toISOString(),
        actualDepthCm: caliperDepthInput,
        actualDiameterCm: caliperDiameterInput,
        subgradeConfirmed: caliperSubgradeExposed,
        inspectorNotes: `Field inspection by ${inspectorNameInput}. Measured depth: ${caliperDepthInput}cm. Subgrade exposed: ${caliperSubgradeExposed ? 'YES' : 'NO'}.`,
      },
    };

    // Update profiler scenario
    const updatedSc: ScannerScenario = {
      ...profilerScenario,
      priority: computedPriority,
      potholeData: updatedDimensions,
    };
    setProfilerScenario(updatedSc);

    // If active scenario matches, update it too
    if (activeScenario.id === profilerScenario.id) {
      SCANNER_SCENARIOS_28[scenarioIndex] = updatedSc;
    }

    // Check if an existing session detection or incident exists to update
    const matchingSessionItem = sessionDetections.find((d) => d.displayTitle === profilerScenario.displayTitle);
    if (matchingSessionItem && matchingSessionItem.incidentId) {
      incidentService.updatePotholeDimensions(matchingSessionItem.incidentId, updatedDimensions, inspectorNameInput);
    }

    setCaliperSavedSuccess(true);
    setTimeout(() => setCaliperSavedSuccess(false), 3000);
    triggerVoiceAnnouncement(`Physical caliper measurement recorded. Pothole reclassified as ${computedClass}.`);
  };

  // Filtered Scenarios
  const filteredScenarios =
    selectedGroup === 'All'
      ? SCANNER_SCENARIOS_28
      : SCANNER_SCENARIOS_28.filter((sc) => sc.group === selectedGroup);

  return (
    <div className="min-h-full bg-[#080d1a] text-slate-100 flex flex-col font-sans pb-16">
      {/* Hidden canvas for live webcam frame sampling */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* SECTION A: Page Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-cyan-500 transition text-xs font-semibold cursor-pointer"
                title="Return to Citizen Portal"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
                <span>Back to Citizen Home</span>
              </button>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Active Road Scanner</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  CONTINUOUS 28-DEFECT SUITE
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Continuous optical dashcam monitoring with automated voice alert dispatch.
            </p>
          </div>

          {/* Quick Actions & Navigation to Triage */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setProfilerScenario(activeScenario);
                setShowDepthProfiler(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-xs font-bold transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <Ruler className="h-3.5 w-3.5 text-cyan-400" />
              <span>Pothole Depth Profiler</span>
            </button>

            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium transition cursor-pointer"
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>Geographic Map</span>
              </button>
            )}
            {onNavigateToTriage && (
              <button
                onClick={onNavigateToTriage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium transition cursor-pointer"
              >
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Authority Triage</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* SECTION B: Driver Safety & Hands-Free Mandate Panel */}
        <div className="rounded-xl border border-cyan-500/60 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/50 p-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-0.5">
              <Shield className="h-5 w-5" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Driver Safety &amp; Hands-Free Mandate
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-900/80 text-cyan-200 border border-cyan-700 tracking-wider">
                  PASSIVE AUDIO MODE
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                Mount your phone in a standard dashboard cradle before driving. Do not look at the screen, type, or capture manual photos while moving. Spoken voice warnings announce detected hazards automatically.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION C & D: Main Road Simulator Viewport */}
        <div className="relative rounded-2xl border-2 border-cyan-500/50 bg-[#050914] shadow-2xl overflow-hidden select-none">
          {/* Top Road Status Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between pointer-events-none">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  isScanning
                    ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-ping'
                    : 'bg-slate-600'
                }`}
              />
              <span
                className={`font-mono text-xs font-extrabold uppercase tracking-wider ${
                  isScanning ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {isScanning ? 'ROAD SCAN ACTIVE' : 'SCANNER STANDBY'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700">
                {driveMode === 'continuous' ? 'CONTINUOUS TOUR' : 'STEP SCENARIO'}
              </span>
            </div>

            {/* Simulated GPS & Speed Coordinates */}
            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-cyan-300 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
              <span>
                LAT: {activeScenario.coordinates.lat.toFixed(4)}° N, LON: {activeScenario.coordinates.lng.toFixed(4)}° E
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-emerald-400 font-bold">
                {isScanning && !reducedMotion ? `${driveSpeedKmh} km/h` : '0 km/h'}
              </span>
            </div>
          </div>

          {/* Road Visual Viewport (Simulator Background or Live Camera Feed) */}
          <div className="relative h-[400px] sm:h-[500px] bg-black overflow-hidden flex items-center justify-center">
            {/* Background Road Image or Webcam */}
            {mode === 'camera' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeScenario.bgRoadImage}
                alt={activeScenario.displayTitle}
                className={`absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transition-transform duration-700 ${
                  isScanning && !reducedMotion ? 'scale-105' : 'scale-100'
                }`}
              />
            )}

            {/* 2D Perspective Road Animation Canvas (Moving Yellow Dashes & Kerbs) */}
            <canvas
              ref={canvasRef}
              width={1000}
              height={500}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-90 z-10"
            />

            {/* SECTION E: Hazard Detection Overlay Box */}
            {showDetections && isScanning && (
              <div
                className="absolute z-20 transition-all duration-300 cursor-pointer pointer-events-auto"
                style={{
                  left: `${activeScenario.bbox[0]}%`,
                  top: `${activeScenario.bbox[1]}%`,
                  width: `${activeScenario.bbox[2]}%`,
                  height: `${activeScenario.bbox[3]}%`,
                }}
                onClick={() => {
                  if (activeScenario.potholeData) {
                    setProfilerScenario(activeScenario);
                    setShowDepthProfiler(true);
                  } else {
                    handleSendToIncidentTriage(activeScenario);
                  }
                }}
                title={activeScenario.potholeData ? 'Click to inspect Pothole Depth & Dimension Profiler' : 'Click to dispatch detection to Incident Triage'}
              >
                {/* Detection Outer Glow Box */}
                <div className="relative w-full h-full border-2 border-red-500 bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.6)] rounded-sm flex flex-col justify-between p-2">
                  {/* Top Header Card */}
                  <div className="bg-slate-950/95 border border-red-500/80 rounded px-2.5 py-1.5 text-left space-y-1 shadow-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[11px] text-red-400 uppercase tracking-tight">
                        {activeScenario.displayTitle}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                        {activeScenario.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                      <span>DEMO CONFIDENCE: {activeScenario.demoConfidence}%</span>
                      <span>TRACK: {activeScenario.trackingId}</span>
                    </div>

                    <div className="text-[10px] font-mono text-amber-300 font-semibold flex items-center justify-between">
                      <span>SIMULATED DISTANCE: APPROX. {distanceCountdown} m AHEAD</span>
                      {activeScenario.potholeData && (
                        <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.2 rounded border border-red-800">
                          {activeScenario.potholeData.classification}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corner Targeting Brackets */}
                  <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
                  <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />

                  {/* Bottom Action Prompts */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {activeScenario.potholeData ? (
                      <span className="inline-flex items-center gap-1 bg-amber-600/90 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        <Ruler className="h-2.5 w-2.5" />
                        <span>INSPECT DEPTH ({activeScenario.potholeData.estimatedDepthCm}cm)</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400">RDD2022 CLASSIFIED</span>
                    )}

                    <span className="inline-flex items-center gap-1 bg-cyan-600/90 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      <span>DISPATCH TRIAGE</span>
                      <Send className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Standby Screen when Scanner is Stopped */}
            {!isScanning && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                  <Scan className="h-8 w-8 animate-pulse" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Continuous Optical Dashcam Standby
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Continuous multi-hazard dashcam scanning engine with 28 road, drainage, and infrastructure defect models, real-time depth estimation, and voice warnings.
                  </p>
                </div>
                <button
                  onClick={handleStartScanning}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-7 shadow-xl shadow-cyan-900/50 transition text-sm cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>START CONTINUOUS SCANNING</span>
                </button>
              </div>
            )}

            {/* SECTION F: Bottom-Left Scanner Performance Panel */}
            <div className="absolute bottom-3 left-3 z-30 font-mono text-[10px] text-slate-300 bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg space-y-1 pointer-events-none shadow-xl max-w-[260px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">SIMULATION FPS:</span>
                <span className="text-emerald-400 font-bold">{isScanning ? `${fps} FPS` : '0 FPS'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">SOURCE:</span>
                <span className="text-cyan-300">{mode === 'camera' ? 'LIVE WEBCAM STREAM' : 'RDD2022 CONTINUOUS'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">TRACKER:</span>
                <span className="text-cyan-400">ACTIVE (KALMAN IOU)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">SESSION DETECTIONS:</span>
                <span className="text-white font-bold">{sessionDetections.length} LOGGED</span>
              </div>
            </div>

            {/* Bottom-Right Hazard Count Panel */}
            <div className="absolute bottom-3 right-3 z-30 font-mono text-[10px] bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg space-y-1 pointer-events-none shadow-xl text-right">
              <div className="text-slate-400">ACTIVE HAZARDS AHEAD</div>
              <div className="text-red-400 font-bold text-sm">1 DETECTED ({distanceCountdown}m)</div>
              <div className="text-[9px] text-cyan-300">
                SCENARIO {scenarioIndex + 1} OF 28 ({activeScenario.group.toUpperCase()})
              </div>
            </div>
          </div>

          {/* SECTION G: Scanner Controls Bar */}
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isScanning ? (
                <button
                  onClick={handleStartScanning}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 transition shadow cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>START SCANNING</span>
                </button>
              ) : (
                <button
                  onClick={handleStopScanning}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 transition shadow cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>STOP SCANNING</span>
                </button>
              )}

              {/* Drive Mode Selector: Continuous Tour vs Step */}
              <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
                <button
                  onClick={() => setDriveMode('continuous')}
                  className={`px-2.5 py-1 rounded-md transition font-semibold cursor-pointer ${
                    driveMode === 'continuous'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Continuously moves vehicle along corridor detecting hazards sequentially"
                >
                  Continuous Tour
                </button>
                <button
                  onClick={() => setDriveMode('step')}
                  className={`px-2.5 py-1 rounded-md transition font-semibold cursor-pointer ${
                    driveMode === 'step'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Hold on selected scenario until Next Scenario is clicked"
                >
                  Scenario Step
                </button>
              </div>

              {/* Mode Selector: Simulator vs Live Camera */}
              <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
                <button
                  onClick={() => setMode('simulator')}
                  className={`px-2.5 py-1 rounded-md transition font-semibold cursor-pointer ${
                    mode === 'simulator'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Simulator Mode
                </button>
                <button
                  onClick={() => setMode('camera')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-semibold cursor-pointer ${
                    mode === 'camera'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="h-3 w-3" />
                  <span>Live Camera</span>
                </button>
              </div>

              {/* Voice Alert Toggle */}
              <button
                onClick={handleToggleVoice}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                  voiceEnabled
                    ? 'bg-slate-800 border-cyan-800 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span>{voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
              </button>

              {/* Repeat Alert */}
              <button
                onClick={handleRepeatAlert}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Repeat spoken voice warning"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Repeat Alert</span>
              </button>

              {/* Next Scenario */}
              <button
                onClick={handleNextScenario}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyan-800 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-semibold transition cursor-pointer"
                title="Switch to next hazard scenario"
              >
                <span>Next Scenario</span>
                <SkipForward className="h-3 w-3" />
              </button>
            </div>

            {/* Secondary Controls: Reduced Motion & Overlay Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetections(!showDetections)}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition cursor-pointer ${
                  showDetections
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
                title="Toggle detection bounding boxes"
              >
                {showDetections ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>{showDetections ? 'Boxes Visible' : 'Boxes Hidden'}</span>
              </button>

              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition cursor-pointer ${
                  reducedMotion
                    ? 'bg-amber-950 border-amber-800 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
                title="Enable reduced motion for sensitivity"
              >
                <span>{reducedMotion ? 'Reduced Motion: ON' : 'Motion: Animated'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Camera Warning Notification (if camera error or active) */}
        {mode === 'camera' && (
          <div className="rounded-xl border border-cyan-800 bg-cyan-950/40 p-3.5 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Video className="h-4 w-4" />
                <span>Live Camera Dashcam Optical Analysis Mode Active</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-900 text-cyan-200">
                FRAME SAMPLING: 600ms
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real device optical frames are processed in-browser. Optical edge and contrast algorithms detect road anomalies and assign spatial tracking IDs. No unverified remote cloud inference claimed.
            </p>
          </div>
        )}
        {cameraError && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* SECTION 1: 28 Hazard Scenarios Selector Pills by Category */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <div>
              <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                28 Continuous Hazard Scenarios &bull; Active: {activeScenario.displayTitle}
              </span>
              <span className="text-[10px] text-slate-400">
                Filter by hazard group or select any scenario to evaluate optical detection, depth metrics, and voice warnings
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[11px]">
              {(['All', 'Road damage', 'Drainage and water', 'Other road hazards'] as const).map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                    selectedGroup === grp
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {filteredScenarios.map((sc) => {
              const globalIdx = SCANNER_SCENARIOS_28.findIndex((item) => item.id === sc.id);
              const isSelected = scenarioIndex === globalIdx;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(globalIdx)}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition font-medium cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold shadow shadow-cyan-900/50'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="text-[9px] opacity-75 font-mono">{globalIdx + 1}</span>
                  <span>{sc.category}</span>
                  {sc.potholeData && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" title="Has depth profile data" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION H: Voice Subtitle Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-start gap-3">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                voiceEnabled
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_#06b6d4]'
                  : 'bg-slate-900 border border-slate-700 text-slate-500'
              }`}
            >
              <Volume2 className="h-4 w-4" />
            </div>

            <div className="space-y-0.5">
              <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                Automated Voice Alert Subtitle (Spoken via Web Speech)
              </span>
              <p className="text-slate-200 text-xs font-medium leading-relaxed italic">
                "{currentSubtitle}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRepeatAlert}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Repeat Alert
            </button>
            <button
              onClick={handleStopVoice}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 text-xs transition cursor-pointer"
            >
              Stop Voice
            </button>
          </div>
        </div>

        {/* SECTION I: GPS Status Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Navigation
              className={`h-4 w-4 ${
                gpsStatus.hasActualCoords ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <div className="text-slate-300">
              <span className="font-semibold text-white">Geographic GPS Status: </span>
              <span className="font-mono text-[11px] text-cyan-300">{gpsStatus.message}</span>
            </div>
          </div>

          <button
            onClick={handleRequestGps}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh GPS Lock</span>
          </button>
        </div>

        {/* SECTION J: Detections Logged in Current Session */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl overflow-hidden space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Detections Logged in Current Session</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {sessionDetections.length} RECORDED
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each optical hazard identified by the dashcam can be independently verified, dimensionally profiled, and dispatched into Municipal Triage.
              </p>
            </div>

            <button
              onClick={() => handleSendToIncidentTriage(activeScenario)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-3.5 py-2 text-xs shadow-lg shadow-cyan-900/40 transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Dispatch Active Scenario to Triage</span>
            </button>
          </div>

          {/* Detections Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/50">
                  <th className="py-2.5 px-3">Detection ID</th>
                  <th className="py-2.5 px-3">Hazard Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Depth / Dimensions</th>
                  <th className="py-2.5 px-3">Detection Source</th>
                  <th className="py-2.5 px-3">Distance &amp; Time</th>
                  <th className="py-2.5 px-3">Triage Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sessionDetections.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                      {item.id}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{item.displayTitle}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          item.priority === 'critical'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : item.priority === 'high'
                            ? 'bg-orange-950 text-orange-400 border border-orange-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {item.potholeData ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-cyan-300">
                            {item.potholeData.estimatedDepthCm}cm Depth
                          </span>
                          <span className="block text-[9px] text-slate-400">
                            {item.potholeData.classification}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Surface Area</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                      {item.detectionSource}
                    </td>

                    <td className="py-2.5 px-3 text-[11px]">
                      <div>{item.simulatedDistance}m ahead</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.timestamp}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      {item.submissionStatus === 'Submitted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>Dispatched ({item.incidentId})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px]">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>Pending Triage</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLogItem(item)}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                        >
                          View Details
                        </button>

                        {item.submissionStatus === 'Submitted' ? (
                          onNavigateToTriage && (
                            <button
                              onClick={onNavigateToTriage}
                              className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] transition cursor-pointer font-semibold"
                            >
                              View in Triage
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleSendToIncidentTriage(item)}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition cursor-pointer shadow"
                          >
                            Send to Triage
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: Deep Pothole Detection & Calibrated Depth Profiler Modal */}
      {showDepthProfiler && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-cyan-500/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-400 shadow">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Pothole Depth Estimation &amp; Dimension Profiler</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      METRIC CALIBRATION
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Dimensional depth analysis, subgrade verification, and physical inspector caliper entry
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDepthProfiler(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Classification Banner */}
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Current Pothole Classification
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                      profilerScenario.potholeData?.classification === 'SEVERE ROAD DAMAGE' ||
                      profilerScenario.potholeData?.classification === 'POSSIBLY DEEP POTHOLE'
                        ? 'bg-red-950 text-red-400 border border-red-700 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : profilerScenario.potholeData?.classification === 'SHALLOW POTHOLE'
                        ? 'bg-blue-950 text-blue-400 border border-blue-700'
                        : 'bg-orange-950 text-orange-400 border border-orange-700'
                    }`}
                  >
                    {profilerScenario.potholeData?.classification || 'POTHOLE DETECTED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block uppercase">Estimated Depth</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {profilerScenario.potholeData?.estimatedDepthCm ?? 'N/A'} cm
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block uppercase">Cavity Diameter</span>
                    <span className="text-sm font-bold text-white">
                      {profilerScenario.potholeData?.estimatedDiameterCm ?? 'N/A'} cm
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block uppercase">Cold-Mix Volume</span>
                    <span className="text-sm font-bold text-amber-300">
                      {profilerScenario.potholeData?.estimatedVolumeLiters ?? 'N/A'} L
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block uppercase">Subgrade Base</span>
                    <span
                      className={`text-xs font-bold block mt-0.5 ${
                        profilerScenario.potholeData?.isSubgradeExposed ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {profilerScenario.potholeData?.isSubgradeExposed ? 'EXPOSED (CRITICAL)' : 'INTACT'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Depth-Estimation Methods Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                  Depth-Estimation &amp; Measurement Methods
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      method: 'Monocular Photogrammetry (Known Scale Reference)' as DepthEstimationMethod,
                      desc: 'Estimates dimensions using known ground scale references (15cm lane line or standard 205mm tire contact width).',
                    },
                    {
                      method: 'Calibrated Stereo Depth' as DepthEstimationMethod,
                      desc: 'Dual-camera disparity triangulation measuring depth deltas between road crown and cavity base.',
                    },
                    {
                      method: 'LiDAR Point Cloud / Time-of-Flight' as DepthEstimationMethod,
                      desc: 'Direct optical time-of-flight sensor calculating exact 3D surface mesh depression.',
                    },
                    {
                      method: 'Authorised Inspector Caliper (Physical Verification)' as DepthEstimationMethod,
                      desc: 'Physical vernier depth gauge measurement recorded on-site by certified municipal inspector.',
                    },
                  ].map((m) => (
                    <div
                      key={m.method}
                      onClick={() => setSelectedEstimationMethod(m.method)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition space-y-1 ${
                        selectedEstimationMethod === m.method
                          ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200'
                          : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white text-[11px] flex items-center justify-between">
                        <span>{m.method}</span>
                        {selectedEstimationMethod === m.method && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineering Mandate & Honesty Note */}
              <div className="rounded-xl border border-amber-900/70 bg-amber-950/30 p-3 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Technical Calibration Mandate</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  An uncalibrated single RGB dashcam image <strong>cannot</strong> determine absolute physical depth by itself, and dark pixel shadows do not prove deep cavities. Monocular values represent scaled photogrammetric visual estimates. Official road repair dispatch requires calibrated caliper verification by an authorized inspector.
                </p>
              </div>

              {/* Authorized Inspector Physical Caliper Entry Tool */}
              <div className="rounded-xl border border-cyan-500/50 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Authorized Inspector Caliper Entry Tool
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">GHMC AUDIT READY</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Inspector Name &amp; ID
                    </label>
                    <input
                      type="text"
                      value={inspectorNameInput}
                      onChange={(e) => setInspectorNameInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Caliper Depth (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      value={caliperDepthInput}
                      onChange={(e) => setCaliperDepthInput(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Cavity Diameter (cm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="300"
                      value={caliperDiameterInput}
                      onChange={(e) => setCaliperDiameterInput(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={caliperSubgradeExposed}
                      onChange={(e) => setCaliperSubgradeExposed(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                    <span>Subgrade Base Course Exposed (Increases Priority to Critical)</span>
                  </label>

                  <button
                    onClick={handleSaveCaliperMeasurement}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition shadow-lg cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Save Verified Measurement</span>
                  </button>
                </div>

                {caliperSavedSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Physical caliper measurement saved and synced with Municipal Incident Triage!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Corridor: {profilerScenario.coordinates.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDepthProfiler(false)}
                  className="px-4 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    handleSendToIncidentTriage(profilerScenario);
                    setShowDepthProfiler(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer shadow"
                >
                  Dispatch to Triage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedLogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  Detection Telemetry: {selectedLogItem.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs leading-relaxed">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Identified Defect</div>
                <div className="text-base font-bold text-white">{selectedLogItem.displayTitle}</div>
                <div className="text-cyan-300 font-mono text-[11px]">
                  Category: {selectedLogItem.category} &bull; Priority: {selectedLogItem.priority.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Optical Confidence</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedLogItem.confidence}% (Simulated)</span>
                </div>
                <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Simulated Distance</span>
                  <span className="font-mono text-amber-300 font-bold">{selectedLogItem.simulatedDistance}m Ahead</span>
                </div>
                <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Location / Corridor</span>
                  <span className="text-slate-200 truncate block">{selectedLogItem.coordinates.name}</span>
                </div>
                <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Timestamp</span>
                  <span className="font-mono text-slate-300">{selectedLogItem.timestamp}</span>
                </div>
              </div>

              {selectedLogItem.potholeData && (
                <div className="rounded-xl bg-slate-950 p-3 border border-cyan-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 uppercase text-[10px]">
                      Pothole Dimensional Profile
                    </span>
                    <span className="px-2 py-0.2 rounded text-[9px] bg-red-950 text-red-300 font-mono font-bold">
                      {selectedLogItem.potholeData.classification}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div>Depth: <strong className="text-white">{selectedLogItem.potholeData.estimatedDepthCm}cm</strong></div>
                    <div>Diameter: <strong className="text-white">{selectedLogItem.potholeData.estimatedDiameterCm}cm</strong></div>
                    <div>Method: <span className="text-slate-400 truncate block">{selectedLogItem.potholeData.estimationMethod.split(' ')[0]}</span></div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-slate-200">Description:</span>
                <p className="text-slate-400 text-xs">{selectedLogItem.description}</p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedLogItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
                {selectedLogItem.submissionStatus !== 'Submitted' && (
                  <button
                    onClick={() => {
                      handleSendToIncidentTriage(selectedLogItem);
                      setSelectedLogItem(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Send to Incident Triage
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
