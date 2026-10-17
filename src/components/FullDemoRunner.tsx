import React, { useState, useRef } from 'react';
import { Incident } from '../types/incident';
import { incidentService } from '../services/incidentService';
import { voiceAssistantService } from '../services/voiceAssistantService';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Layers,
  ChevronRight,
  Shield,
  Volume2,
  Scan,
  CheckCircle2,
} from 'lucide-react';

interface FullDemoRunnerProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onFilterCritical: () => void;
  onFilterAll: () => void;
  onStartRoadScan: () => void;
  onPauseRoadScan: () => void;
  onOpenRoadSimulator?: () => void;
}

export const FullDemoRunner: React.FC<FullDemoRunnerProps> = ({
  incidents,
  onSelectIncident,
  onFilterCritical,
  onFilterAll,
  onStartRoadScan,
  onPauseRoadScan,
  onOpenRoadSimulator,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepDescription, setStepDescription] = useState<string>('Ready for 1-Click Judge Guided Walkthrough');
  const demoTimerRef = useRef<any>(null);

  const steps = [
    {
      num: 1,
      title: 'Initialize Walkthrough',
      desc: 'Starting CivicShield AI platform walkthrough. Initializing demonstration corridor.',
      action: () => {
        voiceAssistantService.speak('CivicShield AI demonstration initiated. Activating road corridor scanning.');
      },
    },
    {
      num: 2,
      title: 'Corridor Scanning',
      desc: 'Scanning active transit artery. Generating real-time geographic radar telemetry.',
      action: () => {
        onStartRoadScan();
      },
    },
    {
      num: 3,
      title: 'Detect Critical Defect',
      desc: 'Flagging critical cavity DEMO-001 on Cyber Towers down-ramp.',
      action: () => {
        const inc = incidents.find((i) => i.id === 'DEMO-001') || incidents[0];
        if (inc) {
          onSelectIncident(inc);
          voiceAssistantService.speak('Potential critical pothole detected. Incident DEMO-001 requires triage review.');
        }
      },
    },
    {
      num: 4,
      title: 'Dispatch Triage',
      desc: 'Advancing DEMO-001 to Under Review with automated priority scoring.',
      action: () => {
        incidentService.updateIncidentStage('DEMO-001', 'under_review', 'Central Triage AI Engine', 'SYSTEM', 'Simulated Demo Step: Escalated to Under Review');
      },
    },
    {
      num: 5,
      title: 'Volunteer Claim',
      desc: 'Volunteer Ravi Kumar accepts field inspection task on volunteer board.',
      action: () => {
        incidentService.assignVolunteer('DEMO-001', {
          id: 'VOL-HYD-07',
          name: 'Ravi Kumar (Field Volunteer)',
          phone: '+91 91234 56789',
        });
      },
    },
    {
      num: 6,
      title: 'Submit Inspection Evidence',
      desc: 'Volunteer submits on-site measurements and recommends pothole patching.',
      action: () => {
        incidentService.submitInspection('DEMO-001', {
          inspectorId: 'VOL-HYD-07',
          inspectorName: 'Ravi Kumar',
          notes: 'Walkthrough Step: Measured 0.85m diameter, 11cm depth. Asphalt barricades deployed.',
          severityConfirmed: 'critical',
          recommendsClosure: true,
        });
      },
    },
    {
      num: 7,
      title: 'Official Resolution Approval',
      desc: 'Superintending Municipal Authority reviews inspection and officially approves closure.',
      action: () => {
        incidentService.authorityReview(
          'DEMO-001',
          'approved',
          'Chief Municipal Officer (GHMC)',
          'Walkthrough Step: Physical road resurfacing verified complete. Incident officially closed.'
        );
      },
    },
  ];

  const runStep = (stepIndex: number) => {
    if (stepIndex >= steps.length) {
      setIsRunning(false);
      setCurrentStep(steps.length);
      setStepDescription('Walkthrough Completed Successfully! All systems verified.');
      voiceAssistantService.speak('Full demonstration scenario completed successfully.');
      return;
    }

    const step = steps[stepIndex];
    setCurrentStep(step.num);
    setStepDescription(`${step.num}/${steps.length}: ${step.title} — ${step.desc}`);
    step.action();

    demoTimerRef.current = setTimeout(() => {
      runStep(stepIndex + 1);
    }, 4500);
  };

  const handleStartFullDemo = () => {
    setIsRunning(true);
    setCurrentStep(1);
    runStep(0);
  };

  const handlePauseDemo = () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    setIsRunning(false);
    setStepDescription('Demonstration Paused.');
    voiceAssistantService.speak('Demonstration scenario paused.');
  };

  const handleResetDemo = () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    setIsRunning(false);
    setCurrentStep(0);
    setStepDescription('Ready for 1-Click Judge Guided Walkthrough');
    incidentService.resetDemoData();
    onFilterAll();
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 shadow-xl text-xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-white text-xs block">
              Judge Demonstration Suite
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {stepDescription}
            </span>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isRunning ? (
            <button
              onClick={handleStartFullDemo}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-3 py-1.5 text-xs transition shadow-lg shadow-cyan-900/30"
              title="Automated 11-step hackathon judge scenario"
            >
              <Play className="h-3.5 w-3.5" />
              <span>START FULL DEMO</span>
            </button>
          ) : (
            <button
              onClick={handlePauseDemo}
              className="flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 text-xs transition shadow"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>PAUSE DEMO</span>
            </button>
          )}

          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1.5 text-xs transition"
            title="Reset demonstration records"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET DEMO</span>
          </button>

          <button
            onClick={onFilterCritical}
            className="flex items-center gap-1 rounded-lg border border-red-900/80 bg-red-950/60 hover:bg-red-900 text-red-300 px-2.5 py-1.5 text-xs transition"
            title="Show only Critical Hazards"
          >
            <Flame className="h-3.5 w-3.5 text-red-400" />
            <span>CRITICAL ONLY</span>
          </button>

          <button
            onClick={onFilterAll}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1.5 text-xs transition cursor-pointer"
            title="Show All Hazards"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>ALL INCIDENTS</span>
          </button>

          {onOpenRoadSimulator && (
            <button
              onClick={onOpenRoadSimulator}
              className="flex items-center gap-1 rounded-lg border border-cyan-800 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-semibold px-2.5 py-1.5 text-xs transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              title="Open realistic driver-perspective road simulator"
            >
              <Scan className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>ROAD SIMULATOR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
