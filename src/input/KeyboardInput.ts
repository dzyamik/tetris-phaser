import type * as Phaser from 'phaser';
import type { InputBus } from './InputBus';

type Listener = (event: KeyboardEvent) => void;

type Binding = { key: string; handler: Listener };

export class KeyboardInput {
  private readonly scene: Phaser.Scene;
  private readonly bus: InputBus;
  private bindings: Binding[] = [];
  private heldDir: -1 | 0 | 1 = 0;

  constructor(scene: Phaser.Scene, bus: InputBus) {
    this.scene = scene;
    this.bus = bus;
  }

  attach(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    const bind = (key: string, handler: Listener): void => {
      kb.on(key, handler);
      this.bindings.push({ key, handler });
    };

    bind('keydown-LEFT', (e) => {
      if (e.repeat) return;
      this.heldDir = -1;
      this.bus.push({ type: 'Move', dir: -1 });
      this.bus.push({ type: 'SetHold', dir: -1 });
    });
    bind('keyup-LEFT', () => {
      if (this.heldDir === -1) {
        this.heldDir = 0;
        this.bus.push({ type: 'SetHold', dir: 0 });
      }
    });

    bind('keydown-RIGHT', (e) => {
      if (e.repeat) return;
      this.heldDir = 1;
      this.bus.push({ type: 'Move', dir: 1 });
      this.bus.push({ type: 'SetHold', dir: 1 });
    });
    bind('keyup-RIGHT', () => {
      if (this.heldDir === 1) {
        this.heldDir = 0;
        this.bus.push({ type: 'SetHold', dir: 0 });
      }
    });

    bind('keydown-DOWN', (e) => {
      if (e.repeat) return;
      this.bus.push({ type: 'SoftDrop', held: true });
    });
    bind('keyup-DOWN', () => {
      this.bus.push({ type: 'SoftDrop', held: false });
    });

    bind('keydown-X', (e) => {
      if (e.repeat) return;
      this.bus.push({ type: 'Rotate', dir: 'cw' });
    });
    bind('keydown-Z', (e) => {
      if (e.repeat) return;
      this.bus.push({ type: 'Rotate', dir: 'ccw' });
    });
  }

  detach(): void {
    const kb = this.scene.input.keyboard;
    if (kb) {
      for (const { key, handler } of this.bindings) {
        kb.off(key, handler);
      }
    }
    this.bindings = [];
    this.heldDir = 0;
  }
}
