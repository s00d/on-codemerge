import type { HTMLEditor } from './HTMLEditor.ts';
import { ShortcutCategories } from './types.ts';

interface Hotkey {
  icon: string
  keys: string
  description: string
  command: string
}

export interface Plugin {
  name: string;
  hotkeys?: Hotkey[];
  initialize: (editor: HTMLEditor) => void;
  destroy?: () => void; // Опциональный метод для очистки ресурсов плагина
}

// { keys: 'Ctrl+B', description: 'Bold text', command: 'bold', icon: '𝐁' },

export interface PluginManager {
  register: (plugin: Plugin) => void;
  unregister: (pluginName: string) => void;
  getPlugin: (pluginName: string) => Plugin | undefined;
  getPlugins: () => Map<string, Plugin>;
  getHotkeys: () => ShortcutCategories;
  destroy: () => void; // Метод для уничтожения всех плагинов
}

export class DefaultPluginManager implements PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  /**
   * Регистрирует новый плагин
   * @param plugin Плагин для регистрации
   * @throws Ошибка, если плагин с таким именем уже зарегистрирован
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Удаляет плагин по его имени
   * @param pluginName Имя плагина для удаления
   */
  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin?.destroy) {
      plugin.destroy(); // Вызываем метод destroy, если он существует
    }
    this.plugins.delete(pluginName);
  }

  /**
   * Возвращает плагины
   */
  getPlugins(): Map<string, Plugin> {
    return this.plugins
  }

  getHotkeys(): ShortcutCategories {
    const hotkeysList: ShortcutCategories = {};
    const registeredKeys: { [key: string]: string } = {}; // To track registered hotkeys

    this.plugins.forEach((plugin, name) => {
      const categoryName = name.charAt(0).toUpperCase() + name.slice(1) + ' Plugin';
      const hotkeys = plugin.hotkeys ?? [];
      for (const j in hotkeys) {
        const select = hotkeys[j];
        const keys = select.keys;

        // Check for hotkey conflict
        if (registeredKeys[keys]) {
          console.warn(`Hotkey conflict: The key combination "${keys}" is already used for the command "${registeredKeys[keys]}".`);
        } else {
          registeredKeys[keys] = select.command; // Register the hotkey
        }

        // Add the hotkey to the category
        if (!hotkeysList[categoryName]) {
          hotkeysList[categoryName] = [];
        }

        hotkeysList[categoryName].push({
          command: select.command,
          description: select.description,
          icon: select.icon,
          keys: select.keys,
        });
      }
    });

    return hotkeysList;
  }
  /**
   * Возвращает плагин по его имени
   * @param pluginName Имя плагина
   * @returns Плагин или undefined, если плагин не найден
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Уничтожает все зарегистрированные плагины
   */
  destroy(): void {
    for (const [_pluginName, plugin] of this.plugins) {
      if (plugin.destroy) {
        plugin.destroy(); // Вызываем метод destroy для каждого плагина
      }
    }
    this.plugins.clear(); // Очищаем хранилище плагинов
  }
}
