import { createDefaultPlugins, Editor, insertText } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

document.addEventListener('DOMContentLoaded', () => {
  const host = document.querySelector('#editor');
  const output = document.querySelector('#output');
  if (!(host instanceof HTMLElement)) {
    return;
  }

  const editor = new Editor(host, {
    history: { maxDepth: 100, mergeWindowMs: 500 },
    plugins: createDefaultPlugins(),
  });

  editor.run(insertText('on-codemerge demo — edit me'));

  const refresh = () => {
    if (output) {
      output.textContent = JSON.stringify(editor.getJSON(), null, 2);
    }
  };
  editor.on('docChanged', refresh);
  refresh();

  (globalThis as unknown as { editor: Editor }).editor = editor;
});
