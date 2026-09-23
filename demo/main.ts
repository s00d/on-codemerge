import { createDefaultPlugins, Editor, insertText, toggleMark } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import publicCssUrl from 'on-codemerge/public.css?url';

type StandEditor = Editor;

const errorsEl = document.querySelector('#errors');
const outputEl = document.querySelector('#output');
const publishEl = document.querySelector('#publish');
const versionEl = document.querySelector('#pkg-version');
const cssOkEl = document.querySelector('#css-ok');
const exportsOkEl = document.querySelector('#exports-ok');

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

/** Local package CSS in srcdoc — CDN can lag / fail; demo must show real content. */
function publishedSrcdoc(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="${publicCssUrl}">
</head>
<body>
  <div class="ocm-content">${bodyHtml}</div>
</body>
</html>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const apiOk =
    typeof Editor === 'function' &&
    typeof createDefaultPlugins === 'function' &&
    typeof insertText === 'function' &&
    typeof toggleMark === 'function';
  setText(exportsOkEl, apiOk ? 'exports: Editor/plugins OK' : 'exports: BROKEN');
  setText(versionEl, 'version: on-codemerge (npm)');
  probeCss();

  const host = document.querySelector('#editor');
  if (!(host instanceof HTMLElement)) {
    reportError(new Error('#editor host missing'));
    return;
  }

  let editor: StandEditor;
  try {
    editor = new Editor(host, {
      history: { maxDepth: 100, mergeWindowMs: 500 },
      plugins: createDefaultPlugins(),
    });
  } catch (err) {
    reportError(err);
    return;
  }

  requestAnimationFrame(() => probeCss());

  try {
    const meta = import.meta as ImportMeta & { env?: { VITE_OCM_VERSION?: string } };
    if (meta.env?.VITE_OCM_VERSION) {
      setText(versionEl, `version: ${meta.env.VITE_OCM_VERSION}`);
    }
  } catch {
    /* ignore */
  }

  editor.run(insertText('on-codemerge npm stand — edit me'));

  const show = (label: string, value: string) => {
    setText(outputEl, `=== ${label} ===\n${value}`);
  };

  const refreshPublish = () => {
    const bodyHtml = editor.getPublishedHTML();
    const full = editor.getPublishedDocument();
    if (publishEl instanceof HTMLIFrameElement) {
      publishEl.srcdoc = publishedSrcdoc(bodyHtml);
    }
    return { bodyHtml, full };
  };

  const refreshJson = () => {
    show('JSON', JSON.stringify(editor.getJSON(), null, 2));
    refreshPublish();
  };

  editor.on('docChanged', refreshJson);
  refreshJson();

  document.querySelector('#btn-bold')?.addEventListener('click', () => {
    editor.run(toggleMark('bold'));
  });
  document.querySelector('#btn-json')?.addEventListener('click', refreshJson);
  document.querySelector('#btn-html')?.addEventListener('click', () => {
    show('HTML', editor.getHTML());
  });
  document.querySelector('#btn-md')?.addEventListener('click', () => {
    show('Markdown', editor.getMarkdown());
  });
  document.querySelector('#btn-publish')?.addEventListener('click', () => {
    const { full } = refreshPublish();
    show('Published document (HTML)', full);
  });
  document.querySelector('#btn-set-html')?.addEventListener('click', () => {
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
    editor.setHTML('<p></p>');
  });

  (globalThis as unknown as { editor: StandEditor }).editor = editor;
});
