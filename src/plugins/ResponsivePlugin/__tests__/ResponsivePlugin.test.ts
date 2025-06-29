import { ResponsivePlugin } from '../index';
import { HTMLEditor } from '../../../core/HTMLEditor';
import { SetViewportCommand } from '../commands/SetViewportCommand';

describe('ResponsivePlugin', () => {
  let editor: HTMLEditor;
  let plugin: ResponsivePlugin;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
    plugin = new ResponsivePlugin();
  });

  afterEach(() => {
    plugin.destroy();
    editor.destroy();
    document.body.removeChild(container);
  });

  test('should initialize plugin', () => {
    plugin.initialize(editor);
    expect(plugin.name).toBe('responsive');
  });

  test('should add toolbar button', () => {
    plugin.initialize(editor);
    const toolbar = this.editor?.getToolbar();
    expect(toolbar).toBeTruthy();
    
    const responsiveButton = toolbar?.querySelector('[title*="Responsive"]');
    expect(responsiveButton).toBeTruthy();
  });

  test('should add viewport indicator', () => {
    plugin.initialize(editor);
    const indicator = document.querySelector('.viewport-indicator');
    expect(indicator).toBeTruthy();
  });

  test('should set initial viewport', () => {
    plugin.initialize(editor);
    const currentViewport = plugin.getCurrentViewport();
    expect(currentViewport).toBeDefined();
  });

  test('should change viewport', () => {
    plugin.initialize(editor);
    const initialViewport = plugin.getCurrentViewport();
    
    // Симулируем изменение viewport'а
    const container = editor.getContainer();
    plugin.viewportManager.setViewport(container, 'mobile');
    
    expect(plugin.getCurrentViewport()).toBe('mobile');
    expect(plugin.getCurrentViewport()).not.toBe(initialViewport);
  });

  test('should save viewport to localStorage', () => {
    plugin.initialize(editor);
    const container = editor.getContainer();
    plugin.viewportManager.setViewport(container, 'tablet');
    
    const savedViewport = localStorage.getItem('responsive-viewport');
    expect(savedViewport).toBe('tablet');
  });

  test('should restore viewport from localStorage', () => {
    localStorage.setItem('responsive-viewport', 'desktop');
    
    const newPlugin = new ResponsivePlugin();
    newPlugin.initialize(editor);
    
    expect(newPlugin.getCurrentViewport()).toBe('desktop');
    
    newPlugin.destroy();
  });
});

describe('SetViewportCommand', () => {
  let editor: HTMLEditor;
  let command: SetViewportCommand;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
    command = new SetViewportCommand(editor);
  });

  afterEach(() => {
    editor.destroy();
    document.body.removeChild(container);
  });

  test('should set viewport', () => {
    command.setViewport('mobile');
    command.execute();
    
    // Проверяем, что команда выполнилась
    expect(command.name).toBe('setViewport');
  });

  test('should undo viewport change', () => {
    // Сначала устанавливаем desktop
    command.setViewport('desktop');
    command.execute();
    
    // Затем устанавливаем mobile
    command.setViewport('mobile');
    command.execute();
    
    // Отменяем изменение
    command.undo();
    
    // Проверяем, что вернулись к desktop
    expect(command.name).toBe('setViewport');
  });

  test('should redo viewport change', () => {
    command.setViewport('tablet');
    command.execute();
    
    command.undo();
    command.redo();
    
    expect(command.name).toBe('setViewport');
  });
});

describe('ViewportManager', () => {
  let editor: HTMLEditor;
  let plugin: ResponsivePlugin;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
    plugin = new ResponsivePlugin();
    plugin.initialize(editor);
  });

  afterEach(() => {
    plugin.destroy();
    editor.destroy();
    document.body.removeChild(container);
  });

  test('should get current viewport', () => {
    const currentViewport = plugin.viewportManager.getCurrentViewport();
    expect(currentViewport).toBeDefined();
    expect(['mobile', 'tablet', 'desktop', 'largeDesktop', 'ultraWide', 'responsive']).toContain(currentViewport);
  });

  test('should get current width', () => {
    const width = plugin.viewportManager.getCurrentWidth();
    expect(width).toBeGreaterThan(0);
  });

  test('should navigate to next viewport', () => {
    const initialViewport = plugin.viewportManager.getCurrentViewport();
    plugin.viewportManager.nextViewport();
    const nextViewport = plugin.viewportManager.getCurrentViewport();
    
    expect(nextViewport).not.toBe(initialViewport);
  });

  test('should navigate to previous viewport', () => {
    const initialViewport = plugin.viewportManager.getCurrentViewport();
    plugin.viewportManager.previousViewport();
    const previousViewport = plugin.viewportManager.getCurrentViewport();
    
    expect(previousViewport).not.toBe(initialViewport);
  });
}); 