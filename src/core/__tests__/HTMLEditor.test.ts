import { HTMLEditor } from '../HTMLEditor';

describe('HTMLEditor', () => {
  let editor: HTMLEditor;
  let container: HTMLElement;

  beforeEach(() => {
    // Создаем контейнер для редактора
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
  });

  afterEach(() => {
    // Очищаем контейнер после каждого теста
    document.body.removeChild(container);
  });

  it('should initialize with an empty container', () => {
    expect(editor.getContainer().innerHTML).toMatchSnapshot();
  });

  it('should set and get HTML content', () => {
    const html = '<p>Hello, world!</p>';
    editor.setHtml(html);
    expect(editor.getHtml()).toMatchSnapshot();
  });

  it('should insert text at the cursor', () => {
    const text = 'Hello, world!';
    editor.ensureEditorFocus();
    editor.getContainer().focus(); // Фокусируем редактор
    editor.insertTextAtCursor(text);
    expect(editor.getContainer().textContent).toMatchSnapshot();
  });

  it('should trigger custom events', () => {
    const eventName = 'custom-event';
    const mockCallback = jest.fn();
    editor.on(eventName, mockCallback);

    editor.triggerEvent(eventName, 'arg1', 'arg2');
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should register and initialize plugins', () => {
    const mockPlugin = {
      name: 'mock-plugin',
      initialize: jest.fn(),
    };

    editor.use(mockPlugin);
    expect(mockPlugin.initialize).toHaveBeenCalledWith(editor);
  });

  it('should translate text using LocaleManager', () => {
    const key = 'New Block';
    const translation = editor.t(key);
    expect(translation).toMatchSnapshot();
  });

  it('should set a new locale', async () => {
    await editor.setLocale('ru');
    expect(editor.t('New Block')).toMatchSnapshot();
  });

  it('should ensure editor focus', () => {
    editor.ensureEditorFocus();
    expect(document.activeElement).toMatchSnapshot();
  });
});
