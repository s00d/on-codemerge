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

  editor.setText(`{
  "version": 2,
  "columns": [
    { "id": "name", "title": "Name", "type": "text", "width": 160 },
    { "id": "qty", "title": "Qty", "type": "number", "width": 96 }
  ],
  "rows": [
    { "id": "r1", "cells": { "name": "Apples", "qty": 3 } },
    { "id": "r2", "cells": { "name": "Oranges", "qty": 2 } },
    { "id": "r3", "cells": { "name": "Bananas", "qty": 5 } }
  ],
  "view": {
    "pagination": { "page": 0, "pageSize": 50 }
  }
}`);

  Object.assign(globalThis, { editor });
});
