import React, { useState } from 'react';
import { AIDetectionResult, IncidentCategory, IncidentPriority } from '../types/incident';
import { RoadPerspectiveSimulator } from './RoadPerspectiveSimulator';
import {
  Bot,
  Camera,
  Scan,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
  Database,
  ExternalLink,
  Play,
  RotateCcw,
} from 'lucide-react';

interface AIDetectionLabProps {
  onAttachAndReport: (
    aiData: AIDetectionResult,
    category: IncidentCategory,
    priority: IncidentPriority,
    photoUrl: string
  ) => void;
  onNavigateToTriage?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToScanner?: () => void;
}

interface DefectPreset {
  id: string;
  name: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  photoUrl: string;
  bbox: [number, number, number, number];
  damageType: string;
  confidence: number;
  severityScore: number;
  measuredEstimate: string;
  measurementMethod: 'Visual Estimate' | 'Photogrammetric Approx' | 'Manual Required';
  description: string;
  rdd2022Class: string;
}

const PRESETS: DefectPreset[] = [
  {
    id: 'pothole-deep',
    name: 'Asphalt Deep Pothole (Grade 3)',
    category: 'Deep potholes',
    priority: 'critical',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    bbox: [25, 38, 50, 44],
    damageType: 'Asphalt Cavity Delamination',
    confidence: 0.95,
    severityScore: 9.1,
    measuredEstimate: '~0.85m diameter, 11cm depth',
    measurementMethod: 'Visual Estimate',
    description: 'Subgrade exposure detected. Immediate risk of two-wheeler rim damage and driver loss-of-control.',
    rdd2022Class: 'D40 (Pothole)',
  },
  {
    id: 'crack-alligator',
    name: 'Longitudinal & Fatigue Cracking Network',
    category: 'Alligator cracking',
    priority: 'high',
    photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    bbox: [18, 22, 65, 55],
    damageType: 'Structural Fatigue Cracking',
    confidence: 0.88,
    severityScore: 7.3,
    measuredEstimate: 'Spans ~28m linear corridor',
    measurementMethod: 'Visual Estimate',
    description: 'Structural base failure beginning to branch into alligator cracking. Requires asphalt slurry seal.',
    rdd2022Class: 'D20 (Alligator Crack)',
  },
  {
    id: 'manhole-open',
    name: 'Displaced Storm Chamber Lid',
    category: 'Open manholes',
    priority: 'critical',
    photoUrl: 'https://images.unsplash.com/photo-1584463699042-4b26792b95fa?auto=format&fit=crop&w=800&q=80',
    bbox: [30, 24, 40, 52],
    damageType: 'Cast Iron Frame Dislocation',
    confidence: 0.93,
    severityScore: 9.5,
    measuredEstimate: '0.65m diameter void',
    measurementMethod: 'Visual Estimate',
    description: 'Direct opening into underground stormwater conduit. Immediate hazard for nighttime pedestrians and cycles.',
    rdd2022Class: 'D00 (Manhole Chamber Defect)',
  },
  {
    id: 'waterlogging-inundated',
    name: 'Monsoon Standing Water Accumulation',
    category: 'Waterlogging',
    priority: 'high',
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    bbox: [10, 45, 80, 45],
    damageType: 'Submersion Obstruction',
    confidence: 0.91,
    severityScore: 8.2,
    measuredEstimate: 'Approx. 40cm water depth',
    measurementMethod: 'Photogrammetric Approx',
    description: 'Standing runoff water submerging road crown; concealed potholes beneath water surface.',
    rdd2022Class: 'Surface Water Flooding',
  },
];

export const AIDetectionLab: React.FC<AIDetectionLabProps> = ({
  onAttachAndReport,
  onNavigateToTriage,
  onNavigateToMap,
  onNavigateToScanner,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DefectPreset>(PRESETS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [detectionComplete, setDetectionComplete] = useState(true);

  // Road Perspective Simulator visibility inside Road Demo
  const [showSimulator, setShowSimulator] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setDetectionComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setDetectionComplete(true);
    }, 700);
  };

  const handleAttach = () => {
    const aiData: AIDetectionResult = {
      detectedCategory: selectedPreset.name,
      confidence: selectedPreset.confidence,
      severityScore: selectedPreset.severityScore,
      damageType: selectedPreset.damageType,
      bbox: selectedPreset.bbox,
      measuredSurfaceDamageEstimated: selectedPreset.measuredEstimate,
      measurementMethod: selectedPreset.measurementMethod,
      modelSource: 'CivicShield YOLOv11-RoadDefect Edge (RDD2022 Benchmarked)',
      detectionTimestamp: new Date().toISOString(),
    };

    onAttachAndReport(
      aiData,
      selectedPreset.category,
      selectedPreset.priority,
      selectedPreset.photoUrl
    );
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 pb-12 space-y-6">
      {/* Top Hero Card with START ROAD SIMULATOR Prominent Action */}
      <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-5 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Scan className="h-4 w-4 animate-pulse" />
            <span>In-Vehicle Edge AI Computer Vision Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AI Road Defect Diagnostic &amp; Realistic Road Simulator
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Experience real-time road hazard detection from the driver's perspective.
            The simulator animates forward vehicular motion, flags critical pavement cavities and waterlogging, and routes detections directly into Municipal Triage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition shadow-xl cursor-pointer ${
              showSimulator
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/60 hover:bg-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-900/50'
            }`}
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{showSimulator ? 'MINIMIZE ROAD SIMULATOR' : 'START ROAD SIMULATOR'}</span>
          </button>

          {onNavigateToScanner && (
            <button
              onClick={onNavigateToScanner}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-cyan-500/80 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 px-4 py-3 text-xs font-bold transition shadow-lg cursor-pointer"
            >
              <Scan className="h-4 w-4 text-cyan-400" />
              <span>FULL ACTIVE ROAD SCANNER</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Road Perspective Simulator Component */}
      {showSimulator && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <RoadPerspectiveSimulator
            onClose={() => setShowSimulator(false)}
            onNavigateToTriage={onNavigateToTriage}
            onNavigateToMap={onNavigateToMap}
          />
        </div>
      )}

      {/* Dataset & Honesty Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Database className="h-4 w-4 text-cyan-400 shrink-0" />
          <div className="text-slate-300">
            <span className="font-semibold text-white">Dataset Benchmark: </span>
            <span>Trained on <strong>Road Damage Dataset (RDD2022)</strong> multi-national road anomalies (D00, D10, D20, D40).</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
            300+ Indian Urban Road Samples Indexed
          </span>
        </div>
      </div>

      {/* Static Side-by-Side Image Verification Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Preset Test Scenarios */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              RDD2022 Defect Test Scenarios
            </h3>

            <div className="space-y-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset);
                    handleScan();
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col gap-1 ${
                    selectedPreset.id === preset.id
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{preset.name}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        preset.priority === 'critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-orange-950 text-orange-400 border border-orange-800'
                      }`}
                    >
                      {preset.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{preset.rdd2022Class}</span>
                    <span className="font-mono text-cyan-300">{(preset.confidence * 100).toFixed(0)}% conf</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Physical Measurement Honesty Note */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Physical Measurement Honesty</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              &bull; <strong>GPS Separation:</strong> Coordinates provide geographic location only. Cavity width, length, and depth are <em>not</em> derived from GPS.<br/>
              &bull; <strong>Confidence Types:</strong> Visual defect detection confidence ({ (selectedPreset.confidence * 100).toFixed(0) }%) is separated from physical measurement tolerances (Visual Estimate).
            </p>
          </div>
        </div>

        {/* Middle & Right: Side-by-Side Image Comparison Panels */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Scan className="h-4 w-4 text-cyan-400" />
                Side-by-Side Verification Canvas
              </span>
              <button
                onClick={handleScan}
                className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs transition"
              >
                Re-Run Inference
              </button>
            </div>

            {/* Side-by-Side Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT: ORIGINAL ROAD IMAGE */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-slate-800 bg-slate-900/70 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex justify-between">
                  <span>PANEL A: ORIGINAL ROAD IMAGE</span>
                  <span className="text-slate-500 font-mono">Raw Input</span>
                </div>
                <div className="relative h-64 bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedPreset.photoUrl}
                    alt="Original raw road photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* RIGHT: AI ANALYSIS WITH BOUNDING BOX */}
              <div className="rounded-xl border border-cyan-800/80 bg-slate-950 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-slate-800 bg-cyan-950/40 text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex justify-between">
                  <span>PANEL B: AI ANALYSIS &amp; BOUNDING BOX</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {(selectedPreset.confidence * 100).toFixed(0)}% Optical Confidence
                  </span>
                </div>
                <div className="relative h-64 bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedPreset.photoUrl}
                    alt="AI analyzed road defect"
                    className="w-full h-full object-cover"
                  />

                  {/* Scanning Animation */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse"></div>
                      <span className="absolute text-cyan-300 font-mono text-xs font-bold tracking-widest uppercase bg-black/80 px-3 py-1 rounded">
                        Running YOLOv11 Inference...
                      </span>
                    </div>
                  )}

                  {/* Bounding Box */}
                  {!isScanning && detectionComplete && (
                    <div
                      className="absolute border-2 border-red-500 bg-red-500/20 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300"
                      style={{
                        left: `${selectedPreset.bbox[0]}%`,
                        top: `${selectedPreset.bbox[1]}%`,
                        width: `${selectedPreset.bbox[2]}%`,
                        height: `${selectedPreset.bbox[3]}%`,
                      }}
                    >
                      <div className="absolute -top-7 left-0 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 whitespace-nowrap">
                        <span>{selectedPreset.name}</span>
                        <span className="bg-black/60 px-1 py-0.2 rounded text-[8px]">
                          {(selectedPreset.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Third Panel: Prototype Illustrative Reference Notice */}
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/80 p-2.5 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400">
                PROTOTYPE ILLUSTRATION — Model inference simulated against RDD2022 defect ground truth for hackathon demo.
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">
                Class: {selectedPreset.rdd2022Class}
              </span>
            </div>

            {/* Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  Optical Confidence
                </span>
                <span className="text-base font-bold text-cyan-300 font-mono">
                  {(selectedPreset.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  Severity Score
                </span>
                <span className="text-base font-bold text-orange-400 font-mono">
                  {selectedPreset.severityScore} / 10
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  Measurement Class
                </span>
                <span className="font-semibold text-slate-200 text-xs">
                  {selectedPreset.measurementMethod}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  Physical Est.
                </span>
                <span className="font-semibold text-slate-200 text-xs truncate block" title={selectedPreset.measuredEstimate}>
                  {selectedPreset.measuredEstimate}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <p className="leading-relaxed">{selectedPreset.description}</p>
            </div>

            {/* Action: Attach & Report */}
            <div className="pt-2">
              <button
                onClick={handleAttach}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 shadow-xl shadow-cyan-900/30 transition text-xs"
              >
                <span>Attach AI Diagnostic Record &amp; File Citizen Report</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
