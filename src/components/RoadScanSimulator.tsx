import React, { useEffect, useState, useRef } from 'react';
import { RoadCorridor, Incident } from '../types/incident';
import { ROAD_CORRIDORS } from '../data/roadCorridors';
import { voiceAssistantService } from '../services/voiceAssistantService';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Scan,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Activity,
  Layers,
  Bot,
  ChevronRight,
} from 'lucide-react';

interface RoadScanSimulatorProps {
  onCorridorSelect: (corridor: RoadCorridor | null) => void;
  onProgressUpdate: (progressPercent: number) => void;
  onScanStateChange: (isScanning: boolean) => void;
  onIncidentDetected: (incidentId: string) => void;
  incidents: Incident[];
  onOpenIncident: (incident: Incident) => void;
}

export const RoadScanSimulator: React.FC<RoadScanSimulatorProps> = ({
  onCorridorSelect,
  onProgressUpdate,
  onScanStateChange,
  onIncidentDetected,
  incidents,
  onOpenIncident,
}) => {
  const [selectedCorridor, setSelectedCorridor] = useState<RoadCorridor>(ROAD_CORRIDORS[0]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'paused' | 'hazard_detected' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [detectedIncidents, setDetectedIncidents] = useState<string[]>([]);
  const [lastDetectionTimestamp, setLastDetectionTimestamp] = useState<string>('Not started');
  const scanIntervalRef = useRef<any>(null);

  // Sync corridor selection to parent
  useEffect(() => {
    onCorridorSelect(selectedCorridor);
  }, [selectedCorridor.id]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleStartScan = () => {
    setScanStatus('scanning');
    onScanStateChange(true);
    voiceAssistantService.speak(
      `CivicShield AI road scan demonstration initiated along ${selectedCorridor.name.split(':')[0]}. Scanning corridor for surface defects.`
    );

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2.5;

        // Check if progress crosses a hazard checkpoint
        if (prev < 30 && next >= 30) {
          const firstHazard = selectedCorridor.segments[0]?.hazardIncidentIds[0] || 'DEMO-001';
          triggerHazardDetection(firstHazard, 30);
        } else if (prev < 65 && next >= 65) {
          const secondHazard = selectedCorridor.segments[1]?.hazardIncidentIds[0] || 'DEMO-004';
          triggerHazardDetection(secondHazard, 65);
        }

        if (next >= 100) {
          clearInterval(scanIntervalRef.current);
          setScanStatus('completed');
          onScanStateChange(false);
          voiceAssistantService.speak(
            `Road scan complete for ${selectedCorridor.name.split(':')[0]}. Monitored hazards triaged to authority command.`
          );
          return 100;
        }

        onProgressUpdate(next);
        return next;
      });
    }, 400);
  };

  const triggerHazardDetection = (incidentId: string, currentPct: number) => {
    setDetectedIncidents((prev) => Array.from(new Set([...prev, incidentId])));
    setLastDetectionTimestamp(new Date().toLocaleTimeString());
    onIncidentDetected(incidentId);

    const matching = incidents.find((i) => i.id === incidentId);
    if (matching) {
      voiceAssistantService.speak(
        `Potential hazard detected along scan line. Incident ${incidentId} requires review.`
      );
    }
  };

  const handlePauseScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanStatus('paused');
    onScanStateChange(false);
    voiceAssistantService.speak('Road scan paused.');
  };

  const handleStopScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanStatus('idle');
    setProgress(0);
    onProgressUpdate(0);
    onScanStateChange(false);
    voiceAssistantService.speak('Road scan terminated.');
  };

  const handleResetScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanStatus('idle');
    setProgress(0);
    setDetectedIncidents([]);
    setLastDetectionTimestamp('Reset');
    onProgressUpdate(0);
    onScanStateChange(false);
    voiceAssistantService.speak('Road scan simulation reset.');
  };

  const handleReplayScan = () => {
    handleResetScan();
    setTimeout(() => {
      handleStartScan();
    }, 300);
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-950/95 p-3.5 shadow-2xl text-xs space-y-3">
      {/* Header & Mode Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-950/80 border border-cyan-700/80 flex items-center justify-center text-cyan-400">
            <Scan className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs">
              Road Scan Simulator HUD
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">
              SIMULATED ROAD SCAN — DEMONSTRATION MODE
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
            scanStatus === 'scanning'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 animate-pulse'
              : scanStatus === 'completed'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
              : scanStatus === 'paused'
              ? 'bg-amber-950 text-amber-300 border border-amber-500'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          {scanStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Corridor Selector */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
          Active Demonstration Corridor
        </label>
        <select
          value={selectedCorridor.id}
          onChange={(e) => {
            const found = ROAD_CORRIDORS.find((c) => c.id === e.target.value);
            if (found) {
              setSelectedCorridor(found);
              handleResetScan();
            }
          }}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
        >
          {ROAD_CORRIDORS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 mt-1 italic">
          {selectedCorridor.description}
        </p>
      </div>

      {/* Progress Bar & Telemetry */}
      <div className="space-y-1.5 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Scanning Progress</span>
          <span className="font-mono text-cyan-300 font-bold">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_10px_#06b6d4]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
          <div>
            <span>Detected Hazards: </span>
            <strong className="text-red-400">{detectedIncidents.length}</strong>
          </div>
          <div>
            <span>Last Scan Update: </span>
            <span className="text-slate-200 font-mono">{lastDetectionTimestamp}</span>
          </div>
        </div>
      </div>

      {/* Detected Hazards in Current Scan Run */}
      {detectedIncidents.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">
            Corridor Detections Flagged:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detectedIncidents.map((id) => {
              const inc = incidents.find((i) => i.id === id);
              return (
                <button
                  key={id}
                  onClick={() => inc && onOpenIncident(inc)}
                  className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-300 text-[10px] font-mono font-bold flex items-center gap-1 transition"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>{id}</span>
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Control Buttons Grid */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {scanStatus !== 'scanning' ? (
          <button
            onClick={handleStartScan}
            className="col-span-2 flex items-center justify-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 text-xs transition shadow"
          >
            <Play className="h-3.5 w-3.5" />
            <span>START SCAN</span>
          </button>
        ) : (
          <button
            onClick={handlePauseScan}
            className="col-span-2 flex items-center justify-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold py-1.5 text-xs transition shadow"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>PAUSE</span>
          </button>
        )}

        <button
          onClick={handleStopScan}
          disabled={scanStatus === 'idle'}
          className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 py-1.5 text-xs transition disabled:opacity-50"
          title="Stop scan"
        >
          <Square className="h-3.5 w-3.5" />
          <span>STOP</span>
        </button>

        <button
          onClick={handleReplayScan}
          className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 py-1.5 text-xs transition"
          title="Replay from start"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>REPLAY</span>
        </button>

        <button
          onClick={handleResetScan}
          className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 py-1.5 text-xs transition"
          title="Reset scan state"
        >
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
