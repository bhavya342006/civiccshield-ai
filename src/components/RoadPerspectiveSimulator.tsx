import React, { useState, useEffect, useRef } from 'react';
import { Incident, IncidentCategory, IncidentPriority, AIDetectionResult } from '../types/incident';
import { incidentService } from '../services/incidentService';
import { voiceAssistantService } from '../services/voiceAssistantService';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Scan,
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
  Gauge,
  Sparkles,
  Camera,
  Activity,
  Layers,
  X,
  Radio,
  Sliders,
} from 'lucide-react';

interface RoadPerspectiveSimulatorProps {
  onClose?: () => void;
  onNavigateToTriage?: () => void;
  onNavigateToMap?: () => void;
}

export interface SimulatorScenario {
  id: string;
  name: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  rdd2022Class: string;
  confidence: number;
  severityScore: number;
  measuredEstimate: string;
  description: string;
  bgImageUrl: string;
  roadName: string;
  coordinates: { lat: number; lng: number; name: string };
  detections: {
    id: string;
    label: string;
    category: IncidentCategory;
    priority: IncidentPriority;
    bbox: [number, number, number, number]; // [left%, top%, width%, height%]
    confidence: number;
    severityScore: number;
    measuredEstimate: string;
  }[];
}

export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: 'sc-1-pothole',
    name: 'Scenario 1: Deep Asphalt Pothole Detection',
    category: 'Deep potholes',
    priority: 'critical',
    rdd2022Class: 'D40 (Severe Pothole Cavity)',
    confidence: 0.948,
    severityScore: 9.1,
    measuredEstimate: '~0.85m diameter, 11cm depth (Visual Estimate)',
    description: 'Subgrade exposure detected in active vehicular lane. Vehicle wheels swerving on Cyber Towers flyover down-ramp.',
    bgImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Cyber Towers Flyover Down-Ramp, Hitec City',
    coordinates: {
      lat: 17.4504,
      lng: 78.3809,
      name: 'Cyber Towers Flyover Down-Ramp, Hitec City',
    },
    detections: [
      {
        id: 'det-1',
        label: 'Pothole - Grade 3 (Critical)',
        category: 'Deep potholes',
        priority: 'critical',
        bbox: [32, 45, 36, 38],
        confidence: 0.948,
        severityScore: 9.1,
        measuredEstimate: '~0.85m diameter, 11cm depth',
      },
    ],
  },
  {
    id: 'sc-2-waterlogging',
    name: 'Scenario 2: Monsoon Waterlogging & Blocked Inflow',
    category: 'Waterlogging',
    priority: 'high',
    rdd2022Class: 'Surface Water Submersion / Drainage Choke',
    confidence: 0.914,
    severityScore: 8.2,
    measuredEstimate: '~1.5ft standing water across 35m (Visual Estimate)',
    description: 'Stormwater inlet choked with plastic and silt. Continuous standing water flooding bus lane and eroding road shoulder.',
    bgImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Gachibowli ORR Junction Arterial, Hyderabad',
    coordinates: {
      lat: 17.4401,
      lng: 78.3489,
      name: 'Gachibowli ORR Junction Arterial, Hyderabad',
    },
    detections: [
      {
        id: 'det-2',
        label: 'Waterlogging & Choked Inflow (High)',
        category: 'Waterlogging',
        priority: 'high',
        bbox: [18, 52, 64, 42],
        confidence: 0.914,
        severityScore: 8.2,
        measuredEstimate: '1.5ft standing water depth',
      },
    ],
  },
  {
    id: 'sc-3-cracks',
    name: 'Scenario 3: Longitudinal & Alligator Cracking Network',
    category: 'Alligator cracking',
    priority: 'high',
    rdd2022Class: 'D20 (Alligator Fatigue Cracking)',
    confidence: 0.892,
    severityScore: 7.6,
    measuredEstimate: 'Spans ~28m linear corridor (Visual Estimate)',
    description: 'Extensive web-like asphalt delamination. Subgrade water infiltration accelerating surface fatigue before severe cavity formation.',
    bgImageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Kondapur Botanical Garden Road, Hyderabad',
    coordinates: {
      lat: 17.4589,
      lng: 78.3614,
      name: 'Kondapur Botanical Garden Road, Hyderabad',
    },
    detections: [
      {
        id: 'det-3',
        label: 'Alligator Cracking Network (High)',
        category: 'Alligator cracking',
        priority: 'high',
        bbox: [20, 32, 60, 58],
        confidence: 0.892,
        severityScore: 7.6,
        measuredEstimate: '28m linear fracture pattern',
      },
    ],
  },
  {
    id: 'sc-4-manhole',
    name: 'Scenario 4: Displaced Storm Chamber Manhole Cover',
    category: 'Open manholes',
    priority: 'critical',
    rdd2022Class: 'D00 (Cast-Iron Chamber Dislocation)',
    confidence: 0.937,
    severityScore: 9.6,
    measuredEstimate: '0.65m open void (Visual Estimate)',
    description: 'Heavy cast-iron stormwater lid dislodged. Direct fall danger for cyclists, pedestrians, and two-wheelers in low-light conditions.',
    bgImageUrl: 'https://images.unsplash.com/photo-1584463699042-4b26792b95fa?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Road No. 36 Jubilee Hills, Near Metro Station',
    coordinates: {
      lat: 17.4326,
      lng: 78.4071,
      name: 'Road No. 36 Jubilee Hills, Near Metro Station',
    },
    detections: [
      {
        id: 'det-4',
        label: 'Open Manhole Void (Critical Fall Hazard)',
        category: 'Open manholes',
        priority: 'critical',
        bbox: [32, 28, 38, 54],
        confidence: 0.937,
        severityScore: 9.6,
        measuredEstimate: '0.65m open void depth 2.4m',
      },
    ],
  },
  {
    id: 'sc-5-debris',
    name: 'Scenario 5: Solid Waste Spillage & Construction Debris',
    category: 'Debris on roads',
    priority: 'high',
    rdd2022Class: 'Unregulated Highway Obstruction',
    confidence: 0.885,
    severityScore: 7.1,
    measuredEstimate: '~2.2 metric tons rubble (Visual Estimate)',
    description: 'Uncovered concrete fragments and crushed aggregate spilled from transit tipper truck, obstructing left driving lane.',
    bgImageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Financial District Outer Circle, Nanakramguda',
    coordinates: {
      lat: 17.4190,
      lng: 78.3440,
      name: 'Financial District Outer Circle, Nanakramguda',
    },
    detections: [
      {
        id: 'det-5',
        label: 'Construction Debris & Obstruction (High)',
        category: 'Debris on roads',
        priority: 'high',
        bbox: [26, 42, 48, 46],
        confidence: 0.885,
        severityScore: 7.1,
        measuredEstimate: '~2.2 tons rubble spread over 15m',
      },
    ],
  },
  {
    id: 'sc-6-streetlight',
    name: 'Scenario 6: Broken Streetlight & Darkness Blackspot',
    category: 'Broken streetlights',
    priority: 'medium',
    rdd2022Class: 'Photometric Illumination Deficit',
    confidence: 0.912,
    severityScore: 6.8,
    measuredEstimate: '3 consecutive dark poles spanning 90m corridor',
    description: 'High-mast luminaire failure creating a 90-meter unilluminated blind zone along an unlit pedestrian crossing.',
    bgImageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Inorbit Mall Link Road, Mindspace, Madhapur',
    coordinates: {
      lat: 17.4485,
      lng: 78.3741,
      name: 'Inorbit Mall Link Road, Mindspace, Madhapur',
    },
    detections: [
      {
        id: 'det-6-light',
        label: 'Luminaire Array Outage (Dark Blackspot)',
        category: 'Broken streetlights',
        priority: 'medium',
        bbox: [24, 20, 52, 60],
        confidence: 0.912,
        severityScore: 6.8,
        measuredEstimate: '3 non-functional poles over 90m',
      },
    ],
  },
  {
    id: 'sc-7-obstruction',
    name: 'Scenario 7: Fallen Tree Branch & Lane Obstruction',
    category: 'Damaged public infrastructure',
    priority: 'critical',
    rdd2022Class: 'Active Roadway Encroachment',
    confidence: 0.928,
    severityScore: 8.9,
    measuredEstimate: '0.45m trunk diameter blocking 1.8 lanes',
    description: 'Heavy tree limb snapped following thunderstorm gust, completely blocking two vehicular lanes on the perimeter highway.',
    bgImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    roadName: 'KBR Park Perimeter Ring Road, Banjara Hills',
    coordinates: {
      lat: 17.4260,
      lng: 78.4110,
      name: 'KBR Park Perimeter Ring Road, Banjara Hills',
    },
    detections: [
      {
        id: 'det-7-tree',
        label: 'Fallen Tree Obstruction (Critical)',
        category: 'Damaged public infrastructure',
        priority: 'critical',
        bbox: [16, 40, 68, 48],
        confidence: 0.928,
        severityScore: 8.9,
        measuredEstimate: 'Trunk diameter 45cm across 1.8 lanes',
      },
    ],
  },
  {
    id: 'sc-8-pedestrian',
    name: 'Scenario 8: Shattered Crash Barrier & Pedestrian Conflict',
    category: 'Damaged road barriers',
    priority: 'high',
    rdd2022Class: 'Structural Barrier Failure',
    confidence: 0.905,
    severityScore: 7.9,
    measuredEstimate: '8m twisted crash barrier flange',
    description: 'Impact damage buckled median guardrail, forcing pedestrians into oncoming traffic lane to bypass barricade.',
    bgImageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Gachibowli Stadium Flyover Service Road',
    coordinates: {
      lat: 17.4372,
      lng: 78.3582,
      name: 'Gachibowli Stadium Flyover Service Road',
    },
    detections: [
      {
        id: 'det-8-guardrail',
        label: 'Collapsed Guardrail & Pedestrian Conflict (High)',
        category: 'Damaged road barriers',
        priority: 'high',
        bbox: [22, 36, 56, 50],
        confidence: 0.905,
        severityScore: 7.9,
        measuredEstimate: '8m structural barrier displacement',
      },
    ],
  },
  {
    id: 'sc-9-mixed',
    name: 'Scenario 9: Mixed Multi-Hazard Arterial Corridor',
    category: 'Deep potholes',
    priority: 'critical',
    rdd2022Class: 'Multi-Target Complex Defect Array',
    confidence: 0.942,
    severityScore: 9.4,
    measuredEstimate: 'Multiple concurrent hazards across 60m road zone',
    description: 'High-density urban road corridor exhibiting multiple simultaneous defects: deep pothole cavity, surface fatigue crack, and damaged road kerb.',
    bgImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    roadName: 'Hitec City Metro Station Arterial, Hyderabad',
    coordinates: {
      lat: 17.4442,
      lng: 78.3831,
      name: 'Hitec City Metro Station Arterial, Hyderabad',
    },
    detections: [
      {
        id: 'det-9a',
        label: 'Pothole Cavity #1 (Critical)',
        category: 'Deep potholes',
        priority: 'critical',
        bbox: [16, 52, 34, 38],
        confidence: 0.942,
        severityScore: 9.2,
        measuredEstimate: '0.8m diameter, 10cm depth',
      },
      {
        id: 'det-9b',
        label: 'Surface Fatigue Crack #2 (Medium)',
        category: 'Longitudinal cracks',
        priority: 'medium',
        bbox: [56, 42, 38, 48],
        confidence: 0.895,
        severityScore: 6.8,
        measuredEstimate: '18m longitudinal crack',
      },
      {
        id: 'det-9c',
        label: 'Eroded Kerb & Drain Choke #3 (High)',
        category: 'Damaged public infrastructure',
        priority: 'high',
        bbox: [4, 60, 26, 32],
        confidence: 0.912,
        severityScore: 7.5,
        measuredEstimate: 'Concrete kerb crumbled into drain',
      },
    ],
  },
];

export const RoadPerspectiveSimulator: React.FC<RoadPerspectiveSimulatorProps> = ({
  onClose,
  onNavigateToTriage,
  onNavigateToMap,
}) => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const activeScenario = SIMULATOR_SCENARIOS[scenarioIndex];

  // Simulation Controls State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [showDetections, setShowDetections] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Selected detection in active scenario (especially for mixed hazard scenario)
  const [selectedDetectionId, setSelectedDetectionId] = useState<string>(
    activeScenario.detections[0]?.id || ''
  );

  // Session Statistics
  const [sessionDetectionsCount, setSessionDetectionsCount] = useState(1);
  const [createdIncident, setCreatedIncident] = useState<Incident | null>(null);
  const [triageStatus, setTriageStatus] = useState<string>('Standby / Not Dispatched');

  // Perspective Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const roadOffsetRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);

  // Reset selected detection when scenario changes
  useEffect(() => {
    if (activeScenario.detections.length > 0) {
      setSelectedDetectionId(activeScenario.detections[0].id);
    }
  }, [scenarioIndex]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      try {
        if (engineOscRef.current) {
          engineOscRef.current.stop();
          engineOscRef.current.disconnect();
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
      } catch (e) {
        // Ignore audio cleanup errors
      }
    };
  }, []);

  // Web Audio engine sound synthesizer
  const updateAudio = (running: boolean) => {
    if (!voiceEnabled) {
      if (engineGainRef.current) {
        engineGainRef.current.gain.setTargetAtTime(0, 0, 0.1);
      }
      return;
    }

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(65, ctx.currentTime);

          // Low pass filter to make it sound like a smooth engine rumble
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(140, ctx.currentTime);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, ctx.currentTime);

          osc.start();
          engineOscRef.current = osc;
          engineGainRef.current = gain;
        }
      }

      if (audioCtxRef.current && engineGainRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const targetVol = running ? 0.04 : 0;
        engineGainRef.current.gain.setTargetAtTime(targetVol, audioCtxRef.current.currentTime, 0.1);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Perspective Road Motion Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = isRunning && !isPaused;
    updateAudio(running);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Horizon line
      const horizonY = height * 0.40;

      // Draw Perspective Road Polygon with subtle dark asphalt gradient
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, 'rgba(10, 15, 30, 0.45)');
      roadGrad.addColorStop(1, 'rgba(6, 10, 20, 0.85)');

      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(width * 0.38, horizonY);
      ctx.lineTo(width * 0.62, horizonY);
      ctx.lineTo(width * 0.96, height);
      ctx.lineTo(width * 0.04, height);
      ctx.closePath();
      ctx.fill();

      // Left & Right Rumble Kerbs (Alternating red and white segments streaming forward)
      if (running) {
        roadOffsetRef.current = (roadOffsetRef.current + 3.2) % 40;
      }

      const numSegments = 12;
      for (let i = 0; i < numSegments; i++) {
        const t1 = Math.pow((i * 40 + roadOffsetRef.current) / (numSegments * 40), 2.1);
        const t2 = Math.pow(((i + 0.5) * 40 + roadOffsetRef.current) / (numSegments * 40), 2.1);

        if (t1 < 1 && t2 < 1) {
          const y1 = horizonY + t1 * (height - horizonY);
          const y2 = horizonY + t2 * (height - horizonY);

          // Left rumble strip
          const lx1 = width * 0.38 - t1 * (width * 0.38 - width * 0.04);
          const lx2 = width * 0.38 - t2 * (width * 0.38 - width * 0.04);

          // Right rumble strip
          const rx1 = width * 0.62 + t1 * (width * 0.96 - width * 0.62);
          const rx2 = width * 0.62 + t2 * (width * 0.96 - width * 0.62);

          const isRed = i % 2 === 0;
          ctx.strokeStyle = isRed ? '#ef4444' : '#ffffff';
          ctx.lineWidth = 2 + t1 * 8;

          // Left kerb line
          ctx.beginPath();
          ctx.moveTo(lx1, y1);
          ctx.lineTo(lx2, y2);
          ctx.stroke();

          // Right kerb line
          ctx.beginPath();
          ctx.moveTo(rx1, y1);
          ctx.lineTo(rx2, y2);
          ctx.stroke();
        }
      }

      // Moving Dashed Center Line with realistic 3D perspective foreshortening
      for (let i = 0; i < numSegments; i++) {
        const t1 = Math.pow((i * 40 + roadOffsetRef.current) / (numSegments * 40), 2.2);
        const t2 = Math.pow(((i + 0.45) * 40 + roadOffsetRef.current) / (numSegments * 40), 2.2);

        if (t1 < 1 && t2 < 1) {
          const y1 = horizonY + t1 * (height - horizonY);
          const y2 = horizonY + t2 * (height - horizonY);
          const x1 = width * 0.5;
          const x2 = width * 0.5;
          const lineWidth = 1.5 + t1 * 8;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Moving Lane Divider Lines (Left lane dash & right lane dash)
      for (let i = 0; i < numSegments; i += 2) {
        const t1 = Math.pow((i * 40 + roadOffsetRef.current) / (numSegments * 40), 2.3);
        const t2 = Math.pow(((i + 0.35) * 40 + roadOffsetRef.current) / (numSegments * 40), 2.3);

        if (t1 < 1 && t2 < 1) {
          const y1 = horizonY + t1 * (height - horizonY);
          const y2 = horizonY + t2 * (height - horizonY);

          // Left sub-lane line
          const lSubX1 = width * 0.44 - t1 * (width * 0.44 - width * 0.28);
          const lSubX2 = width * 0.44 - t2 * (width * 0.44 - width * 0.28);

          // Right sub-lane line
          const rSubX1 = width * 0.56 + t1 * (width * 0.72 - width * 0.56);
          const rSubX2 = width * 0.56 + t2 * (width * 0.72 - width * 0.56);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1 + t1 * 4;

          ctx.beginPath();
          ctx.moveTo(lSubX1, y1);
          ctx.lineTo(lSubX2, y2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rSubX1, y1);
          ctx.lineTo(rSubX2, y2);
          ctx.stroke();
        }
      }

      // Windscreen Dashboard Edge (Curved silhouette of hood at the very bottom)
      ctx.fillStyle = '#080d1a';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height - 16);
      ctx.quadraticCurveTo(width * 0.5, height - 32, width, height - 16);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Cyan accent trim on hood edge
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 16);
      ctx.quadraticCurveTo(width * 0.5, height - 32, width, height - 16);
      ctx.stroke();

      if (running) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (running) {
      animFrameRef.current = requestAnimationFrame(render);
    } else {
      render();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, isPaused, voiceEnabled]);

  // Controls Handlers
  const handleStartSimulation = () => {
    setIsRunning(true);
    setIsPaused(false);
    setSpeedKmh(48);
    if (voiceEnabled) {
      voiceAssistantService.speak('Road simulation started. Edge camera scanning active road corridor.');
    }
  };

  const handlePauseSimulation = () => {
    setIsPaused(true);
    setSpeedKmh(0);
    if (voiceEnabled) {
      voiceAssistantService.speak('Road simulation paused.');
    }
  };

  const handleResumeSimulation = () => {
    setIsPaused(false);
    setSpeedKmh(48);
    if (voiceEnabled) {
      voiceAssistantService.speak('Road simulation resumed.');
    }
  };

  const handleStopSimulation = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSpeedKmh(0);
    if (voiceEnabled) {
      voiceAssistantService.speak('Road simulation stopped.');
    }
  };

  const handleRestartSimulation = () => {
    setScenarioIndex(0);
    setIsRunning(true);
    setIsPaused(false);
    setSpeedKmh(48);
    setCreatedIncident(null);
    setTriageStatus('Standby / Not Dispatched');
    if (voiceEnabled) {
      voiceAssistantService.speak('Road simulation restarted from initial scenario.');
    }
  };

  const handleNextScenario = () => {
    const nextIdx = (scenarioIndex + 1) % SIMULATOR_SCENARIOS.length;
    setScenarioIndex(nextIdx);
    setSessionDetectionsCount((prev) => prev + 1);
    setCreatedIncident(null);
    setTriageStatus('Standby / Not Dispatched');
    if (voiceEnabled) {
      voiceAssistantService.speak(`Advancing to ${SIMULATOR_SCENARIOS[nextIdx].name.split(':')[0]}.`);
    }
  };

  // Dispatch to Incident Triage
  const handleSendToIncidentTriage = () => {
    const activeDetection =
      activeScenario.detections.find((d) => d.id === selectedDetectionId) ||
      activeScenario.detections[0];

    const newInc = incidentService.createIncident({
      title: `${activeDetection.label} (Road Simulator Detection)`,
      category: activeDetection.category,
      priority: activeDetection.priority,
      status: 'initial_triage',
      triagePriorityRationale: `Detected via Road Perspective Simulator session along ${activeScenario.roadName}. Identified as ${activeDetection.label} with ${(activeDetection.confidence * 100).toFixed(0)}% optical confidence.`,
      description: `Automated detection generated in Road Perspective Simulator: ${activeScenario.description}. Measurement estimate: ${activeDetection.measuredEstimate}.`,
      location: {
        name: activeScenario.coordinates.name,
        region: 'Hyderabad',
        lat: activeScenario.coordinates.lat,
        lng: activeScenario.coordinates.lng,
        address: `${activeScenario.coordinates.name}, Telangana`,
        accuracyMeters: 4,
      },
      photoUrl: activeScenario.bgImageUrl,
      isDemo: true,
      dataSource: 'SYNTHETIC_DEMO',
      reporter: {
        name: 'CivicShield In-Vehicle Road Scanner AI [SIM]',
        isAnonymous: false,
      },
      aiDetection: {
        detectedCategory: activeDetection.label,
        confidence: activeDetection.confidence,
        severityScore: activeDetection.severityScore,
        damageType: activeScenario.rdd2022Class,
        bbox: activeDetection.bbox,
        measuredSurfaceDamageEstimated: activeDetection.measuredEstimate,
        measurementMethod: 'Visual Estimate',
        modelSource: 'CivicShield In-Vehicle Edge YOLOv11 [SIM]',
        detectionTimestamp: new Date().toISOString(),
      },
    });

    setCreatedIncident(newInc);
    setTriageStatus(`Dispatched to Authority Queue (${newInc.id})`);

    if (voiceEnabled) {
      voiceAssistantService.speak(
        `Potential hazard selected for incident triage. Incident ${newInc.id} created and dispatched.`
      );
    }
  };

  const currentSelectedDetection =
    activeScenario.detections.find((d) => d.id === selectedDetectionId) ||
    activeScenario.detections[0];

  return (
    <div className="relative rounded-2xl border border-cyan-500/40 bg-slate-950 shadow-2xl overflow-hidden flex flex-col text-slate-100">
      {/* Top Windscreen Header & Simulator Status Banner */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Scan className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">
                Driver Perspective Road Hazard Simulator
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                1080p 60FPS AI SCANNER
              </span>
            </div>
            <p className="text-[10px] text-cyan-400 font-mono tracking-wide">
              SYNTHETIC DEMONSTRATION SIMULATION — NOT REAL CAMERA FOOTAGE
            </p>
          </div>
        </div>

        {/* Speedometer & Live Telemetry Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Speed:</span>
            <span className={`font-bold ${isRunning && !isPaused ? 'text-emerald-400' : 'text-slate-400'}`}>
              {speedKmh} km/h
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close Simulator"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Perspective Visual Viewport */}
      <div className="relative h-[380px] sm:h-[480px] bg-black overflow-hidden flex items-center justify-center select-none">
        {/* Background Road Photograph */}
        <img
          src={activeScenario.bgImageUrl}
          alt={activeScenario.name}
          className={`absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transition-transform duration-700 ${
            isRunning && !isPaused ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Overlay 3D Perspective Road Canvas (Moving Lane Dashes & Shaders) */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={500}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
        />

        {/* Windscreen Laser Scanning Sweep Bar */}
        {isRunning && !isPaused && (
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] pointer-events-none road-simulator-laser z-10" />
        )}

        {/* Camera HUD Grid Overlay & Target Reticle */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-950/40 z-10 flex flex-col justify-between p-3">
          <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300">
            <span className="bg-slate-950/85 px-2 py-0.5 rounded border border-cyan-800/80">
              REC &bull; CAM_FRONT_01 (WFOV 120°)
            </span>
            <span className="bg-slate-950/85 px-2 py-0.5 rounded border border-cyan-800/80">
              RDD2022: {activeScenario.rdd2022Class}
            </span>
          </div>

          <div className="flex justify-between items-end text-[10px] font-mono text-slate-400">
            <span className="bg-slate-950/85 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              SYNTHETIC GPS: {activeScenario.coordinates.lat.toFixed(4)}, {activeScenario.coordinates.lng.toFixed(4)}
            </span>
            <span className="bg-slate-950/85 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
              LATENCY: 14ms &bull; MODEL: YOLOv11-RoadDefect
            </span>
          </div>
        </div>

        {/* Interactive Bounding Boxes Overlaid on Road Hazards */}
        {showDetections &&
          activeScenario.detections.map((det) => {
            const isSelected = det.id === selectedDetectionId;
            return (
              <div
                key={det.id}
                onClick={() => setSelectedDetectionId(det.id)}
                className={`absolute cursor-pointer rounded transition-all duration-300 z-20 ${
                  isSelected
                    ? 'border-2 border-red-500 bg-red-500/25 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                    : 'border-2 border-orange-500/80 bg-orange-500/15 hover:border-red-400'
                }`}
                style={{
                  left: `${det.bbox[0]}%`,
                  top: `${det.bbox[1]}%`,
                  width: `${det.bbox[2]}%`,
                  height: `${det.bbox[3]}%`,
                }}
              >
                {/* Detection Label Badge */}
                <div className="absolute -top-7 left-0 bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 whitespace-nowrap">
                  <span>{det.label}</span>
                  <span className="bg-black/60 px-1 py-0.2 rounded text-[8px]">
                    {(det.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Corner Targeting Brackets */}
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white pointer-events-none" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white pointer-events-none" />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white pointer-events-none" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white pointer-events-none" />
              </div>
            );
          })}

        {/* Not Running State Overlay Screen */}
        {!isRunning && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <Scan className="h-8 w-8 animate-pulse" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white mb-1">
                Road Hazard Scanner Simulation Standby
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Experience in-vehicle perspective computer-vision scanning. Animate real forward vehicle motion across 9 road defect scenarios and directly dispatch detected hazards to Municipal Triage.
              </p>
            </div>
            <button
              onClick={handleStartSimulation}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 shadow-xl shadow-cyan-900/50 transition text-sm cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>START SIMULATION</span>
            </button>
          </div>
        )}
      </div>

      {/* Simulator Control Bar & Scenario Switcher */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Core Playback Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isRunning ? (
            <button
              onClick={handleStartSimulation}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 transition shadow cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>START SIMULATION</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResumeSimulation}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 transition shadow cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>RESUME SIMULATION</span>
            </button>
          ) : (
            <button
              onClick={handlePauseSimulation}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 transition shadow cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>PAUSE SIMULATION</span>
            </button>
          )}

          <button
            onClick={handleStopSimulation}
            disabled={!isRunning}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>STOP SIMULATION</span>
          </button>

          <button
            onClick={handleRestartSimulation}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 transition cursor-pointer"
            title="Restart from Scenario 1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESTART SIMULATION</span>
          </button>

          <button
            onClick={handleNextScenario}
            className="flex items-center gap-1 rounded-lg border border-cyan-800 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-semibold px-2.5 py-1.5 transition cursor-pointer"
          >
            <span>NEXT SCENARIO</span>
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* View & Audio Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDetections(!showDetections)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
              showDetections
                ? 'bg-slate-800 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {showDetections ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{showDetections ? 'HIDE DETECTIONS' : 'SHOW DETECTIONS'}</span>
          </button>

          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              updateAudio(next && isRunning && !isPaused);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
              voiceEnabled
                ? 'bg-slate-800 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{voiceEnabled ? 'VOICE ON' : 'VOICE MUTED'}</span>
          </button>
        </div>
      </div>

      {/* 9 Scenario Selector Tabs */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0 mr-1">
          Scenarios:
        </span>
        {SIMULATOR_SCENARIOS.map((sc, idx) => (
          <button
            key={sc.id}
            onClick={() => {
              setScenarioIndex(idx);
              setCreatedIncident(null);
            }}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition font-medium cursor-pointer ${
              scenarioIndex === idx
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {sc.name.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Realistic Scanning HUD & Triage Dispatch Panel */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-950">
        {/* Left: Telemetry & Detection Diagnostics */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                Active Hazard Diagnostic: {currentSelectedDetection.label}
              </span>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {(currentSelectedDetection.confidence * 100).toFixed(1)}% Optical Confidence
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {activeScenario.description}
            </p>

            {/* If Multiple Detections Exist (e.g. Scenario 9 Mixed Hazards), show selectable chips */}
            {activeScenario.detections.length > 1 && (
              <div className="pt-1 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Select Individual Hazard Target:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeScenario.detections.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDetectionId(d.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        selectedDetectionId === d.id
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="rounded bg-slate-950 p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Priority</span>
                <span className="font-bold uppercase text-red-400">{currentSelectedDetection.priority}</span>
              </div>
              <div className="rounded bg-slate-950 p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Severity</span>
                <span className="font-bold text-orange-400">{currentSelectedDetection.severityScore} / 10</span>
              </div>
              <div className="rounded bg-slate-950 p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Measurement</span>
                <span className="font-medium text-slate-200 truncate block" title={currentSelectedDetection.measuredEstimate}>
                  {currentSelectedDetection.measuredEstimate}
                </span>
              </div>
              <div className="rounded bg-slate-950 p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase font-semibold">Session Detections</span>
                <span className="font-bold text-cyan-300 font-mono">{sessionDetectionsCount}</span>
              </div>
            </div>

            {/* Simulated Data Honesty Notice */}
            <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              * Note: SIMULATED AI RESULT — NOT A REAL MODEL PREDICTION. Physical measurements are computer-vision visual estimates.
            </div>
          </div>
        </div>

        {/* Right: Dispatch to Incident Triage Action Card */}
        <div className="rounded-xl border border-cyan-500/40 bg-slate-900/80 p-3.5 flex flex-col justify-between space-y-3 shadow-lg">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Send className="h-4 w-4 text-cyan-400" />
              <span>Municipal Triage Connection</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Connect this simulated hazard directly to the authority triage queue and live geographic map.
            </p>

            <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
              <div>&bull; Road: <strong className="text-slate-200">{activeScenario.roadName}</strong></div>
              <div>&bull; Triage Status: <span className="text-cyan-300 font-mono">{triageStatus}</span></div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {!createdIncident ? (
              <button
                onClick={handleSendToIncidentTriage}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 text-xs transition shadow-lg shadow-cyan-900/40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>SEND TO INCIDENT TRIAGE</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    Created: <strong>{createdIncident.id}</strong> in Triage Queue
                  </span>
                </div>

                <div className="flex gap-2">
                  {onNavigateToTriage && (
                    <button
                      onClick={onNavigateToTriage}
                      className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 text-[11px] transition shadow cursor-pointer text-center"
                    >
                      View in Triage
                    </button>
                  )}
                  {onNavigateToMap && (
                    <button
                      onClick={onNavigateToMap}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 text-[11px] transition cursor-pointer text-center"
                    >
                      View on Map
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
