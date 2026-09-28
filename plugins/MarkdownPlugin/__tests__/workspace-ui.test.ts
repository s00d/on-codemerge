import { describe, expect, it, afterEach } from 'vitest';
import {
  Editor as MdEditor,
  MarkdownPlugin,
  createDefaultPlugins,
  emptyEditorDoc,
  runInsertMarkdown,
} from 'on-codemerge/markdown';

describe('MarkdownPlugin workspace UI', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      const ed = Reflect.get(host, '__editor');
      if (ed && typeof ed.destroy === 'function') {
        ed.destroy();
      }
      host.remove();
    }
    hosts.length = 0;
  });

  function mountEditor(text = '# hello\n') {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new MdEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(text),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    return { host, editor };
  }

  it('keeps CM mounted across selectionChanged', () => {
    const { editor } = mountEditor();
    const cm = editor.contentElement()?.querySelector('.cm-editor');
    expect(cm).toBeTruthy();
    editor.setSelection(editor.getState().selection);
    expect(editor.contentElement()?.querySelector('.cm-editor')).toBe(cm);
  });

  it('renders history + marks + insert/turn-into chrome on workspace', () => {
    const { editor } = mountEditor();
    const ids = [...editor.host.querySelectorAll('[data-id]')].map((el) =>
      el.getAttribute('data-id')
    );
    expect(ids).toContain('undo');
    expect(ids).toContain('redo');
    expect(ids).toContain('md-bold');
    expect(ids).toContain('md-italic');
    expect(ids).toContain('md-strike');
    expect(ids).toContain('md-code');
    expect(ids).toContain('md-link');
    expect(ids).toContain('menu-md-insert');
    expect(ids).toContain('menu-md-turninto');
    // Menu items live in the portal until the trigger is opened.
    const insertTrigger = editor.host.querySelector('[data-menu="md-insert"]');
    expect(insertTrigger).toBeInstanceOf(HTMLElement);
    (insertTrigger as HTMLElement).click();
    expect(
      document.querySelector('[data-ocm-toolbar-menu="md-insert"] [data-id="md-insert-h1"]')
    ).toBeTruthy();
    expect(
      document.querySelector('[data-ocm-toolbar-menu="md-insert"] [data-id="md-insert-ordered"]')
    ).toBeTruthy();
  });

  it('toolbar config is sole source of bar buttons (no preset merge)', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new MdEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc('# hi\n'),
      plugins: [
        MarkdownPlugin({
          surface: 'workspace',
          toolbar: {
            menus: [
              { id: 'md-insert', label: 'Insert', order: 10 },
              { id: 'md-tools', label: 'Tools', order: 20 },
            ],
            items: [
              {
                id: 'md-custom-stamp',
                label: 'Stamp',
                menu: 'md-insert',
                run: runInsertMarkdown('<!-- stamped -->\n'),
              },
              {
                id: 'md-custom-mermaid',
                label: 'Mermaid',
                menu: 'md-tools',
                command: 'insertMdMermaid',
              },
            ],
          },
        }),
      ],
    });
    Reflect.set(host, '__editor', editor);

    const barIds = [...editor.host.querySelectorAll('[data-id]')].map((el) =>
      el.getAttribute('data-id')
    );
    expect(barIds).toContain('menu-md-tools');
    expect(barIds).toContain('menu-md-insert');
    expect(barIds).not.toContain('undo');

    const insertTrigger = editor.host.querySelector('[data-menu="md-insert"]');
    expect(insertTrigger).toBeInstanceOf(HTMLElement);
    (insertTrigger as HTMLElement).click();
    const insertMenu = document.querySelector('[data-ocm-toolbar-menu="md-insert"]');
    expect(insertMenu?.querySelector('[data-id="md-insert-h1"]')).toBeNull();
    expect(insertMenu?.querySelector('[data-id="md-custom-stamp"]')).toBeTruthy();
    expect(insertMenu?.querySelector('[data-id="md-insert-info"]')).toBeNull();

    const toolsTrigger = editor.host.querySelector('[data-menu="md-tools"]');
    expect(toolsTrigger).toBeInstanceOf(HTMLElement);
    (toolsTrigger as HTMLElement).click();
    expect(
      document.querySelector('[data-ocm-toolbar-menu="md-tools"] [data-id="md-custom-mermaid"]')
    ).toBeTruthy();

    expect(editor.command('insertMdMermaid')).toBe(true);
    expect(editor.getText()).toContain('```mermaid');
  });

  it('toolbar insert mermaid mutates prose SoT', () => {
    const { editor } = mountEditor('# hi\n');
    expect(editor.command('insertMdMermaid')).toBe(true);
    const types = (editor.getState().doc.content ?? []).map((n) => n.type);
    expect(types).toContain('mermaid');
    expect(editor.getText()).toContain('```mermaid');
  });

  it('toolbar Insert retargets current CM line (not append at end)', async () => {
    const { editor } = mountEditor('hello world\n');
    const insertTrigger = editor.host.querySelector('[data-menu="md-insert"]');
    expect(insertTrigger).toBeInstanceOf(HTMLElement);
    (insertTrigger as HTMLElement).click();
    const h1 = document.querySelector(
      '[data-ocm-toolbar-menu="md-insert"] [data-id="md-insert-h1"]'
    ) as HTMLButtonElement | null;
    expect(h1).toBeTruthy();
    h1!.click();
    const cm = editor.contentElement()?.querySelector('.cm-content');
    expect(cm?.textContent ?? '').toMatch(/# hello world/);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(editor.getText()).toMatch(/^# hello world/m);
    expect(editor.getText()).not.toContain('Heading');
  });

  it('turnCalloutWarn mutates first callout variant in SoT', () => {
    const { editor } = mountEditor(':::info Tip\nHi\n:::\n');
    expect(editor.getState().doc.content?.[0]?.attrs?.variant).toBe('info');
    expect(editor.command('turnCalloutWarn')).toBe(true);
    expect(editor.getState().doc.content?.[0]?.attrs?.variant).toBe('warn');
    expect(editor.getText()).toContain(':::warn');
  });

  it('setText updates preview host content', async () => {
    const { editor } = mountEditor('');
    expect(editor.setText('## Title\n')).toBeNull();
    // docChanged → surface.update → projectPreviewHtml(state.doc)
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });
    const preview = editor.contentElement()?.querySelector('.ocm-md-pane--preview');
    expect(preview?.textContent ?? '').toMatch(/Title/);
  });

  it('setText from empty seeds CodeMirror source pane (not only preview)', () => {
    const { editor } = mountEditor('');
    expect(editor.contentElement()?.querySelector('.cm-content')?.textContent ?? '').toBe('');
    expect(editor.setText('# hello from setText\n')).toBeNull();
    const cm = editor.contentElement()?.querySelector('.cm-content');
    expect(cm?.textContent ?? '').toContain('hello from setText');
    expect(editor.getText()).toContain('hello from setText');
  });

  it('preview hydrates mermaid host to SVG', async () => {
    const { editor } = mountEditor('');
    expect(editor.setText('```mermaid\nflowchart LR\n  A-->B\n```\n')).toBeNull();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 400);
    });
    const preview = editor.contentElement()?.querySelector('.ocm-md-pane--preview');
    expect(preview?.querySelector('[data-node="mermaid"]')).toBeTruthy();
    // Host or hydrated SVG — either marks the projector/hydrate path.
    const ready =
      preview?.querySelector('[data-ocm-mermaid-ready="1"]') ??
      preview?.querySelector('svg[data-node="mermaid"]') ??
      preview?.querySelector('.ocm-md-mermaid');
    expect(ready).toBeTruthy();
  });

  it('syncs preview scroll proportionally with CM scroller', () => {
    const long = `# long\n\n${'paragraph\n\n'.repeat(80)}`;
    const { editor } = mountEditor(long);
    const root = editor.contentElement();
    const preview = root?.querySelector('.ocm-md-pane--preview');
    const scroller = root?.querySelector('.cm-scroller');
    expect(preview).toBeInstanceOf(HTMLElement);
    expect(scroller).toBeInstanceOf(HTMLElement);
    if (!(preview instanceof HTMLElement) || !(scroller instanceof HTMLElement)) {
      return;
    }
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 400 });
    Object.defineProperty(preview, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(preview, 'clientHeight', { configurable: true, value: 400 });
    scroller.scrollTop = 800; // 50% of (2000-400)
    scroller.dispatchEvent(new Event('scroll'));
    expect(preview.scrollTop).toBe(300); // 50% of (1000-400)
  });
});
