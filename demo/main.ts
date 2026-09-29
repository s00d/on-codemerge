import {
  createDefaultPlugins as createWysiwygPlugins,
  Editor as WysiwygEditor,
  insertText,
  toggleMark,
} from 'on-codemerge';
import { createDefaultPlugins as createJsonPlugins, Editor as JsonEditor } from 'on-codemerge/json';
import {
  createDefaultPlugins as createMdPlugins,
  Editor as MarkdownEditor,
} from 'on-codemerge/markdown';
import {
  createDefaultPlugins as createCodePlugins,
  Editor as CodeEditor,
  emptyEditorDoc,
} from 'on-codemerge/code';
import 'on-codemerge/index.css';
import 'on-codemerge/tailwind.css';
import 'on-codemerge/public.css';
import publicCssUrl from 'on-codemerge/public.css?url';
import publicJsUrl from 'on-codemerge/public.js?url';

type Mode = 'wysiwyg' | 'json' | 'markdown' | 'code';
type AnyEditor = WysiwygEditor | JsonEditor | MarkdownEditor | CodeEditor;

const errorsEl = document.querySelector('#errors');
const outputEl = document.querySelector('#output');
const publishEl = document.querySelector('#publish');
const publishCard = document.querySelector('#publish-card');
const versionEl = document.querySelector('#pkg-version');
const cssOkEl = document.querySelector('#css-ok');
const exportsOkEl = document.querySelector('#exports-ok');
const modeLabelEl = document.querySelector('#mode-label');

function reportError(err: unknown): void {
  const msg =
    err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err);
  console.error(err);
  if (errorsEl) {
    errorsEl.textContent = (errorsEl.textContent ? `${errorsEl.textContent}\n\n` : '') + msg;
  }
}

window.addEventListener('error', (e) => reportError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

function setText(el: Element | null, text: string): void {
  if (el) {
    el.textContent = text;
  }
}

function probeCss(): void {
  let hasToolbarCss = false;
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.cssText.includes('ocm-toolbar') || rule.cssText.includes('--color-ocm-accent')) {
          hasToolbarCss = true;
          break;
        }
      }
    } catch {
      /* ignore */
    }
    if (hasToolbarCss) {
      break;
    }
  }
  setText(cssOkEl, hasToolbarCss ? 'css: ocm-toolbar OK' : 'css: MISSING ocm-toolbar');
}

function publishedSrcdoc(bodyHtml: string, jsHref: string | null = null): string {
  const script = jsHref === null || jsHref === '' ? '' : `<script src="${jsHref}" defer></script>`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="${publicCssUrl}">
  ${script}
</head>
<body>
  <div class="ocm-content">${bodyHtml}</div>
</body>
</html>`;
}

const SAMPLE_JSON = JSON.stringify(
  {
    hello: 'json editor',
    count: 1,
    flags: [true, null],
    nested: { a: 1 },
  },
  null,
  2
);

const SAMPLE_MD = `# Markdown editor

Edit on the **left**. Preview on the right.

:::info Tip
Use the toolbar for callouts and blocks.
:::
`;

const SAMPLE_CODE = `// Code editor demo
const greet = (name) => {
  return \`hello, \${name}\`;
};

greet('on-codemerge');
`;

document.addEventListener('DOMContentLoaded', () => {
  const apiOk =
    typeof WysiwygEditor === 'function' &&
    typeof JsonEditor === 'function' &&
    typeof MarkdownEditor === 'function' &&
    typeof CodeEditor === 'function' &&
    typeof createWysiwygPlugins === 'function' &&
    typeof createJsonPlugins === 'function' &&
    typeof createMdPlugins === 'function' &&
    typeof createCodePlugins === 'function';
  setText(
    exportsOkEl,
    apiOk ? 'exports: Editor/plugins OK (wysiwyg+json+md+code)' : 'exports: BROKEN'
  );
  setText(versionEl, 'version: on-codemerge');
  probeCss();

  const host = document.querySelector('#editor');
  if (!(host instanceof HTMLElement)) {
    reportError(new Error('#editor host missing'));
    return;
  }

  try {
    const meta = import.meta as ImportMeta & { env?: { VITE_OCM_VERSION?: string } };
    if (meta.env?.VITE_OCM_VERSION) {
      setText(versionEl, `version: ${meta.env.VITE_OCM_VERSION}`);
    }
  } catch {
    /* ignore */
  }

  let mode: Mode = 'wysiwyg';
  let editor: AnyEditor | null = null;
  let offDoc: (() => void) | null = null;

  const show = (label: string, value: string) => {
    setText(outputEl, `=== ${label} ===\n${value}`);
  };

  const setActionsVisible = (active: Mode) => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-actions]')) {
      el.hidden = el.dataset.actions !== active;
    }
    if (publishCard instanceof HTMLElement) {
      publishCard.hidden = active === 'json' || active === 'code';
    }
  };

  const setModeTabs = (active: Mode) => {
    for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      const on = btn.dataset.mode === active;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    setText(modeLabelEl, `mode: ${active}`);
  };

  const refreshPublish = () => {
    if (!(editor instanceof WysiwygEditor) && !(editor instanceof MarkdownEditor)) {
      return { bodyHtml: '', full: '' };
    }
    const bodyHtml = editor.getPublishedHTML();
    const full = editor.getPublishedDocument();
    const needsJs = editor.getPublishedJS() !== null;
    if (publishEl instanceof HTMLIFrameElement) {
      // Prefer local public.js over CDN href from getPublishedJS (demo / file: install).
      publishEl.srcdoc = publishedSrcdoc(bodyHtml, needsJs ? publicJsUrl : null);
    }
    return { bodyHtml, full };
  };

  const refreshOutput = () => {
    if (!editor) {
      return;
    }
    if (editor instanceof WysiwygEditor) {
      show('JSON', JSON.stringify(editor.getJSON(), null, 2));
      refreshPublish();
      return;
    }
    if (editor instanceof JsonEditor) {
      show('Text (JSON)', editor.getText());
      return;
    }
    if (editor instanceof CodeEditor) {
      show('Text (Code)', editor.getText());
      return;
    }
    show('Text (Markdown)', editor.getText());
    refreshPublish();
  };

  const mount = (next: Mode) => {
    offDoc?.();
    offDoc = null;
    editor?.destroy();
    editor = null;
    host.replaceChildren();
    mode = next;
    setModeTabs(mode);
    setActionsVisible(mode);

    try {
      if (mode === 'wysiwyg') {
        const ed = new WysiwygEditor(host, {
          history: { maxDepth: 100, mergeWindowMs: 500 },
          plugins: createWysiwygPlugins(),
        });
        ed.run(insertText('on-codemerge npm stand — WYSIWYG'));
        editor = ed;
      } else if (mode === 'json') {
        const ed = new JsonEditor(host, {
          chrome: 'bar',
          history: { maxDepth: 100, mergeWindowMs: 500 },
          plugins: createJsonPlugins(),
        });
        const err = ed.setText(SAMPLE_JSON);
        if (err) {
          ed.notify(err.message);
        }
        editor = ed;
      } else if (mode === 'markdown') {
        const ed = new MarkdownEditor(host, {
          chrome: 'bar',
          history: { maxDepth: 100, mergeWindowMs: 500 },
          plugins: createMdPlugins(),
        });
        const err = ed.setText(SAMPLE_MD);
        if (err) {
          ed.notify(err.message);
        }
        editor = ed;
      } else {
        editor = new CodeEditor(host, {
          chrome: 'bar',
          history: { maxDepth: 100, mergeWindowMs: 500 },
          plugins: createCodePlugins(),
          doc: emptyEditorDoc(SAMPLE_CODE, 'javascript'),
        });
      }
    } catch (err) {
      reportError(err);
      return;
    }

    offDoc = editor.on('docChanged', refreshOutput);
    refreshOutput();
    requestAnimationFrame(() => probeCss());
    (globalThis as unknown as { editor: AnyEditor | null; mode: Mode }).editor = editor;
    (globalThis as unknown as { mode: Mode }).mode = mode;
  };

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    btn.addEventListener('click', () => {
      const next = btn.dataset.mode;
      if (next === 'wysiwyg' || next === 'json' || next === 'markdown' || next === 'code') {
        mount(next);
      }
    });
  }

  document.querySelector('#btn-bold')?.addEventListener('click', () => {
    if (editor instanceof WysiwygEditor) {
      editor.run(toggleMark('bold'));
    }
  });
  document.querySelector('#btn-json')?.addEventListener('click', () => {
    if (editor instanceof WysiwygEditor) {
      show('JSON', JSON.stringify(editor.getJSON(), null, 2));
    }
  });
  document.querySelector('#btn-html')?.addEventListener('click', () => {
    if (editor instanceof WysiwygEditor) {
      show('HTML', editor.getHTML());
    }
  });
  document.querySelector('#btn-md')?.addEventListener('click', () => {
    if (editor instanceof WysiwygEditor) {
      show('Markdown', editor.getMarkdown());
    }
  });
  const onPublishClick = () => {
    const { full } = refreshPublish();
    show('Published document (HTML)', full);
  };
  document.querySelector('#btn-publish')?.addEventListener('click', onPublishClick);
  document.querySelector('#btn-md-publish')?.addEventListener('click', onPublishClick);
  document.querySelector('#btn-set-html')?.addEventListener('click', () => {
    if (!(editor instanceof WysiwygEditor)) {
      return;
    }
    editor.setHTML(`
        <h1>Sample</h1>
        <p>Hello with <strong>bold</strong> and <em>italic</em>.</p>
        <ul><li>One</li><li>Two</li></ul>
        <table class="html-editor-table"><tbody>
          <tr><td>A1</td><td>A2</td></tr>
          <tr><td>B1</td><td>B2</td></tr>
        </tbody></table>
      `);
  });
  document.querySelector('#btn-clear')?.addEventListener('click', () => {
    if (editor instanceof WysiwygEditor) {
      editor.setHTML('<p></p>');
    }
  });
  document.querySelector('#btn-json-text')?.addEventListener('click', () => {
    if (editor instanceof JsonEditor) {
      show('Text (JSON)', editor.getText());
    }
  });
  document.querySelector('#btn-json-sample')?.addEventListener('click', () => {
    if (editor instanceof JsonEditor) {
      const err = editor.setText(SAMPLE_JSON);
      if (err) {
        editor.notify(err.message);
      }
    }
  });
  document.querySelector('#btn-clear-json')?.addEventListener('click', () => {
    if (editor instanceof JsonEditor) {
      editor.setText('null');
    }
  });
  document.querySelector('#btn-md-text')?.addEventListener('click', () => {
    if (editor instanceof MarkdownEditor) {
      show('Text (Markdown)', editor.getText());
    }
  });
  document.querySelector('#btn-md-html')?.addEventListener('click', () => {
    if (editor instanceof MarkdownEditor) {
      show('HTML (preview)', editor.getHTML());
    }
  });
  document.querySelector('#btn-md-sample')?.addEventListener('click', () => {
    if (editor instanceof MarkdownEditor) {
      const err = editor.setText(SAMPLE_MD);
      if (err) {
        editor.notify(err.message);
      }
    }
  });
  document.querySelector('#btn-clear-md')?.addEventListener('click', () => {
    if (editor instanceof MarkdownEditor) {
      editor.setText('');
    }
  });
  document.querySelector('#btn-code-text')?.addEventListener('click', () => {
    if (editor instanceof CodeEditor) {
      show('Text (Code)', editor.getText());
    }
  });
  document.querySelector('#btn-code-sample')?.addEventListener('click', () => {
    if (editor instanceof CodeEditor) {
      const err = editor.setText(SAMPLE_CODE);
      if (err) {
        editor.notify(err.message);
      }
    }
  });
  document.querySelector('#btn-clear-code')?.addEventListener('click', () => {
    if (editor instanceof CodeEditor) {
      editor.setText('');
    }
  });

  mount('wysiwyg');
});
