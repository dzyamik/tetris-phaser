import * as Phaser from 'phaser';
import { initialState, reducer, type GameState } from '@/core/state';
import type { ActivePiece, Phase } from '@/core/state';
import type { LineCount } from '@/core/scoring';
import type { PieceId } from '@/core/tetromino';
import { pieceOffsets } from '@/core/tetromino';
import { InputBus } from '@/input/InputBus';
import { KeyboardInput } from '@/input/KeyboardInput';
import { TouchInput } from '@/input/TouchInput';
import { BoardRenderer } from '@/renderers/BoardRenderer';
import { HUDRenderer } from '@/renderers/HUDRenderer';
import {
  BOARD_PIXEL_HEIGHT,
  BOARD_PIXEL_WIDTH,
  BOARD_X,
  BOARD_Y,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
} from '@/config/layout';
import { theme } from '@/config/theme';
import { haptics } from '@/services/HapticsService';
import { storage } from '@/services/StorageService';
import { audio } from '@/services/AudioService';
import type { Action } from '@/core/actions';
import { HIDDEN_ROWS } from '@/core/board';
import { textureKeyFor } from '@/renderers/BlockTextures';

const FRAME_MS = 1000 / 60;
const MAX_ACCUM_MS = 2000;
const GAME_OVER_DELAY_MS = 450;

function systemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const PAUSE_BTN_W = 64;
const PAUSE_BTN_H = 24;
const PAUSE_BTN_FILL = 0x222222;
const PAUSE_BTN_HOVER = 0x333333;
const PAUSE_BTN_STROKE = 0x555555;

type GameSceneData = { startLevel?: number; seed?: number; resume?: boolean };

export default class GameScene extends Phaser.Scene {
  private state!: GameState;
  private bus!: InputBus;
  private keyboard!: KeyboardInput;
  private touch!: TouchInput;
  private board!: BoardRenderer;
  private hud!: HUDRenderer;
  private accumMs = 0;
  private startLevel = 0;
  private seed = 1;
  private transitioning = false;
  private resumedState: GameState | null = null;

  private prevActiveId: PieceId | undefined = undefined;
  private prevLines = 0;
  private prevPhase: Phase = 'falling';
  private prevLevel = 0;

  private reducedMotion = false;
  private clearEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private scanlinesOverlay?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.accumMs = 0;
    this.transitioning = false;
    this.resumedState = null;

    if (data.resume) {
      const saved = storage.getSavedGame() as GameState | null;
      if (saved && typeof saved === 'object') {
        this.resumedState = saved;
        this.startLevel = saved.startLevel ?? 0;
        this.seed = saved.rng?.seed ?? (Date.now() >>> 0);
        return;
      }
    }

    this.startLevel = data.startLevel ?? 0;
    this.seed = data.seed ?? (Date.now() >>> 0);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    if (this.input.keyboard) this.input.keyboard.enabled = true;

    this.state =
      this.resumedState ?? initialState({ startLevel: this.startLevel, seed: this.seed });
    this.prevActiveId = this.state.active?.id;
    this.prevLines = this.state.lines;
    this.prevPhase = this.state.phase;
    this.prevLevel = this.state.level;

    const settings = storage.getSettings();
    this.reducedMotion = settings.reducedMotion || systemPrefersReducedMotion();

    this.bus = new InputBus();
    this.keyboard = new KeyboardInput(this, this.bus);
    this.keyboard.attach();
    this.touch = new TouchInput(this, this.bus, settings.controlLayout);
    this.touch.attach();

    this.board = new BoardRenderer(this);
    this.hud = new HUDRenderer(this);

    if (!this.reducedMotion) {
      this.clearEmitter = this.add.particles(0, 0, textureKeyFor('I'), {
        lifespan: 520,
        speed: { min: 60, max: 220 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 260,
        rotate: { min: 0, max: 360 },
        emitting: false,
      });
      this.clearEmitter.setDepth(10);
    }

    if (settings.scanlines) {
      this.scanlinesOverlay = this.drawScanlines();
    }

    audio.startMusic();

    this.add.text(BOARD_X, BOARD_Y - 28, 'TETRIS', {
      color: theme.text,
      fontFamily: 'monospace',
      fontSize: '16px',
    });

    this.createPauseButton();

    this.board.render(this.state);
    this.hud.render(this.state);

    const kb = this.input.keyboard;
    const onPauseKey = (): void => this.pauseGame();
    if (kb) {
      kb.on('keydown-P', onPauseKey);
      kb.on('keydown-ESC', onPauseKey);
    }

    this.events.on('pause', this.onScenePause, this);
    this.events.on('resume', this.onSceneResume, this);

    this.events.once('shutdown', () => {
      this.keyboard.detach();
      this.touch.detach();
      this.bus.clear();
      this.board.destroy();
      this.hud.destroy();
      this.clearEmitter?.destroy();
      this.scanlinesOverlay?.destroy();
      if (kb) {
        kb.off('keydown-P', onPauseKey);
        kb.off('keydown-ESC', onPauseKey);
      }
      this.events.off('pause', this.onScenePause, this);
      this.events.off('resume', this.onSceneResume, this);
    });
  }

  private drawScanlines(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
      g.fillRect(0, y, CANVAS_WIDTH, 1);
    }
    g.setDepth(1000);
    return g;
  }

  private createPauseButton(): void {
    const cx = CANVAS_WIDTH - 8 - PAUSE_BTN_W / 2;
    const cy = 24;
    const bg = this.add
      .rectangle(cx, cy, PAUSE_BTN_W, PAUSE_BTN_H, PAUSE_BTN_FILL)
      .setStrokeStyle(1, PAUSE_BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, 'PAUSE', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    bg.on('pointerdown', () => this.pauseGame());
    bg.on('pointerover', () => bg.setFillStyle(PAUSE_BTN_HOVER));
    bg.on('pointerout', () => bg.setFillStyle(PAUSE_BTN_FILL));
  }

  private pauseGame(): void {
    if (this.state.phase === 'over' || this.transitioning) return;
    if (this.scene.isPaused()) return;
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  private onScenePause(): void {
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    this.bus.clear();
    this.state = reducer(this.state, { type: 'SetHold', dir: 0 });
    this.state = reducer(this.state, { type: 'SoftDrop', held: false });
    this.board.render(this.state);
    this.hud.render(this.state);
    if (this.state.phase !== 'over') {
      storage.setSavedGame(this.state);
    }
  }

  private onSceneResume(): void {
    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.bus.clear();
    this.accumMs = 0;

    // The user may have flipped CONTROLS in Settings; re-attach with the current layout.
    const layout = storage.getSettings().controlLayout;
    this.touch.detach();
    this.touch = new TouchInput(this, this.bus, layout);
    this.touch.attach();
  }

  override update(_time: number, deltaMs: number): void {
    if (this.transitioning) return;

    this.accumMs += deltaMs;
    if (this.accumMs > MAX_ACCUM_MS) this.accumMs = MAX_ACCUM_MS;

    while (this.accumMs >= FRAME_MS && this.state.phase !== 'over') {
      this.accumMs -= FRAME_MS;
      this.step();
    }

    this.board.render(this.state);
    this.hud.render(this.state);
    this.fireTransitionEffects();

    if (this.state.phase === 'over') {
      storage.clearSavedGame();
      this.transitioning = true;
      this.time.delayedCall(GAME_OVER_DELAY_MS, () => this.transitionToGameOver());
    }
  }

  private step(): void {
    for (const action of this.bus.drain()) {
      const before = this.state;
      this.state = reducer(this.state, action);
      this.fireActionAudio(action, before, this.state);
    }
    const beforeTick = this.state;
    this.state = reducer(this.state, { type: 'Tick' });
    const locked = beforeTick.active;
    if (
      locked &&
      this.state.active?.id !== locked.id &&
      this.state.lines === beforeTick.lines &&
      this.state.phase !== 'over'
    ) {
      this.flashLockedCells(locked);
    }
  }

  private flashLockedCells(piece: ActivePiece): void {
    if (this.reducedMotion) return;
    const offsets = pieceOffsets(piece.id, piece.rotation);
    for (const [dc, dr] of offsets) {
      const c = piece.col + dc;
      const r = piece.row + dr;
      if (r < HIDDEN_ROWS) continue;
      const x = BOARD_X + c * CELL_SIZE + CELL_SIZE / 2;
      const y = BOARD_Y + (r - HIDDEN_ROWS) * CELL_SIZE + CELL_SIZE / 2;
      const flash = this.add.rectangle(x, y, CELL_SIZE - 2, CELL_SIZE - 2, 0xffffff, 0.65);
      flash.setDepth(15);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => flash.destroy(),
      });
    }
  }

  private fireActionAudio(action: Action, before: GameState, after: GameState): void {
    switch (action.type) {
      case 'Move':
        if (before.active?.col !== after.active?.col) audio.move();
        break;
      case 'Rotate':
        if (before.active?.rotation !== after.active?.rotation) audio.rotate();
        break;
      case 'SoftDrop':
        if (action.held && !before.softDrop) audio.softDrop();
        break;
      default:
        break;
    }
  }

  private fireTransitionEffects(): void {
    const ns = this.state;
    if (ns.phase === 'over' && this.prevPhase !== 'over') {
      haptics.gameOver();
      audio.gameOver();
    } else if (ns.lines > this.prevLines) {
      const delta = ns.lines - this.prevLines;
      const count = Math.min(4, Math.max(1, delta)) as LineCount;
      haptics.lineClear(count);
      audio.lineClear(count);
      this.fireClearVisuals(count, ns.lastClear?.rows);
    } else if (
      this.prevActiveId !== undefined &&
      ns.active?.id !== this.prevActiveId
    ) {
      haptics.lock();
      audio.lock();
    }
    if (ns.level > this.prevLevel) {
      audio.levelUp();
    }
    this.prevActiveId = ns.active?.id;
    this.prevLines = ns.lines;
    this.prevPhase = ns.phase;
    this.prevLevel = ns.level;
  }

  private fireClearVisuals(count: LineCount, rows?: ReadonlyArray<number>): void {
    if (this.reducedMotion) return;

    if (count === 4) {
      this.cameras.main.shake(260, 0.01);
    } else if (count >= 2) {
      this.cameras.main.shake(120, 0.004);
    }

    if (!this.clearEmitter || !rows || !this.prevActiveId) return;
    this.clearEmitter.setTexture(textureKeyFor(this.prevActiveId));
    const cx = BOARD_X + BOARD_PIXEL_WIDTH / 2;
    const perRow = count === 4 ? 18 : 12;
    for (const row of rows) {
      const y = BOARD_Y + (row - HIDDEN_ROWS) * CELL_SIZE + CELL_SIZE / 2;
      this.clearEmitter.explode(perRow, cx, y);
    }
    void BOARD_PIXEL_HEIGHT;
  }

  private transitionToGameOver(): void {
    this.scene.start('GameOverScene', {
      score: this.state.score,
      level: this.state.level,
      lines: this.state.lines,
      startLevel: this.startLevel,
    });
  }
}
