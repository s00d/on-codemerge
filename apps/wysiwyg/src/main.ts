import 'virtual:ocm-package-index.css';
import './public.css';
import { Editor, createDefaultPlugins, insertText } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.querySelector('#app');
  if (!(appDiv instanceof HTMLElement)) {
    return;
  }

  const editor = new Editor(appDiv, {
    history: { maxDepth: 100, mergeWindowMs: 500 },
    plugins: createDefaultPlugins(),
  });

  editor.run(insertText('on-codemerge — plugins on SDK core'));
  Object.assign(globalThis, { editor });
});
