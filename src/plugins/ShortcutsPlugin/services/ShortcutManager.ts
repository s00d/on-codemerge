interface Shortcut {
  keys: string[];
  callback: () => void;
}

export class ShortcutManager {
  private shortcuts: Shortcut[] = [];

  public register(shortcut: string, callback: () => void): void {
    const keys = shortcut.split('+').map((key) => key.trim().toLowerCase());
    this.shortcuts.push({ keys, callback });
  }

  public handleKeyDown(event: KeyboardEvent): void {
    const pressedKeys: string[] = [];

    if (event.ctrlKey) pressedKeys.push('ctrl');
    if (event.shiftKey) pressedKeys.push('shift');
    if (event.altKey) pressedKeys.push('alt');
    if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt') {
      pressedKeys.push(event.key.toLowerCase());
    }

    for (const shortcut of this.shortcuts) {
      if (this.matchesShortcut(pressedKeys, shortcut.keys)) {
        event.preventDefault();
        shortcut.callback();
        break;
      }
    }
  }

  private matchesShortcut(pressed: string[], defined: string[]): boolean {
    if (pressed.length !== defined.length) return false;
    return defined.every((key) => pressed.includes(key));
  }
}
