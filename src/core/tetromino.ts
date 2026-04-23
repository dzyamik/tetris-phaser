export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Rotation = 0 | 1 | 2 | 3;
export type Offset = readonly [col: number, row: number];

export const PIECE_IDS: readonly PieceId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

// Spawn column for piece origin on a 10-wide board.
export const SPAWN_COL = 4;
// Spawn row for piece origin. Rows 0-1 are the hidden buffer; row 0 keeps all
// spawn-state minos inside the 22-row board while the visible area starts at row 2.
export const SPAWN_ROW = 0;

// Rotation-0 offsets, (col, row) relative to each piece's rotation pivot.
// +row = down, matching the board. See docs-dev/GAME-DESIGN.md §2–3.
const SPAWN_OFFSETS: Readonly<Record<PieceId, ReadonlyArray<Offset>>> = {
  I: [[-1, 0], [0, 0], [1, 0], [2, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[-1, 0], [0, 0], [1, 0], [0, 1]],
  S: [[0, 0], [1, 0], [-1, 1], [0, 1]],
  Z: [[-1, 0], [0, 0], [0, 1], [1, 1]],
  J: [[-1, 0], [-1, 1], [0, 1], [1, 1]],
  L: [[1, 0], [-1, 1], [0, 1], [1, 1]],
};

function rotateOffsetsCW(offsets: ReadonlyArray<Offset>): ReadonlyArray<Offset> {
  return offsets.map(([c, r]) => [-r, c] as const);
}

type RotationTable = readonly [
  ReadonlyArray<Offset>,
  ReadonlyArray<Offset>,
  ReadonlyArray<Offset>,
  ReadonlyArray<Offset>,
];

function buildRotations(base: ReadonlyArray<Offset>): RotationTable {
  const r1 = rotateOffsetsCW(base);
  const r2 = rotateOffsetsCW(r1);
  const r3 = rotateOffsetsCW(r2);
  return [base, r1, r2, r3];
}

const O_ROTATIONS: RotationTable = [
  SPAWN_OFFSETS.O,
  SPAWN_OFFSETS.O,
  SPAWN_OFFSETS.O,
  SPAWN_OFFSETS.O,
];

const ROTATIONS: Readonly<Record<PieceId, RotationTable>> = {
  I: buildRotations(SPAWN_OFFSETS.I),
  O: O_ROTATIONS,
  T: buildRotations(SPAWN_OFFSETS.T),
  S: buildRotations(SPAWN_OFFSETS.S),
  Z: buildRotations(SPAWN_OFFSETS.Z),
  J: buildRotations(SPAWN_OFFSETS.J),
  L: buildRotations(SPAWN_OFFSETS.L),
};

export function pieceOffsets(id: PieceId, rotation: Rotation): ReadonlyArray<Offset> {
  return ROTATIONS[id][rotation];
}

export function rotate(rotation: Rotation, dir: 'cw' | 'ccw'): Rotation {
  return (dir === 'cw' ? (rotation + 1) % 4 : (rotation + 3) % 4) as Rotation;
}
