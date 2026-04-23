export type ControlLayout = 'right-handed' | 'left-handed';

export type Settings = {
  haptics: boolean;
  sound: boolean;
  volume: number;
  startingLevel: number;
  controlLayout: ControlLayout;
  reducedMotion: boolean;
  scanlines: boolean;
};

export type HighScore = {
  name: string;
  score: number;
  level: number;
  lines: number;
  date: string;
};

export const MAX_HIGH_SCORES = 10;

const KEY_SETTINGS = 'tetris.v1.settings';
const KEY_HIGH_SCORES = 'tetris.v1.highScores';
const KEY_SAVED_GAME = 'tetris.v1.savedGame';

const DEFAULT_SETTINGS: Settings = {
  haptics: true,
  sound: true,
  volume: 0.7,
  startingLevel: 0,
  controlLayout: 'right-handed',
  reducedMotion: false,
  scanlines: false,
};

function available(): boolean {
  return typeof localStorage !== 'undefined';
}

function safeRead(key: string): string | null {
  if (!available()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  if (!available()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota or private-mode denial — silently skip */
  }
}

function parseSettings(raw: string | null): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const data = JSON.parse(raw) as Partial<Settings>;
    return {
      haptics: typeof data.haptics === 'boolean' ? data.haptics : DEFAULT_SETTINGS.haptics,
      sound: typeof data.sound === 'boolean' ? data.sound : DEFAULT_SETTINGS.sound,
      volume:
        typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1
          ? data.volume
          : DEFAULT_SETTINGS.volume,
      startingLevel:
        typeof data.startingLevel === 'number' &&
        data.startingLevel >= 0 &&
        data.startingLevel <= 9
          ? Math.floor(data.startingLevel)
          : DEFAULT_SETTINGS.startingLevel,
      controlLayout:
        data.controlLayout === 'left-handed' ? 'left-handed' : DEFAULT_SETTINGS.controlLayout,
      reducedMotion:
        typeof data.reducedMotion === 'boolean'
          ? data.reducedMotion
          : DEFAULT_SETTINGS.reducedMotion,
      scanlines:
        typeof data.scanlines === 'boolean' ? data.scanlines : DEFAULT_SETTINGS.scanlines,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function parseHighScores(raw: string | null): HighScore[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (e): e is HighScore =>
          e != null &&
          typeof e === 'object' &&
          typeof (e as HighScore).name === 'string' &&
          typeof (e as HighScore).score === 'number' &&
          typeof (e as HighScore).level === 'number' &&
          typeof (e as HighScore).lines === 'number' &&
          typeof (e as HighScore).date === 'string',
      )
      .slice(0, MAX_HIGH_SCORES);
  } catch {
    return [];
  }
}

function safeRemove(key: string): void {
  if (!available()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

export class StorageService {
  private settings: Settings;
  private highScores: HighScore[];

  constructor() {
    this.settings = parseSettings(safeRead(KEY_SETTINGS));
    this.highScores = parseHighScores(safeRead(KEY_HIGH_SCORES));
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(patch: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...patch };
    safeWrite(KEY_SETTINGS, JSON.stringify(this.settings));
    return { ...this.settings };
  }

  getHighScores(): HighScore[] {
    return this.highScores.map((e) => ({ ...e }));
  }

  qualifiesForHighScore(score: number): boolean {
    if (score <= 0) return false;
    if (this.highScores.length < MAX_HIGH_SCORES) return true;
    const lowest = this.highScores[this.highScores.length - 1];
    return lowest ? score > lowest.score : true;
  }

  addHighScore(entry: HighScore): HighScore[] {
    const next = [...this.highScores, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HIGH_SCORES);
    this.highScores = next;
    safeWrite(KEY_HIGH_SCORES, JSON.stringify(next));
    return this.getHighScores();
  }

  hasSavedGame(): boolean {
    return safeRead(KEY_SAVED_GAME) !== null;
  }

  getSavedGame(): unknown {
    const raw = safeRead(KEY_SAVED_GAME);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setSavedGame(state: unknown): void {
    try {
      safeWrite(KEY_SAVED_GAME, JSON.stringify(state));
    } catch {
      /* circular ref or similar — drop silently */
    }
  }

  clearSavedGame(): void {
    safeRemove(KEY_SAVED_GAME);
  }
}

export const storage = new StorageService();
