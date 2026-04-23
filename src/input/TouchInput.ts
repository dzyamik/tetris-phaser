import type * as Phaser from 'phaser';
import type { InputBus } from './InputBus';

const BUTTON_SIZE = 52;
const BUTTON_FILL = 0x222222;
const BUTTON_FILL_PRESSED = 0x555555;
const BUTTON_STROKE = 0x555555;
const BUTTON_TEXT = '#ffffff';

const ROW_Y = 588;

const LEFT_CX = 42;
const DOWN_CX = 102;
const RIGHT_CX = 162;
const B_CX = 258;
const A_CX = 318;

type ButtonHandle = {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

export class TouchInput {
  private readonly scene: Phaser.Scene;
  private readonly bus: InputBus;
  private readonly buttons: ButtonHandle[] = [];

  private leftPressed = false;
  private rightPressed = false;
  private downPressed = false;
  private currentDir: -1 | 0 | 1 = 0;

  constructor(scene: Phaser.Scene, bus: InputBus) {
    this.scene = scene;
    this.bus = bus;
  }

  attach(): void {
    this.makeHold('◀', LEFT_CX, (p) => this.setLeft(p));
    this.makeHold('▼', DOWN_CX, (p) => this.setDown(p));
    this.makeHold('▶', RIGHT_CX, (p) => this.setRight(p));
    this.makeTap('B', B_CX, () => this.bus.push({ type: 'Rotate', dir: 'ccw' }));
    this.makeTap('A', A_CX, () => this.bus.push({ type: 'Rotate', dir: 'cw' }));
  }

  detach(): void {
    for (const { bg, text } of this.buttons) {
      bg.destroy();
      text.destroy();
    }
    this.buttons.length = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.downPressed = false;
    this.currentDir = 0;
  }

  private makeHold(label: string, cx: number, onChange: (pressed: boolean) => void): void {
    const h = this.createButton(label, cx, ROW_Y);
    h.bg.on('pointerdown', () => {
      h.bg.setFillStyle(BUTTON_FILL_PRESSED);
      onChange(true);
    });
    const release = (): void => {
      h.bg.setFillStyle(BUTTON_FILL);
      onChange(false);
    };
    h.bg.on('pointerup', release);
    h.bg.on('pointerupoutside', release);
    h.bg.on('pointerout', release);
  }

  private makeTap(label: string, cx: number, onTap: () => void): void {
    const h = this.createButton(label, cx, ROW_Y);
    h.bg.on('pointerdown', () => {
      h.bg.setFillStyle(BUTTON_FILL_PRESSED);
      onTap();
    });
    const release = (): void => {
      h.bg.setFillStyle(BUTTON_FILL);
    };
    h.bg.on('pointerup', release);
    h.bg.on('pointerupoutside', release);
    h.bg.on('pointerout', release);
  }

  private createButton(label: string, cx: number, cy: number): ButtonHandle {
    const bg = this.scene.add
      .rectangle(cx, cy, BUTTON_SIZE, BUTTON_SIZE, BUTTON_FILL)
      .setStrokeStyle(1, BUTTON_STROKE)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(cx, cy, label, {
        color: BUTTON_TEXT,
        fontFamily: 'monospace',
        fontSize: '22px',
      })
      .setOrigin(0.5);
    const h: ButtonHandle = { bg, text };
    this.buttons.push(h);
    return h;
  }

  private setLeft(pressed: boolean): void {
    if (this.leftPressed === pressed) return;
    this.leftPressed = pressed;
    if (pressed) this.bus.push({ type: 'Move', dir: -1 });
    this.updateDir();
  }

  private setRight(pressed: boolean): void {
    if (this.rightPressed === pressed) return;
    this.rightPressed = pressed;
    if (pressed) this.bus.push({ type: 'Move', dir: 1 });
    this.updateDir();
  }

  private setDown(pressed: boolean): void {
    if (this.downPressed === pressed) return;
    this.downPressed = pressed;
    this.bus.push({ type: 'SoftDrop', held: pressed });
  }

  private updateDir(): void {
    let dir: -1 | 0 | 1 = 0;
    if (this.rightPressed && !this.leftPressed) dir = 1;
    else if (this.leftPressed && !this.rightPressed) dir = -1;
    if (dir !== this.currentDir) {
      this.currentDir = dir;
      this.bus.push({ type: 'SetHold', dir });
    }
  }
}
