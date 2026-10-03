import type { HistoryState } from '../types';

/** Snapshot stack for HistoryViewer (markdown checkpoints). Undo/redo live in kernel. */
export class HistoryManager {
  private states: HistoryState[] = [{ content: '', timestamp: 0 }];
  private currentIndex = 0;
  private readonly maxStates: number = 100;

  constructor() {
    this.clear();
  }

  public addState(content: string): void {
    if (this.getCurrentState()?.content === content) {
      return;
    }

    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    this.states.push({
      content,
      timestamp: Date.now(),
    });
    this.currentIndex++;

    if (this.states.length > this.maxStates) {
      this.states = this.states.slice(-this.maxStates);
      this.currentIndex = this.states.length - 1;
    }
  }

  public getCurrentState(): HistoryState | null {
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    return this.states[this.currentIndex] || null;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public clear(): void {
    this.states = [
      {
        content: '',
        timestamp: Date.now(),
      },
    ];
    this.currentIndex = 0;
  }

  public getStates(): HistoryState[] {
    return this.states;
  }
}
