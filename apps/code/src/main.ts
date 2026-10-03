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

  editor.setText(`// Code Editor — shared source contour
const hello = "on-codemerge";
function greet(name) {
  return \`Hello, \${name}\`;
}
greet(hello);
`);

  Object.assign(globalThis, { editor });
});
