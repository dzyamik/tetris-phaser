type PromptOutcome = 'accepted' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: PromptOutcome; platform: string }>;
}

type Listener = () => void;

export class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Listener[] = [];
  private installed = false;

  init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.installed = true;
      this.notify();
    });
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  isInstalled(): boolean {
    return this.installed;
  }

  onAvailabilityChange(cb: Listener): void {
    this.listeners.push(cb);
  }

  async prompt(): Promise<PromptOutcome | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    const evt = this.deferredPrompt;
    await evt.prompt();
    const result = await evt.userChoice;
    this.deferredPrompt = null;
    this.notify();
    return result.outcome;
  }

  private notify(): void {
    for (const cb of this.listeners) cb();
  }
}

export const pwa = new PWAService();
