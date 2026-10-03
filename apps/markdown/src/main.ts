import 'virtual:ocm-package-index.css';
import { Editor, createDefaultPlugins } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.querySelector('#app');
  if (!(appDiv instanceof HTMLElement)) {
    return;
  }
  // Fill viewport so dual-pane scrolls inside panes (not grow the page).
  appDiv.classList.add('min-h-0', 'flex-1');

  const editor = new Editor(appDiv, {
    chrome: 'bar',
    history: { maxDepth: 100, mergeWindowMs: 500 },
    plugins: createDefaultPlugins(),
  });

  editor.setText(`# Markdown editor

Edit on the **left**. Preview on the right.

:::info Tip
Use **Insert** / **Turn into** in the toolbar for callouts and blocks.

@btn[Docs](#)
@btn[Dismiss](#)
:::

:::warn Caution
Changing the callout type keeps the body — put the cursor inside and use **Turn into**.

@btn[Got it](#)
:::

\`\`\`mermaid
flowchart LR
  A[Source] --> B[Preview]
\`\`\`
`);

  const bar = document.createElement('div');
  bar.className = 'flex gap-2 p-2 border-b border-neutral-200';
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.textContent = 'Open…';
  openBtn.className = 'text-sm px-2 py-1 border rounded';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'text/markdown,.md,text/plain';
  fileInput.hidden = true;
  openBtn.addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }
    void (async () => {
      const t = await file.text();
      const err = editor.setText(t);
      if (err) {
        editor.notify(err.message);
      }
    })();
  });
  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.textContent = 'Download';
  downloadBtn.className = 'text-sm px-2 py-1 border rounded';
  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([editor.getText()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  });
  bar.append(openBtn, downloadBtn, fileInput);
  appDiv.before(bar);

  Object.assign(globalThis, { editor });
});
