import '@ocm/wysiwyg/tailwind.css';
import '@on-codemerge/sdk/ui/sdk.scss';
import '../../../plugins/JsonPlugin/style.scss';
import '../../../plugins/MarkdownPlugin/style.scss';

import { mountSourceEditor } from '@on-codemerge/editor';
import type { SourceEditorHandle } from '@on-codemerge/editor';
import { mountRawEditor } from '../../../plugins/JsonPlugin/widgets/rawEditor';
import type { RawEditorHandle } from '../../../plugins/JsonPlugin/widgets/rawEditor';
import { CORPUS } from './corpus';

const LONG_WIDE = `${'line\n'.repeat(60)}${'x'.repeat(200)}\n${'tail\n'.repeat(10)}`;

/** ~12k lines — stress gutter virtualization + highlight caps. */
const HUGE_LINES = 12_000;
const HUGE_TEXT = Array.from(
  { length: HUGE_LINES },
  (_, i) => `const row_${i} = ${i}; // line ${i + 1}`
).join('\n');

const JSON_SAMPLE = `{
  "hello": "json editor",
  "items": [1, true, null],
  "nested": { "ok": true }
}
`;

const JSON_LONG = `{\n${Array.from({ length: 40 }, (_, i) => `  "k${i}": ${i},`).join('\n')}\n  "wide": "${'x'.repeat(160)}"\n}\n`;

const JSON_HUGE = `{\n${Array.from({ length: HUGE_LINES }, (_, i) => `  "k${i}": ${i}${i < HUGE_LINES - 1 ? ',' : ''}`).join('\n')}\n}\n`;

const statusEl = document.querySelector('[data-testid="status"]');
const setStatus = (s: string): void => {
  if (statusEl) {
    statusEl.textContent = s;
  }
};

const isolatedHost = document.querySelector('[data-testid="host-isolated"]');
const jsonHost = document.querySelector('[data-testid="host-json"]');
const mdHost = document.querySelector('[data-testid="host-md"]');

if (
  !(isolatedHost instanceof HTMLElement) ||
  !(jsonHost instanceof HTMLElement) ||
  !(mdHost instanceof HTMLElement)
) {
  throw new Error('stand hosts missing');
}

isolatedHost.classList.add('ocm-source-stand-host', 'h-full', 'min-h-0', 'flex', 'flex-col');
jsonHost.classList.add(
  'ocm-json-source-host',
  'h-full',
  'min-h-0',
  'flex',
  'flex-1',
  'flex-col',
  'overflow-hidden'
);
mdHost.classList.add(
  'ocm-md-source-host',
  'h-full',
  'min-h-0',
  'flex',
  'flex-1',
  'flex-col',
  'overflow-hidden'
);

let isolated: SourceEditorHandle | null = null;
let jsonRaw: RawEditorHandle | null = null;
let mdSource: SourceEditorHandle | null = null;

const mountIsolated = (text: string): void => {
  isolated?.destroy();
  isolated = mountSourceEditor(isolatedHost, {
    initialText: text,
    onDocChanged: () => {
      setStatus('isolated-dirty');
    },
  });
};

const mountJson = (text: string): void => {
  jsonRaw?.destroy();
  jsonRaw = mountRawEditor(jsonHost, {
    initialText: text,
    onDirty: () => {
      setStatus('json-dirty');
    },
    onApplyRequest: () => {
      setStatus('json-apply');
    },
  });
};

const mountMd = (text: string): void => {
  mdSource?.destroy();
  mdSource = mountSourceEditor(mdHost, {
    initialText: text,
    onDocChanged: () => {
      setStatus('md-dirty');
    },
  });
};

function extractSection(text: string, key: 'json' | 'md'): string {
  const marker = `---${key}---`;
  const start = text.indexOf(marker);
  if (start < 0) {
    return text;
  }
  const body = text.slice(start + marker.length);
  const next = body.search(/\n---[a-z]+---/);
  return (next < 0 ? body : body.slice(0, next)).trim();
}

const loadCorpus = (): void => {
  mountIsolated(CORPUS);
  mountJson(extractSection(CORPUS, 'json') || JSON_SAMPLE);
  mountMd(extractSection(CORPUS, 'md') || CORPUS);
  setStatus('corpus');
};

const loadLong = (): void => {
  mountIsolated(LONG_WIDE);
  mountJson(JSON_LONG);
  mountMd(LONG_WIDE);
  setStatus('long');
};

const loadHuge = (): void => {
  const t0 = performance.now();
  mountIsolated(HUGE_TEXT);
  mountJson(JSON_HUGE);
  mountMd(HUGE_TEXT);
  const ms = Math.round(performance.now() - t0);
  setStatus(`huge:${HUGE_LINES}:${ms}ms`);
};

const scrollPane = (which: 'isolated' | 'json' | 'md', mode: 'end' | 'mid'): void => {
  const handle = which === 'isolated' ? isolated : which === 'json' ? jsonRaw : mdSource;
  const root = handle?.dom;
  if (!(root instanceof HTMLElement)) {
    return;
  }
  const ta = root.querySelector('.ocm-source-editor__input');
  if (!(ta instanceof HTMLTextAreaElement)) {
    return;
  }
  const max = Math.max(0, ta.scrollHeight - ta.clientHeight);
  ta.scrollTop = mode === 'end' ? max : Math.floor(max / 2);
  ta.dispatchEvent(new Event('scroll'));
};

const scrollEnd = (): void => {
  scrollPane('isolated', 'end');
  scrollPane('json', 'end');
  scrollPane('md', 'end');
  setStatus('scroll-end');
};

const scrollMid = (): void => {
  scrollPane('isolated', 'mid');
  scrollPane('json', 'mid');
  scrollPane('md', 'mid');
  setStatus('scroll-mid');
};

document.querySelector('[data-testid="btn-corpus"]')?.addEventListener('click', loadCorpus);
document.querySelector('[data-testid="btn-long"]')?.addEventListener('click', loadLong);
document.querySelector('[data-testid="btn-huge"]')?.addEventListener('click', loadHuge);
document.querySelector('[data-testid="btn-scroll-end"]')?.addEventListener('click', scrollEnd);
document.querySelector('[data-testid="btn-scroll-mid"]')?.addEventListener('click', scrollMid);

loadCorpus();
setStatus('ready');
