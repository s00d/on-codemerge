import type { HTMLEditor } from './HTMLEditor.ts';

export interface Plugin {
  name: string;
  initialize: (editor: HTMLEditor) => void;
  destroy?: () => void; // Опциональный метод для очистки ресурсов плагина
}

export interface PluginManager {
  register: (plugin: Plugin) => void;
  unregister: (pluginName: string) => void;
  getPlugin: (pluginName: string) => Plugin | undefined;
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
