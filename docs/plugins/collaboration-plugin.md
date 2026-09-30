# Collaboration Plugin

Совместное редактирование: **браузерный редактор** ↔ **WebSocket-сервер** ↔ **другие редакторы**.

```
┌─────────────┐     ws://127.0.0.1:8787/collab      ┌──────────────────────┐
│  Docs / App │ ─────────────────────────────────► │ collaboration-server │
│  (плагин)   │ ◄───────────────────────────────── │  token = COLLAB_TOKEN│
└─────────────┘         ops + presence             └──────────────────────┘
```

Плагин **сам по себе никуда не коннектится** без `docId` в URL — пока не нажмёшь **Start**.  
Если в URL уже есть `?docId=…` (шаринговая ссылка) и задан `token` — коннект **автоматический**.  
Сервер нужно поднять **отдельно**.

---

## Быстрый старт (docs в репо)

**Терминал 1 — сервер:**

```bash
pnpm run collab:dev
```

Должно напечатать: `CodeMerge collab v2 on ws://0.0.0.0:8787/collab`.  
Проверка: `curl -s http://127.0.0.1:8787/collab/health` → `{"ok":true,...}`.

> Порт **8787**, не 8080 — на многих машинах 8080 занят прокси (Burp и т.п.), из‑за этого WS в браузере падает.

**Терминал 2 — docs:**

```bash
pnpm run docs:dev
```

1. Открой эту страницу в браузере (Collaboration Plugin).
2. В тулбаре справа — чип статуса (**Выкл** / **Синхронизация…** / **В сети** + счётчик peers). Клик открывает тот же попап, что Review → Collaboration (или `Mod-Alt-O`).
3. В попапе нажми **Start Collaboration** (первый визит без `?docId=`).
4. Статус станет `synced` / чип **В сети**. В адресной строке только `?docId=…` (без userId).
5. **Share this link** / скопируй URL с `docId` → открой в другом окне/браузере. Второй клиент получит **свой** userId (sessionStorage), подключится сам. Печать синхронится без удвоения.

В docs-демо уже задано:

- `serverUrl: 'ws://127.0.0.1:8787/collab'`
- `token: 'dev'` (= `COLLAB_TOKEN` у сервера)

Без `pnpm run collab:dev` кнопка Start / автостарт выдаст ошибку коннекта — это нормально.

---

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['CollaborationPlugin']"
  :showDescription="false"
  :showResults="false"
/>

---

## Куда «подключать» в своём приложении

Не HTTP API редактора — а **опции плагина** + **отдельный WS-сервер**.

| Что         | Куда                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Сервер      | процесс `@codemerge/collaboration-server` (CLI или `createCollaborationServer` на своём Node HTTP) |
| Клиент      | `CollaborationPlugin({ serverUrl, token \| getToken })` в `Editor({ plugins })`                    |
| URL комнаты | `serverUrl` = `ws://HOST:PORT/collab` (путь `/collab` по умолчанию)                                |
| Секрет      | `COLLAB_TOKEN` на сервере = `token` / `getToken()` у плагина                                       |
| Документ    | `docId` в URL комнаты (`?docId=…` only — **не** `userId`)                                          |

```ts
import { Editor, CollaborationPlugin, createCorePlugins } from 'on-codemerge';

new Editor(el, {
  plugins: [
    ...createCorePlugins(),
    CollaborationPlugin({
      serverUrl: 'ws://127.0.0.1:8787/collab', // ← адрес твоего collab:dev / прода
      token: 'dev', // ← тот же, что COLLAB_TOKEN
      // или: getToken: () => fetch('/api/collab-token').then(r => r.text()),
      // Share links (?docId=) auto-connect; set autoStart:false to disable.
      user: { name: 'Ada', color: '#2563eb' },
    }),
  ],
});
```

Дальше: тулбар **Start**, или:

```ts
import { getCollaborationHandle } from 'on-codemerge';
getCollaborationHandle(editor)?.start();
```

---

## Сервер отдельно (prod-like)

```bash
pnpm add @codemerge/collaboration-server
COLLAB_TOKEN=dev npx codemerge-collaboration-server serve --port 8787 --store sqlite:./collab.db
```

Встроить в свой HTTP:

```ts
import http from 'node:http';
import {
  createCollaborationServer,
  staticTokenAuth,
  memoryStore,
} from '@codemerge/collaboration-server';

const collab = await createCollaborationServer({
  store: memoryStore(),
  auth: staticTokenAuth({ token: process.env.COLLAB_TOKEN! }),
  path: '/collab',
});
const server = http.createServer();
collab.attach(server);
server.listen(8787);
```

Подробности: [package README](https://github.com/s00d/on-codemerge/tree/main/packages/collaboration-server).

---

## Options

```ts
interface CollaborationPluginOptions {
  serverUrl?: string; // default ws://localhost:8080/collab (override in docs/dev: 8787)
  autoStart?: boolean; // true = always; false = never; omit = auto when ?docId= present
  token?: string; // static auth (dev)
  getToken?: () => Promise<string> | string;
  docId?: string;
  user?: { id?: string; name?: string; color?: string };
  onStatus?: (s: CollabStatus) => void;
  onPresence?: (peers: PresencePeer[]) => void;
  onBroadcast?: (ops: Operation[]) => void;
  offlineQueue?: boolean; // default true
}
```

## Helpers

- `getCollaborationHandle(editor)` — `start` / `stop` / `getStatus` / `getPeers` / `forceResync`
- `createCollabClient(opts)` — низкоуровневый клиент
- `createOpsCollabBinding` — legacy binding для тестов
