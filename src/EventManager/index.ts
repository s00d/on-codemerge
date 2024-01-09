import type { Hook } from "@/types";

export class EventManager {
  private listeners: { [event: string]: Hook[] } = {};

  subscribe(event: string, callback: Hook): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  publish(event: string, data?: string): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Другие методы для управления событиями
}

export default EventManager
