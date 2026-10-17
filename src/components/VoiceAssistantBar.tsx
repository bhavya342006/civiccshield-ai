import React, { useEffect, useState } from 'react';
import { voiceAssistantService, VoiceMessage } from '../services/voiceAssistantService';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VoiceAssistantBarProps {
  onRunDemoScript?: () => void;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({ onRunDemoScript }) => {
  const [transcript, setTranscript] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [guidanceEnabled, setGuidanceEnabled] = useState<boolean>(true);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<VoiceMessage[]>([]);

  useEffect(() => {
    setTranscript(voiceAssistantService.getCurrentTranscript());
    setIsMuted(voiceAssistantService.getIsMuted());
    setIsSpeaking(voiceAssistantService.getIsSpeaking());
    setGuidanceEnabled(voiceAssistantService.getIsVoiceGuidanceEnabled());
    setHistory(voiceAssistantService.getHistory());

    const unsubscribe = voiceAssistantService.subscribe(() => {
      setTranscript(voiceAssistantService.getCurrentTranscript());
      setIsMuted(voiceAssistantService.getIsMuted());
      setIsSpeaking(voiceAssistantService.getIsSpeaking());
      setGuidanceEnabled(voiceAssistantService.getIsVoiceGuidanceEnabled());
      setHistory(voiceAssistantService.getHistory());
    });

    return () => unsubscribe();
  }, []);

  const handleStartVoiceDemo = () => {
    if (onRunDemoScript) {
      onRunDemoScript();
    } else {
      voiceAssistantService.speak(
        'CivicShield AI voice demonstration active. Live audio telemetry enabled for field inspections and incident triage.',
        'demo',
        true
      );
    }
  };

  const handleStopVoice = () => {
    voiceAssistantService.stop();
  };

  const handleToggleMute = () => {
    const muted = voiceAssistantService.toggleMute();
    setIsMuted(muted);
  };

  const handleReplay = () => {
    voiceAssistantService.replayLast();
  };

  const handleToggleGuidance = () => {
    const next = !guidanceEnabled;
    setGuidanceEnabled(next);
    voiceAssistantService.setVoiceGuidance(next);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-xl text-xs space-y-2">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition ${
              isSpeaking
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_#06b6d4] animate-pulse'
                : 'bg-slate-900 border border-slate-700 text-cyan-400'
            }`}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4" />}
          </div>
          <div>
            <span className="font-bold text-white text-xs block">
              CivicShield Voice Guidance
            </span>
            <span className="text-[10px] text-slate-400">
              {isSpeaking ? 'Speaking audio telemetry...' : isMuted ? 'Audio Muted' : 'Voice synthesis standby'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleStartVoiceDemo}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-2.5 py-1 text-[11px] transition shadow"
            title="Start scripted voice demonstration"
          >
            <Play className="h-3 w-3" />
            <span>START VOICE DEMO</span>
          </button>

          <button
            onClick={handleStopVoice}
            disabled={!isSpeaking}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 text-[11px] transition disabled:opacity-40"
            title="Stop current speech"
          >
            <Square className="h-3 w-3" />
            <span>STOP</span>
          </button>

          <button
            onClick={handleToggleMute}
            className={`p-1.5 rounded-lg border transition ${
              isMuted
                ? 'bg-red-950/60 border-red-700 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleReplay}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="Replay last spoken alert"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleToggleGuidance}
            className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition ${
              guidanceEnabled
                ? 'bg-cyan-950 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Enable/Disable automatic voice alerts on new detections"
          >
            {guidanceEnabled ? 'Voice Guidance: ON' : 'Voice Guidance: OFF'}
          </button>
        </div>
      </div>

      {/* Live Transcript Display Box */}
      <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-[11px] flex items-start gap-2">
        <Radio className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-slate-400 text-[10px] uppercase block">
            Current Spoken Transcript:
          </span>
          <p className="text-slate-200 italic font-mono text-[11px] mt-0.5">
            "{transcript}"
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="text-slate-400 hover:text-cyan-400 p-1"
          title="Toggle transcript history"
        >
          {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Collapsible Transcript History */}
      {historyOpen && (
        <div className="rounded-lg bg-slate-950 p-2 border border-slate-800 max-h-32 overflow-y-auto space-y-1 text-[10px]">
          <span className="font-semibold text-slate-400 uppercase block pb-1 border-b border-slate-800">
            Voice Audit History ({history.length})
          </span>
          {history.length === 0 ? (
            <div className="text-slate-500 py-1">No speech events logged yet.</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-2 py-0.5 border-b border-slate-900/80">
                <span className="text-slate-300">{item.text}</span>
                <span className="text-slate-500 font-mono shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
