type VoiceListener = () => void;

export interface VoiceMessage {
  id: string;
  text: string;
  timestamp: string;
  type: 'info' | 'alert' | 'success' | 'demo';
}

class VoiceAssistantService {
  private isMuted: boolean = false;
  private isVoiceGuidanceEnabled: boolean = true;
  private currentTranscript: string = '';
  private history: VoiceMessage[] = [];
  private listeners: Set<VoiceListener> = new Set();
  private lastSpokenTime: Record<string, number> = {};
  private cooldownMs: number = 6000; // Prevent repeated announcements
  private isSpeaking: boolean = false;

  constructor() {
    this.currentTranscript = 'Voice Assistant Ready. Click "START VOICE DEMO" or enable Voice Guidance.';
  }

  public subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Voice listener error:', err);
      }
    });
  }

  public speak(
    text: string,
    type: 'info' | 'alert' | 'success' | 'demo' = 'info',
    force: boolean = false
  ) {
    const now = Date.now();
    const lastSpoken = this.lastSpokenTime[text] || 0;

    // Check cooldown unless forced
    if (!force && now - lastSpoken < this.cooldownMs) {
      return;
    }
    this.lastSpokenTime[text] = now;

    this.currentTranscript = text;
    const msg: VoiceMessage = {
      id: 'vm-' + Math.random().toString(36).substring(2, 9),
      text,
      timestamp: new Date().toISOString(),
      type,
    };
    this.history = [msg, ...this.history.slice(0, 19)];
    this.notify();

    // Check if muted or voice guidance disabled
    if (this.isMuted || !this.isVoiceGuidanceEnabled) {
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel any backlog
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => {
          this.isSpeaking = true;
          this.notify();
        };
        utterance.onend = () => {
          this.isSpeaking = false;
          this.notify();
        };
        utterance.onerror = () => {
          this.isSpeaking = false;
          this.notify();
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis invocation failed:', e);
      }
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentTranscript = 'Voice announcement stopped.';
    this.notify();
  }

  public replayLast() {
    if (this.history.length > 0) {
      this.speak(this.history[0].text, this.history[0].type, true);
    } else {
      this.speak('No previous voice message recorded in current session.', 'info', true);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify();
    return this.isMuted;
  }

  public setVoiceGuidance(enabled: boolean) {
    this.isVoiceGuidanceEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsVoiceGuidanceEnabled(): boolean {
    return this.isVoiceGuidanceEnabled;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  public getHistory(): VoiceMessage[] {
    return [...this.history];
  }
}

export const voiceAssistantService = new VoiceAssistantService();
