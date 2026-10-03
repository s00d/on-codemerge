import 'virtual:ocm-package-index.css';
import { Editor, createDefaultPlugins } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.querySelector('#app');
  if (!(appDiv instanceof HTMLElement)) {
    return;
  }

  const editor = new Editor(appDiv, {
    chrome: 'bar',
    history: { maxDepth: 100, mergeWindowMs: 500 },
    plugins: createDefaultPlugins(),
  });

  editor.setText(
    JSON.stringify(
      {
        hello: 'json editor',
        count: 1,
        flags: [true, null],
        nested: { a: 1 },
      },
      null,
      2
    )
  );

  const bar = document.createElement('div');
  bar.className = 'flex gap-2 p-2 border-b border-neutral-200';
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.textContent = 'Open…';
  openBtn.className = 'text-sm px-2 py-1 border rounded';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
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
    const blob = new Blob([editor.getText()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  bar.append(openBtn, downloadBtn, fileInput);
  appDiv.before(bar);

  Object.assign(globalThis, { editor });
});
