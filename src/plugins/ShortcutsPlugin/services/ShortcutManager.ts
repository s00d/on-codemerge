interface Shortcut {
  id: string;
  keys: string[];
  keysMac?: string[];
  callback: () => void;
  description: string;
  category: string;
  usageCount: number;
  lastUsed: number;
}

interface ShortcutStats {
  totalShortcuts: number;
  mostUsed: Shortcut[];
  recentlyUsed: Shortcut[];
  conflicts: string[];
}

export class ShortcutManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private isMac: boolean;
  private stats: ShortcutStats = {
    totalShortcuts: 0,
    mostUsed: [],
    recentlyUsed: [],
    conflicts: []
  };

  constructor() {
    this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }

  public register(
    id: string,
    keys: string,
    callback: () => void,
    description: string,
    category: string,
    keysMac?: string
  ): void {
    const shortcut: Shortcut = {
      id,
      keys: keys.split('+').map(key => key.trim().toLowerCase()),
      keysMac: keysMac ? keysMac.split('+').map(key => key.trim().toLowerCase()) : undefined,
      callback,
      description,
      category,
      usageCount: 0,
      lastUsed: 0
    };

    // Проверяем конфликты
    const conflicts = this.checkConflicts(shortcut);
    if (conflicts.length > 0) {
      console.warn(`Shortcut conflicts for ${id}:`, conflicts);
      this.stats.conflicts.push(...conflicts);
    }

    this.shortcuts.set(id, shortcut);
    this.stats.totalShortcuts = this.shortcuts.size;
    this.updateStats();
  }

  public handleKeyDown(event: KeyboardEvent): boolean {
    const pressedKeys: string[] = [];

    // Определяем модификаторы
    if (this.isMac ? event.metaKey : event.ctrlKey) pressedKeys.push('ctrl');
    if (event.shiftKey) pressedKeys.push('shift');
    if (event.altKey) pressedKeys.push('alt');

    // Добавляем основную клавишу
    const key = this.normalizeKey(event.key);
    if (key && !['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      pressedKeys.push(key);
    }

    // Ищем подходящий шорткат
    for (const shortcut of this.shortcuts.values()) {
      const shortcutKeys = this.isMac && shortcut.keysMac ? shortcut.keysMac : shortcut.keys;
      
      if (this.matchesShortcut(pressedKeys, shortcutKeys)) {
        event.preventDefault();
        this.executeShortcut(shortcut);
        return true;
      }
    }

    return false;
  }

  private executeShortcut(shortcut: Shortcut): void {
    try {
      shortcut.callback();
      shortcut.usageCount++;
      shortcut.lastUsed = Date.now();
      this.updateStats();
    } catch (error) {
      console.error(`Error executing shortcut ${shortcut.id}:`, error);
    }
  }

  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      'Enter': 'enter',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'Escape': 'escape',
      'Tab': 'tab',
      'Space': 'space',
      'ArrowUp': 'arrowup',
      'ArrowDown': 'arrowdown',
      'ArrowLeft': 'arrowleft',
      'ArrowRight': 'arrowright',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown',
      'Insert': 'insert',
      'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4',
      'F5': 'f5', 'F6': 'f6', 'F7': 'f7', 'F8': 'f8',
      'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12'
    };

    return keyMap[key] || key.toLowerCase();
  }

  private matchesShortcut(pressed: string[], defined: string[]): boolean {
    if (pressed.length !== defined.length) return false;
    
    // Сортируем массивы для корректного сравнения
    const sortedPressed = [...pressed].sort();
    const sortedDefined = [...defined].sort();
    
    return sortedDefined.every((key, index) => sortedPressed[index] === key);
  }

  private checkConflicts(newShortcut: Shortcut): string[] {
    const conflicts: string[] = [];
    const newKeys = this.isMac && newShortcut.keysMac ? newShortcut.keysMac : newShortcut.keys;

    for (const [id, shortcut] of this.shortcuts) {
      if (id === newShortcut.id) continue;
      
      const shortcutKeys = this.isMac && shortcut.keysMac ? shortcut.keysMac : shortcut.keys;
      if (this.matchesShortcut(newKeys, shortcutKeys)) {
        conflicts.push(`${id} (${shortcut.description})`);
      }
    }

    return conflicts;
  }

  private updateStats(): void {
    const shortcuts = Array.from(this.shortcuts.values());
    
    // Самые используемые
    this.stats.mostUsed = shortcuts
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // Недавно использованные
    this.stats.recentlyUsed = shortcuts
      .filter(s => s.lastUsed > 0)
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 5);
  }

  public getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  public getShortcutsByCategory(): Record<string, Shortcut[]> {
    const categories: Record<string, Shortcut[]> = {};
    
    for (const shortcut of this.shortcuts.values()) {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    }

    return categories;
  }

  public getStats(): ShortcutStats {
    return { ...this.stats };
  }

  public getPlatform(): string {
    return this.isMac ? 'mac' : 'windows';
  }

  public formatShortcut(keys: string[]): string {
    const keyMap: Record<string, string> = {
      'ctrl': this.isMac ? '⌘' : 'Ctrl',
      'shift': '⇧',
      'alt': this.isMac ? '⌥' : 'Alt',
      'enter': '↵',
      'backspace': '⌫',
      'delete': '⌦',
      'escape': '⎋',
      'tab': '⇥',
      'space': '␣',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'home': '⇱',
      'end': '⇲',
      'pageup': '⇞',
      'pagedown': '⇟'
    };

    return keys.map(key => keyMap[key] || key.toUpperCase()).join(' ');
  }

  public unregister(id: string): boolean {
    return this.shortcuts.delete(id);
  }

  public clear(): void {
    this.shortcuts.clear();
    this.stats = {
      totalShortcuts: 0,
      mostUsed: [],
      recentlyUsed: [],
      conflicts: []
    };
  }
} 