# Electron

Load a Vite-built editor in a `BrowserWindow` and persist **JSON** (file or `localStorage`).

Verified: renderer build + browser smoke (`Electron JSON SoT` screenshot). Electron binary `v36.9.5` installs after scripts are enabled (`electron/install.js`); window load uses `loadFile('dist/index.html')`.

## Install

```bash
npm install on-codemerge
npm install -D electron vite
```

If Electron’s binary is missing (`Electron failed to install correctly`), re-run the postinstall / `node node_modules/electron/install.js`.

## Minimal example

`main.cjs` (working smoke main):

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

async function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  await win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(createWindow);
```

Renderer (Vite entry, `base: './'`):

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});
editor.setJSON(/* load from IPC / localStorage */);
editor.on('docChanged', () => {
  const doc = editor.getJSON();
  // IPC to main to write JSON file, or localStorage.setItem(...)
});
```

Build with Vite into `dist/`, copy `index.html` that references `./editor.js` + `./editor.css`, then `electron .`.

## Persist

Prefer JSON over HTML. Typical bridge: `ipcRenderer.invoke('save-doc', editor.getJSON())` → main writes a `.json` file.

## Gotchas

- Use `base: './'` so `file://` asset URLs resolve.
- Keep `nodeIntegration: false` + `contextIsolation: true`; talk to Node only via preload/IPC.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
