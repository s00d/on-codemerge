import { createElement, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createApp, defineComponent, h, ref, watch, type App, type Ref } from 'vue';
import { CodeMergeEditor as ReactEditor } from '@codemerge/integrate/react';
import { CodeMergeEditor as VueEditor } from '@codemerge/integrate/vue';
import { mountCodeMergeEditor, type EditorHostHandle } from '@codemerge/integrate/mount';
import { registerJQueryPlugin } from '@codemerge/integrate/jquery';
import '@codemerge/integrate/element';

type Adapter = 'react' | 'vue' | 'element' | 'mount' | 'jquery';

const VALUE_A = '<p data-stand="a"><strong>Value A</strong> from external state</p>';
const VALUE_B = '<p data-stand="b"><em>Value B</em> pushed into the editor</p>';

const hostEl = document.querySelector('#host') as HTMLDivElement;
const externalEl = document.querySelector('#external-value') as HTMLPreElement;
const lastEventEl = document.querySelector('#last-event') as HTMLPreElement;
const errorsEl = document.querySelector('#errors') as HTMLDivElement;
const statusEl = document.querySelector('#status') as HTMLSpanElement;
const adapterLabelEl = document.querySelector('#adapter-label') as HTMLStrongElement;
const ocmVersionEl = document.querySelector('#ocm-version') as HTMLStrongElement;
const intVersionEl = document.querySelector('#int-version') as HTMLStrongElement;

ocmVersionEl.textContent = String(import.meta.env.VITE_OCM_VERSION ?? 'unknown');
intVersionEl.textContent = String(import.meta.env.VITE_INTEGRATE_VERSION ?? 'unknown');

let adapter: Adapter = 'react';
let externalValue = VALUE_A;
let reactRoot: Root | null = null;
let vueApp: App | null = null;
let vueHtml: Ref<string> | null = null;
let mountHandle: EditorHostHandle | null = null;
let elementNode: (HTMLElement & { setValue?: (v: string) => void; host?: unknown }) | null = null;
let jqueryReady = false;

function reportError(err: unknown): void {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(err);
  errorsEl.textContent = (errorsEl.textContent ? `${errorsEl.textContent}\n` : '') + msg;
  statusEl.textContent = 'error';
  statusEl.className = 'bad';
}

function setStatus(text: string, ok = true): void {
  statusEl.textContent = text;
  statusEl.className = ok ? 'ok' : 'bad';
}

function setExternal(value: string, source: string): void {
  externalValue = value;
  externalEl.textContent = value;
  lastEventEl.textContent = `${source} @ ${new Date().toISOString()}\nlen=${value.length}`;
}

function teardown(): void {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (vueApp) {
    vueApp.unmount();
    vueApp = null;
  }
  vueHtml = null;
  mountHandle?.destroy();
  mountHandle = null;
  elementNode?.remove();
  elementNode = null;
  hostEl.replaceChildren();
}

function ReactPanel({ value }: { value: string }) {
  const [html, setHtml] = useState(value);
  useEffect(() => {
    setHtml(value);
  }, [value]);
  return createElement(ReactEditor, {
    value: html,
    format: 'html',
    chrome: 'bar',
    pack: 'default',
    minHeight: 280,
    onChange: (next: string) => {
      setHtml(next);
      setExternal(next, 'react/onChange');
    },
    onReady: () => setStatus('react ready'),
  });
}

function mountReact(): void {
  reactRoot = createRoot(hostEl);
  reactRoot.render(createElement(ReactPanel, { value: externalValue }));
}

function mountVue(): void {
  const Panel = defineComponent({
    setup() {
      const html = ref(externalValue);
      vueHtml = html;
      watch(html, (next) => {
        /* editor → already mirrored via onChange */
        void next;
      });
      return () =>
        h(VueEditor, {
          value: html.value,
          format: 'html',
          chrome: 'bar',
          minHeight: 280,
          hostOptions: { pack: 'default' },
          onChange: (next: string) => {
            html.value = next;
            setExternal(next, 'vue/change');
          },
          onReady: () => setStatus('vue ready'),
        });
    },
  });
  vueApp = createApp(Panel);
  vueApp.mount(hostEl);
}

function mountElement(): void {
  const el = document.createElement('ocm-editor') as HTMLElement & {
    setValue?: (v: string) => void;
    host?: unknown;
  };
  el.setAttribute('format', 'html');
  el.setAttribute('chrome', 'bar');
  el.setAttribute('pack', 'default');
  el.setAttribute('value', externalValue);
  el.style.minHeight = '280px';
  const wire = (): void => setStatus('element ready');
  el.addEventListener('change', ((ev: CustomEvent<{ value: string }>) => {
    setExternal(ev.detail.value, 'element/change');
  }) as EventListener);
  if (el.host) wire();
  else el.addEventListener('ready', wire, { once: true });
  hostEl.append(el);
  elementNode = el;
}

function mountMount(): void {
  mountHandle = mountCodeMergeEditor(hostEl, {
    value: externalValue,
    format: 'html',
    chrome: 'bar',
    pack: 'default',
    onChange: (next) => setExternal(next, 'mount/onChange'),
    onReady: () => setStatus('mount ready'),
  });
}

type Jq = typeof import('jquery').default;

async function ensureJQuery(): Promise<Jq> {
  const mod = await import('jquery');
  const $ = mod.default;
  (window as unknown as { jQuery: Jq; $: Jq }).jQuery = $;
  (window as unknown as { $: Jq }).$ = $;
  if (!jqueryReady) {
    registerJQueryPlugin($);
    jqueryReady = true;
  }
  return $;
}

async function mountJquery(): Promise<void> {
  const $ = await ensureJQuery();
  ($('#host') as unknown as { ocmEditor: (opts: Record<string, unknown>) => unknown }).ocmEditor({
    value: externalValue,
    format: 'html',
    chrome: 'bar',
    pack: 'default',
    onChange: (next: string) => setExternal(next, 'jquery/onChange'),
    onReady: () => setStatus('jquery ready'),
  });
}

async function boot(next: Adapter): Promise<void> {
  errorsEl.textContent = '';
  adapter = next;
  adapterLabelEl.textContent = next;
  setStatus(`booting ${next}…`, true);
  teardown();
  setExternal(externalValue, `boot/${next}`);
  try {
    if (next === 'react') mountReact();
    else if (next === 'vue') mountVue();
    else if (next === 'element') mountElement();
    else if (next === 'mount') mountMount();
    else await mountJquery();
  } catch (err) {
    reportError(err);
  }
}

async function pushValue(value: string): Promise<void> {
  setExternal(value, 'external/set');
  try {
    if (adapter === 'react') {
      reactRoot?.render(createElement(ReactPanel, { value }));
    } else if (adapter === 'vue' && vueHtml) {
      vueHtml.value = value;
    } else if (adapter === 'element' && elementNode) {
      if (typeof elementNode.setValue === 'function') elementNode.setValue(value);
      else elementNode.setAttribute('value', value);
    } else if (adapter === 'mount' && mountHandle) {
      mountHandle.setValue(value);
    } else if (adapter === 'jquery') {
      const $ = await ensureJQuery();
      (
        $('#host') as unknown as { ocmEditor: (opts: Record<string, unknown>) => unknown }
      ).ocmEditor({
        value,
        format: 'html',
        chrome: 'bar',
        pack: 'default',
        onChange: (next: string) => setExternal(next, 'jquery/onChange'),
      });
    }
    setStatus(`${adapter}: external → editor`, true);
  } catch (err) {
    reportError(err);
  }
}

document.querySelector('#tabs')?.addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest(
    'button[data-adapter]'
  ) as HTMLButtonElement | null;
  if (!btn?.dataset.adapter) return;
  for (const b of document.querySelectorAll<HTMLButtonElement>('#tabs button')) {
    b.setAttribute('aria-selected', String(b === btn));
  }
  void boot(btn.dataset.adapter as Adapter);
});

document.querySelector('#btn-set-a')?.addEventListener('click', () => void pushValue(VALUE_A));
document.querySelector('#btn-set-b')?.addEventListener('click', () => void pushValue(VALUE_B));
document.querySelector('#btn-clear')?.addEventListener('click', () => void pushValue('<p></p>'));
document.querySelector('#btn-apply')?.addEventListener('click', () => {
  const input = document.querySelector('#custom-value') as HTMLInputElement;
  void pushValue(input.value || '<p></p>');
});

setExternal(VALUE_A, 'init');
void boot('react');
