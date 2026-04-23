import * as Phaser from 'phaser';
import { initialState, reducer, type GameState } from '@/core/state';
import type { Phase } from '@/core/state';
import type { LineCount } from '@/core/scoring';
import type { PieceId } from '@/core/tetromino';
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
  CANVAS_WIDTH,
} from '@/config/layout';
import { theme } from '@/config/theme';
import { haptics } from '@/services/HapticsService';

const FRAME_MS = 1000 / 60;
const MAX_ACCUM_MS = 2000;
const GAME_OVER_DELAY_MS = 450;

const PAUSE_BTN_W = 64;
const PAUSE_BTN_H = 24;
const PAUSE_BTN_FILL = 0x222222;
const PAUSE_BTN_HOVER = 0x333333;
const PAUSE_BTN_STROKE = 0x555555;

type GameSceneData = { startLevel?: number; seed?: number };

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
  private paused = false;

  private prevActiveId: PieceId | undefined = undefined;
  private prevLines = 0;
  private prevPhase: Phase = 'falling';

  private pauseBtnBg!: Phaser.GameObjects.Rectangle;
  private pauseBtnText!: Phaser.GameObjects.Text;
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayText!: Phaser.GameObjects.Text;
  private overlayHint!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.startLevel = data.startLevel ?? 0;
    this.seed = data.seed ?? (Date.now() >>> 0);
    this.accumMs = 0;
    this.transitioning = false;
    this.paused = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    this.state = initialState({ startLevel: this.startLevel, seed: this.seed });
    this.prevActiveId = this.state.active?.id;
    this.prevLines = this.state.lines;
    this.prevPhase = this.state.phase;

    this.bus = new InputBus();
    this.keyboard = new KeyboardInput(this, this.bus);
    this.keyboard.attach();
    this.touch = new TouchInput(this, this.bus);
    this.touch.attach();

    this.board = new BoardRenderer(this);
    this.hud = new HUDRenderer(this);

    this.add.text(BOARD_X, BOARD_Y - 28, 'TETRIS', {
      color: theme.text,
      fontFamily: 'monospace',
      fontSize: '16px',
    });

    this.createPauseButton();
    this.createPauseOverlay();

    this.board.render(this.state);
    this.hud.render(this.state);

    const kb = this.input.keyboard;
    const onPauseKey = (): void => this.togglePause();
    if (kb) {
      kb.on('keydown-P', onPauseKey);
      kb.on('keydown-ESC', onPauseKey);
    }

    this.events.once('shutdown', () => {
      this.keyboard.detach();
      this.touch.detach();
      this.bus.clear();
      this.board.destroy();
      this.hud.destroy();
      if (kb) {
        kb.off('keydown-P', onPauseKey);
        kb.off('keydown-ESC', onPauseKey);
      }
    });
  }

  private createPauseButton(): void {
    const cx = CANVAS_WIDTH - 8 - PAUSE_BTN_W / 2;
    const cy = 24;
    this.pauseBtnBg = this.add
      .rectangle(cx, cy, PAUSE_BTN_W, PAUSE_BTN_H, PAUSE_BTN_FILL)
      .setStrokeStyle(1, PAUSE_BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    this.pauseBtnText = this.add
      .text(cx, cy, 'PAUSE', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.pauseBtnBg.on('pointerdown', () => this.togglePause());
    this.pauseBtnBg.on('pointerover', () =>
      this.pauseBtnBg.setFillStyle(PAUSE_BTN_HOVER),
    );
    this.pauseBtnBg.on('pointerout', () =>
      this.pauseBtnBg.setFillStyle(PAUSE_BTN_FILL),
    );
  }

  private createPauseOverlay(): void {
    const cx = BOARD_X + BOARD_PIXEL_WIDTH / 2;
    const cy = BOARD_Y + BOARD_PIXEL_HEIGHT / 2;
    this.overlayBg = this.add
      .rectangle(cx, cy, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT, 0x000000, 0.75)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.overlayBg.on('pointerdown', () => this.togglePause());

    this.overlayText = this.add
      .text(cx, cy - 12, 'PAUSED', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.overlayHint = this.add
      .text(cx, cy + 24, 'P OR TAP TO RESUME', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private togglePause(): void {
    if (this.state.phase === 'over' || this.transitioning) return;
    this.paused = !this.paused;

    if (this.paused) {
      this.bus.clear();
      this.state = reducer(this.state, { type: 'SetHold', dir: 0 });
      this.state = reducer(this.state, { type: 'SoftDrop', held: false });
      this.board.render(this.state);
      this.hud.render(this.state);
    } else {
      this.bus.clear();
      this.accumMs = 0;
    }

    this.pauseBtnText.setText(this.paused ? 'RESUME' : 'PAUSE');
    this.overlayBg.setVisible(this.paused);
    this.overlayText.setVisible(this.paused);
    this.overlayHint.setVisible(this.paused);
  }

  override update(_time: number, deltaMs: number): void {
    if (this.transitioning || this.paused) return;

    this.accumMs += deltaMs;
    if (this.accumMs > MAX_ACCUM_MS) this.accumMs = MAX_ACCUM_MS;

    while (this.accumMs >= FRAME_MS && this.state.phase !== 'over') {
      this.accumMs -= FRAME_MS;
      this.step();
    }

    this.board.render(this.state);
    this.hud.render(this.state);
    this.fireHapticsForTransitions();

    if (this.state.phase === 'over') {
      this.transitioning = true;
      this.time.delayedCall(GAME_OVER_DELAY_MS, () => this.transitionToGameOver());
    }
  }

  private step(): void {
    for (const action of this.bus.drain()) {
      this.state = reducer(this.state, action);
    }
    this.state = reducer(this.state, { type: 'Tick' });
  }

  private fireHapticsForTransitions(): void {
    const ns = this.state;
    if (ns.phase === 'over' && this.prevPhase !== 'over') {
      haptics.gameOver();
    } else if (ns.lines > this.prevLines) {
      const delta = ns.lines - this.prevLines;
      const count = Math.min(4, Math.max(1, delta)) as LineCount;
      haptics.lineClear(count);
    } else if (
      this.prevActiveId !== undefined &&
      ns.active?.id !== this.prevActiveId
    ) {
      haptics.lock();
    }
    this.prevActiveId = ns.active?.id;
    this.prevLines = ns.lines;
    this.prevPhase = ns.phase;
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
