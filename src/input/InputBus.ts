import type { Action } from '@/core/actions';

export class InputBus {
  private queue: Action[] = [];

  push(action: Action): void {
    this.queue.push(action);
  }

  drain(): Action[] {
    const drained = this.queue;
    this.queue = [];
    return drained;
  }

  clear(): void {
    this.queue = [];
  }
}
