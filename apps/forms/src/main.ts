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

  editor.setText(`{
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
}`);

  Object.assign(globalThis, { editor });
});
