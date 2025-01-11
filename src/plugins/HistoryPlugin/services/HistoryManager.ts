import type { HistoryState } from '../types';

export class HistoryManager {
  private states: HistoryState[] = [{ content: '', timestamp: 0 }];
  private currentIndex: number = 0;
  private maxStates: number = 100;

  constructor() {
    this.clear();
  }

  public addState(content: string): void {
    // Don't add if content hasn't changed
    if (this.getCurrentState()?.content === content) {
      return;
    }

    // Remove any future states if we're not at the end
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.states.push({
      content,
      timestamp: Date.now(),
    });
    this.currentIndex++;

    // Remove oldest states if we exceed maxStates
    if (this.states.length > this.maxStates) {
      this.states = this.states.slice(-this.maxStates);
      this.currentIndex = this.states.length - 1;
    }
  }

  public undo(): string | null {
    if (this.currentIndex <= 0) return null;

    this.currentIndex--;
    const state = this.getCurrentState();
    if (state === null) {
      return null;
    }
    return state.content;
  }

  public redo(): string | null {
    if (this.currentIndex >= this.states.length - 1) return null;

    this.currentIndex++;
    const state = this.getCurrentState();
    if (state === null) {
      return null;
    }
    return state.content;
  }

  public getCurrentState(): HistoryState | null {
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

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }
}
