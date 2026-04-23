import type { LineCount } from '@/core/scoring';

type Note = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

function ctor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export class AudioService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private volume = 0.7;
  private unlocked = false;

  init(): void {
    if (typeof window === 'undefined') return;
    const unlock = (): void => this.ensureContext();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    this.applyVolume();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    this.applyVolume();
  }

  getVolume(): number {
    return this.volume;
  }

  isSupported(): boolean {
    return ctor() !== null;
  }

  move(): void {
    this.play([{ freq: 220, duration: 0.04, type: 'square', gain: 0.08 }]);
  }

  rotate(): void {
    this.play([{ freq: 440, duration: 0.05, type: 'square', gain: 0.1 }]);
  }

  softDrop(): void {
    this.play([{ freq: 160, duration: 0.03, type: 'triangle', gain: 0.06 }]);
  }

  lock(): void {
    this.play([{ freq: 110, duration: 0.08, type: 'triangle', gain: 0.14 }]);
  }

  lineClear(count: LineCount): void {
    if (count >= 4) {
      this.play([
        { freq: 523, duration: 0.09, type: 'square', gain: 0.16 },
        { freq: 659, duration: 0.09, type: 'square', gain: 0.16, delay: 0.05 },
        { freq: 784, duration: 0.09, type: 'square', gain: 0.16, delay: 0.1 },
        { freq: 1047, duration: 0.14, type: 'square', gain: 0.18, delay: 0.15 },
      ]);
    } else {
      this.play([
        { freq: 523, duration: 0.08, type: 'square', gain: 0.14 },
        { freq: 659, duration: 0.1, type: 'square', gain: 0.14, delay: 0.05 },
      ]);
    }
  }

  levelUp(): void {
    this.play([
      { freq: 523, duration: 0.08, type: 'square', gain: 0.14 },
      { freq: 784, duration: 0.08, type: 'square', gain: 0.14, delay: 0.06 },
      { freq: 1047, duration: 0.14, type: 'square', gain: 0.16, delay: 0.12 },
    ]);
  }

  gameOver(): void {
    this.play([
      { freq: 440, duration: 0.1, type: 'sawtooth', gain: 0.12 },
      { freq: 349, duration: 0.12, type: 'sawtooth', gain: 0.12, delay: 0.08 },
      { freq: 262, duration: 0.2, type: 'sawtooth', gain: 0.14, delay: 0.18 },
    ]);
  }

  private ensureContext(): void {
    if (!this.ctx) {
      const AC = ctor();
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.applyVolume();
        this.master.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        this.master = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.unlocked = true;
  }

  private applyVolume(): void {
    if (!this.master) return;
    this.master.gain.value = this.enabled ? this.volume : 0;
  }

  private play(notes: Note[]): void {
    if (!this.enabled || !this.unlocked || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    for (const n of notes) this.schedule(n, now);
  }

  private schedule(note: Note, baseTime: number): void {
    if (!this.ctx || !this.master) return;
    const start = baseTime + (note.delay ?? 0);
    const end = start + note.duration;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(note.freq, start);
    const peak = note.gain ?? 0.15;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g);
    g.connect(this.master);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

export const audio = new AudioService();
