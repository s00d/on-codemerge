import type { Hook } from "../types";

export class EventManager {
  private listeners: { [event: string]: Hook[] } = {};

  subscribe(event: string, callback: Hook): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  publish(event: string, data?: string|any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  destroy(): void {
    for (const i in this.listeners) {
      delete this.listeners[i];
    }
  }
}

export default EventManager
