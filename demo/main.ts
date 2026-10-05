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
import {
  createDefaultPlugins as createFormsPlugins,
  Editor as FormsEditor,
} from 'on-codemerge/forms';
import {
  createDefaultPlugins as createChartsPlugins,
  Editor as ChartsEditor,
} from 'on-codemerge/charts';
import {
  createDefaultPlugins as createCalendarPlugins,
  Editor as CalendarEditor,
} from 'on-codemerge/calendar';
import {
  createDefaultPlugins as createTablesPlugins,
  Editor as TablesEditor,
} from 'on-codemerge/tables';
import 'on-codemerge/index.css';
import 'on-codemerge/tailwind.css';
import 'on-codemerge/public.css';
import publicCssUrl from 'on-codemerge/public.css?url';
import publicJsUrl from 'on-codemerge/public.js?url';

const MODES = [
  'wysiwyg',
  'wysiwyg-page',
  'json',
  'markdown',
  'code',
  'forms',
  'charts',
  'calendar',
  'tables',
] as const;
type Mode = (typeof MODES)[number];
type AnyEditor =
  | WysiwygEditor
  | JsonEditor
  | MarkdownEditor
  | CodeEditor
  | FormsEditor
  | ChartsEditor
  | CalendarEditor
  | TablesEditor;

const PUBLISH_MODES = new Set<Mode>(['wysiwyg', 'wysiwyg-page', 'markdown']);

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

function isMode(value: string | undefined): value is Mode {
  return value !== undefined && (MODES as readonly string[]).includes(value);
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

function applySample(
  editor: { setText: (t: string) => Error | null; notify: (m: string) => void },
  text: string
): void {
  const err = editor.setText(text);
  if (err) {
    editor.notify(err.message);
  }
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

const SAMPLE_FORMS = `{
  "id": "demo-contact",
  "method": "POST",
  "action": "/submit",
  "className": "generated-form",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "options": { "name": "name", "placeholder": "Your name" },
      "validation": { "required": true }
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email",
      "options": { "name": "email", "placeholder": "you@example.com" },
      "validation": { "required": true }
    }
  ]
}`;

const SAMPLE_CHARTS = `{
  "chartType": "bar",
  "title": "Sales",
  "width": 800,
  "height": 400,
  "showLegend": true,
  "showGrid": true,
  "mode": "default",
  "orientation": "vertical",
  "xAxisLabel": "",
  "yAxisLabel": "",
  "align": "",
  "data": [
    {
      "name": "Series 1",
      "data": [
        { "label": "Jan", "value": 120 },
        { "label": "Feb", "value": 90 },
        { "label": "Mar", "value": 150 }
      ]
    }
  ]
}`;

function sampleCalendar(): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const today = new Date();
  const cursor = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  return `{
  "title": "Team calendar",
  "tz": "UTC",
  "view": "month",
  "cursor": "${cursor}",
  "calendars": [
    { "id": "main", "title": "Work", "color": "#3b82f6", "visible": true }
  ],
  "events": [
    {
      "id": "demo-1",
      "calendarId": "main",
      "title": "Standup",
      "start": "${cursor}T09:00",
      "end": "${cursor}T09:30",
      "allDay": false
    },
    {
      "id": "demo-2",
      "calendarId": "main",
      "title": "All-hands",
      "start": "${cursor}",
      "end": "${cursor}",
      "allDay": true
    }
  ]
}`;
}

const SAMPLE_TABLES = `{
  "version": 2,
  "columns": [
    { "id": "name", "title": "Name", "type": "text", "width": 160 },
    { "id": "qty", "title": "Qty", "type": "number", "width": 96 }
  ],
  "rows": [
    { "id": "r1", "cells": { "name": "Apples", "qty": 3 } },
    { "id": "r2", "cells": { "name": "Oranges", "qty": 2 } },
    { "id": "r3", "cells": { "name": "Bananas", "qty": 5 } }
  ]
}`;

const EMPTY_TABLES = `{
  "version": 2,
  "columns": [{ "id": "a", "title": "A", "type": "text" }],
  "rows": [{ "id": "r1", "cells": { "a": "" } }]
}`;

document.addEventListener('DOMContentLoaded', () => {
  const apiOk =
    typeof WysiwygEditor === 'function' &&
    typeof JsonEditor === 'function' &&
    typeof MarkdownEditor === 'function' &&
    typeof CodeEditor === 'function' &&
    typeof FormsEditor === 'function' &&
    typeof ChartsEditor === 'function' &&
    typeof CalendarEditor === 'function' &&
    typeof TablesEditor === 'function' &&
    typeof createWysiwygPlugins === 'function' &&
    typeof createJsonPlugins === 'function' &&
    typeof createMdPlugins === 'function' &&
    typeof createCodePlugins === 'function' &&
    typeof createFormsPlugins === 'function' &&
    typeof createChartsPlugins === 'function' &&
    typeof createCalendarPlugins === 'function' &&
    typeof createTablesPlugins === 'function';
  setText(exportsOkEl, apiOk ? 'exports: Editor/plugins OK (all modes)' : 'exports: BROKEN');
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

  const actionsKey = (active: Mode): string => (active === 'wysiwyg-page' ? 'wysiwyg' : active);

  const setActionsVisible = (active: Mode) => {
    const key = actionsKey(active);
    for (const el of document.querySelectorAll<HTMLElement>('[data-actions]')) {
      el.hidden = el.dataset.actions !== key;
    }
    if (publishCard instanceof HTMLElement) {
      publishCard.hidden = !PUBLISH_MODES.has(active);
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
    if (editor instanceof FormsEditor) {
      show('Text (Forms)', editor.getText());
      return;
    }
    if (editor instanceof ChartsEditor) {
      show('Text (Charts)', editor.getText());
      return;
    }
    if (editor instanceof CalendarEditor) {
      show('Text (Calendar)', editor.getText());
      return;
    }
    if (editor instanceof TablesEditor) {
      show('Text (Tables)', editor.getText());
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

    const history = { maxDepth: 100, mergeWindowMs: 500 };

    try {
      if (mode === 'wysiwyg' || mode === 'wysiwyg-page') {
        const ed = new WysiwygEditor(host, {
          chrome: mode === 'wysiwyg-page' ? 'page' : 'bar',
          history,
          plugins: createWysiwygPlugins(),
        });
        ed.run(
          insertText(
            mode === 'wysiwyg-page'
              ? 'on-codemerge demo stand — WYSIWYG (page)'
              : 'on-codemerge demo stand — WYSIWYG'
          )
        );
        editor = ed;
      } else if (mode === 'json') {
        const ed = new JsonEditor(host, {
          chrome: 'bar',
          history,
          plugins: createJsonPlugins(),
        });
        applySample(ed, SAMPLE_JSON);
        editor = ed;
      } else if (mode === 'markdown') {
        const ed = new MarkdownEditor(host, {
          chrome: 'bar',
          history,
          plugins: createMdPlugins(),
        });
        applySample(ed, SAMPLE_MD);
        editor = ed;
      } else if (mode === 'code') {
        editor = new CodeEditor(host, {
          chrome: 'bar',
          history,
          plugins: createCodePlugins(),
          doc: emptyEditorDoc(SAMPLE_CODE, 'javascript'),
        });
      } else if (mode === 'forms') {
        const ed = new FormsEditor(host, {
          chrome: 'bar',
          history,
          plugins: createFormsPlugins(),
        });
        applySample(ed, SAMPLE_FORMS);
        editor = ed;
      } else if (mode === 'charts') {
        const ed = new ChartsEditor(host, {
          chrome: 'bar',
          history,
          plugins: createChartsPlugins(),
        });
        applySample(ed, SAMPLE_CHARTS);
        editor = ed;
      } else if (mode === 'calendar') {
        const ed = new CalendarEditor(host, {
          chrome: 'bar',
          history,
          plugins: createCalendarPlugins(),
        });
        applySample(ed, sampleCalendar());
        editor = ed;
      } else {
        const ed = new TablesEditor(host, {
          chrome: 'bar',
          history,
          plugins: createTablesPlugins(),
        });
        applySample(ed, SAMPLE_TABLES);
        editor = ed;
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
      if (isMode(next)) {
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
        <table class="html-editor-table html-editor-table--sheet"><thead>
          <tr><th>Name</th><th>Qty</th></tr>
        </thead><tbody>
          <tr><td>Apples</td><td>3</td></tr>
          <tr><td>Oranges</td><td>2</td></tr>
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
      applySample(editor, SAMPLE_JSON);
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
      applySample(editor, SAMPLE_MD);
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
      applySample(editor, SAMPLE_CODE);
    }
  });
  document.querySelector('#btn-clear-code')?.addEventListener('click', () => {
    if (editor instanceof CodeEditor) {
      editor.setText('');
    }
  });
  document.querySelector('#btn-forms-text')?.addEventListener('click', () => {
    if (editor instanceof FormsEditor) {
      show('Text (Forms)', editor.getText());
    }
  });
  document.querySelector('#btn-forms-sample')?.addEventListener('click', () => {
    if (editor instanceof FormsEditor) {
      applySample(editor, SAMPLE_FORMS);
    }
  });
  document.querySelector('#btn-clear-forms')?.addEventListener('click', () => {
    if (editor instanceof FormsEditor) {
      editor.setText('{"id":"empty","fields":[]}');
    }
  });
  document.querySelector('#btn-charts-text')?.addEventListener('click', () => {
    if (editor instanceof ChartsEditor) {
      show('Text (Charts)', editor.getText());
    }
  });
  document.querySelector('#btn-charts-sample')?.addEventListener('click', () => {
    if (editor instanceof ChartsEditor) {
      applySample(editor, SAMPLE_CHARTS);
    }
  });
  document.querySelector('#btn-clear-charts')?.addEventListener('click', () => {
    if (editor instanceof ChartsEditor) {
      editor.setText('{"chartType":"bar","data":[]}');
    }
  });
  document.querySelector('#btn-calendar-text')?.addEventListener('click', () => {
    if (editor instanceof CalendarEditor) {
      show('Text (Calendar)', editor.getText());
    }
  });
  document.querySelector('#btn-calendar-sample')?.addEventListener('click', () => {
    if (editor instanceof CalendarEditor) {
      applySample(editor, sampleCalendar());
    }
  });
  document.querySelector('#btn-clear-calendar')?.addEventListener('click', () => {
    if (editor instanceof CalendarEditor) {
      editor.setText('{"title":"","calendars":[],"events":[]}');
    }
  });
  document.querySelector('#btn-tables-text')?.addEventListener('click', () => {
    if (editor instanceof TablesEditor) {
      show('Text (Tables)', editor.getText());
    }
  });
  document.querySelector('#btn-tables-sample')?.addEventListener('click', () => {
    if (editor instanceof TablesEditor) {
      applySample(editor, SAMPLE_TABLES);
    }
  });
  document.querySelector('#btn-clear-tables')?.addEventListener('click', () => {
    if (editor instanceof TablesEditor) {
      editor.setText(EMPTY_TABLES);
    }
  });

  mount('wysiwyg');
});
