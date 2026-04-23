export type Action =
  | { type: 'Move'; dir: -1 | 1 }
  | { type: 'SetHold'; dir: -1 | 0 | 1 }
  | { type: 'Rotate'; dir: 'cw' | 'ccw' }
  | { type: 'SoftDrop'; held: boolean }
  | { type: 'Tick' }
  | { type: 'Reset'; startLevel: number; seed: number };
