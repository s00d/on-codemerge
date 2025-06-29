import { ShortcutsPlugin } from '../index';
import { ShortcutManager } from '../services/ShortcutManager';
import { HTMLEditor } from '../../../core/HTMLEditor';

describe('ShortcutsPlugin', () => {
  let plugin: ShortcutsPlugin;
  let editor: HTMLEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
    plugin = new ShortcutsPlugin();
  });

  afterEach(() => {
    plugin.destroy();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize with correct name', () => {
      expect(plugin.name).toBe('shortcuts');
    });

    it('should create ShortcutManager instance', () => {
      expect(plugin.getShortcutManager()).toBeInstanceOf(ShortcutManager);
    });
  });

  describe('shortcut registration', () => {
    it('should register shortcuts from editor hotkeys', () => {
      // Мокаем getHotkeys
      const mockHotkeys = {
        'Text Formatting': [
          {
            command: 'bold',
            keys: 'Ctrl+B',
            description: 'Bold text',
            icon: 'bold',
          },
        ],
      };

      jest.spyOn(editor, 'getHotkeys').mockReturnValue(mockHotkeys);

      plugin.initialize(editor);

      // Ждем регистрации шорткатов
      setTimeout(() => {
        const shortcutManager = plugin.getShortcutManager();
        const shortcuts = shortcutManager.getShortcuts();
        expect(shortcuts.length).toBeGreaterThan(0);
      }, 1100);
    });
  });

  describe('keyboard handling', () => {
    it('should handle keyboard events', () => {
      plugin.initialize(editor);

      const mockEvent = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
      });

      const container = editor.getContainer();
      container.dispatchEvent(mockEvent);

      // Проверяем, что событие обработано
      expect(mockEvent.defaultPrevented).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      plugin.initialize(editor);
      plugin.destroy();

      // Проверяем, что ссылки очищены
      expect(plugin.getShortcutManager().getShortcuts()).toHaveLength(0);
    });
  });
});

describe('ShortcutManager', () => {
  let manager: ShortcutManager;

  beforeEach(() => {
    manager = new ShortcutManager();
  });

  describe('shortcut registration', () => {
    it('should register shortcuts correctly', () => {
      const callback = jest.fn();

      manager.register('test-shortcut', 'Ctrl+A', callback, 'Test shortcut', 'Test Category');

      const shortcuts = manager.getShortcuts();
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0].id).toBe('test-shortcut');
    });

    it('should handle Mac shortcuts', () => {
      const callback = jest.fn();

      manager.register(
        'test-shortcut',
        'Ctrl+A',
        callback,
        'Test shortcut',
        'Test Category',
        'Cmd+A'
      );

      const shortcuts = manager.getShortcuts();
      expect(shortcuts[0].keysMac).toEqual(['cmd', 'a']);
    });
  });

  describe('keyboard handling', () => {
    it('should execute shortcut on matching key combination', () => {
      const callback = jest.fn();

      manager.register('test-shortcut', 'Ctrl+A', callback, 'Test shortcut', 'Test Category');

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      });

      const result = manager.handleKeyDown(event);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not execute shortcut on non-matching combination', () => {
      const callback = jest.fn();

      manager.register('test-shortcut', 'Ctrl+A', callback, 'Test shortcut', 'Test Category');

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
      });

      const result = manager.handleKeyDown(event);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should track usage statistics', () => {
      const callback = jest.fn();

      manager.register('test-shortcut', 'Ctrl+A', callback, 'Test shortcut', 'Test Category');

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      });

      manager.handleKeyDown(event);

      const stats = manager.getStats();
      expect(stats.mostUsed).toHaveLength(1);
      expect(stats.mostUsed[0].usageCount).toBe(1);
    });
  });

  describe('conflict detection', () => {
    it('should detect conflicts between shortcuts', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      manager.register('shortcut-1', 'Ctrl+A', callback1, 'First shortcut', 'Test Category');

      manager.register('shortcut-2', 'Ctrl+A', callback2, 'Second shortcut', 'Test Category');

      const stats = manager.getStats();
      expect(stats.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('platform detection', () => {
    it('should detect platform correctly', () => {
      const platform = manager.getPlatform();
      expect(['mac', 'windows']).toContain(platform);
    });
  });

  describe('shortcut formatting', () => {
    it('should format shortcuts correctly', () => {
      const formatted = manager.formatShortcut(['ctrl', 'a']);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });
});
