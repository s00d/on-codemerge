import { HTMLEditor } from '../HTMLEditor';
import { HistoryPlugin } from '../../plugins/HistoryPlugin';

describe('TextFormatterHistory', () => {
  let container: HTMLElement;
  let editor: HTMLEditor;

  const flushMutations = async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
    editor.use(new HistoryPlugin());
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const selectByText = (text: string, root?: Element) => {
    const parent = root ?? editor.getContainer();
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const idx = node.textContent?.indexOf(text);
      if (idx !== -1 && idx !== undefined) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + text.length);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        return;
      }
    }
    throw new Error(`Text "${text}" not found`);
  };

  const triggerUndo = async () => {
    editor.triggerEvent('undo');
    await flushMutations();
  };

  const triggerRedo = async () => {
    editor.triggerEvent('redo');
    await flushMutations();
  };

  it('undo restores HTML after bold on line 2 word', async () => {
    await editor.setHtml('Line one<div>Line two</div>');
    await flushMutations();

    editor.ensureEditorFocus();
    selectByText('two', editor.getContainer().querySelector('div')!);
    editor.getTextFormatter()?.toggleStyle('bold');
    await flushMutations();

    expect(editor.getHtml()).toContain('format-bold');

    await triggerUndo();
    expect(editor.getHtml()).not.toContain('format-bold');
    expect(editor.getContainer().textContent).toContain('Line two');
  });

  it('undo twice after bold on both lines', async () => {
    await editor.setHtml('<div>Line one</div><div>Line two</div>');
    await flushMutations();

    editor.ensureEditorFocus();
    selectByText('one', editor.getContainer().querySelector('div:first-child')!);
    editor.getTextFormatter()?.toggleStyle('bold');
    await flushMutations();

    selectByText('two', editor.getContainer().querySelector('div:last-child')!);
    editor.getTextFormatter()?.toggleStyle('bold');
    await flushMutations();

    expect(editor.getHtml()).toContain('format-bold');

    await triggerUndo();
    expect(editor.getHtml().match(/format-bold/g)?.length).toBe(1);

    await triggerUndo();
    expect(editor.getHtml()).not.toContain('format-bold');
  });

  it('redo after undo restores bold', async () => {
    await editor.setHtml('Line one<div>Line two</div>');
    await flushMutations();

    editor.ensureEditorFocus();
    selectByText('two', editor.getContainer().querySelector('div')!);
    editor.getTextFormatter()?.toggleStyle('bold');
    await flushMutations();

    await triggerUndo();
    expect(editor.getHtml()).not.toContain('format-bold');

    await triggerRedo();
    expect(editor.getHtml()).toContain('format-bold');
    expect(editor.getContainer().textContent).toContain('two');
  });

  it('hasClass false after undo removes bold', async () => {
    await editor.setHtml('Line one<div>Line two</div>');
    await flushMutations();

    editor.ensureEditorFocus();
    selectByText('two', editor.getContainer().querySelector('div')!);
    editor.getTextFormatter()?.toggleStyle('bold');
    await flushMutations();

    await triggerUndo();
    selectByText('two', editor.getContainer().querySelector('div')!);
    expect(editor.getTextFormatter()?.hasClass('bold')).toBe(false);
  });

  it('save and restore cursor position', async () => {
    await editor.setHtml('<div>Line two</div>');
    await flushMutations();

    editor.ensureEditorFocus();
    selectByText('two', editor.getContainer().querySelector('div')!);
    const pos = editor.saveCursorPosition();

    editor.restoreCursorPosition(pos!);
    const sel = window.getSelection();
    expect(sel?.rangeCount).toBeGreaterThan(0);
    expect(sel?.anchorNode?.textContent).toContain('two');
  });
});
