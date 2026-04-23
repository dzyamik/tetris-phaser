import type { LineCount } from '@/core/scoring';

function supported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export class HapticsService {
  private enabled = true;

  isSupported(): boolean {
    return supported();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value && supported()) {
      navigator.vibrate(0);
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  lock(): void {
    this.fire(12);
  }

  lineClear(count: LineCount): void {
    if (count >= 4) {
      this.fire([30, 30, 30, 30, 80]);
    } else if (count >= 2) {
      this.fire([20, 40, 40]);
    } else {
      this.fire(25);
    }
  }

  gameOver(): void {
    this.fire([80, 60, 80, 60, 200]);
  }

  private fire(pattern: number | number[]): void {
    if (!this.enabled || !supported()) return;
    navigator.vibrate(pattern);
  }
}

export const haptics = new HapticsService();
