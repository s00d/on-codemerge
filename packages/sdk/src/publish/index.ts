import { PUBLISHED_CONTENT_CLASS } from '../ui/chrome';
import type { ViewSpec } from '../ui/view';

/** Attribute holding JSON config for a publish runtime. */
export const OCM_CONFIG_ATTR = 'data-ocm-config';

/** Attribute naming which publish runtime should mount this element. */
export const OCM_RUNTIME_ATTR = 'data-ocm-runtime';

export type PublishRuntimeMount = (el: HTMLElement, config: unknown) => void | (() => void);

export interface PublishRuntimeDefinition {
  id: string;
  mount: PublishRuntimeMount;
}

/** Plugin hook: hydrate ViewSpec for a `data-node` atom (serialized at export). */
export interface PublishNodeDefinition {
  /** Matches `data-node` / DocNode.type. */
  node: string;
  /** Runtime id registered in `public.js` (optional if markup is static). */
  runtime?: string;
  /** Published page ViewSpec from model attrs (no HTML strings). */
  render: (attrs: Record<string, unknown>) => ViewSpec;
}

export function definePublishRuntime(def: PublishRuntimeDefinition): PublishRuntimeDefinition {
  return def;
}

/** Safe parse of `data-ocm-config` (returns null on missing/invalid). */
export function readOcmConfig(el: Element): unknown {
  const raw = el.getAttribute(OCM_CONFIG_ATTR);
  if (raw === null || raw === '') {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function setOcmConfig(el: Element, config: unknown): void {
  el.setAttribute(OCM_CONFIG_ATTR, JSON.stringify(config));
}

/** Collect unique runtime ids from `[data-ocm-runtime]` under root. */
export function neededRuntimeIds(root: ParentNode | string): string[] {
  const ids = new Set<string>();
  if (typeof root === 'string') {
    const re = /data-ocm-runtime\s*=\s*["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(root)) !== null) {
      if (m[1]) {
        ids.add(m[1]);
      }
    }
    return [...ids].toSorted();
  }
  root.querySelectorAll(`[${OCM_RUNTIME_ATTR}]`).forEach((el) => {
    const id = el.getAttribute(OCM_RUNTIME_ATTR);
    if (id) {
      ids.add(id);
    }
  });
  return [...ids].toSorted();
}

export class PublishRuntimeRegistry {
  private readonly runtimes = new Map<string, PublishRuntimeDefinition>();
  private readonly cleanups = new WeakMap<HTMLElement, () => void>();
  private booted = false;

  register(def: PublishRuntimeDefinition): () => void {
    this.runtimes.set(def.id, def);
    return () => {
      this.runtimes.delete(def.id);
    };
  }

  get(id: string): PublishRuntimeDefinition | undefined {
    return this.runtimes.get(id);
  }

  list(): PublishRuntimeDefinition[] {
    return [...this.runtimes.values()];
  }

  /**
   * Mount all `[data-ocm-runtime]` hosts under `root`.
   * Idempotent per element (skips already mounted via data-ocm-booted).
   */
  boot(root: ParentNode = document): void {
    this.booted = true;
    root.querySelectorAll<HTMLElement>(`[${OCM_RUNTIME_ATTR}]`).forEach((el) => {
      if (el.dataset.ocmBooted === '1') {
        return;
      }
      const id = el.getAttribute(OCM_RUNTIME_ATTR);
      if (!id) {
        return;
      }
      const runtime = this.runtimes.get(id);
      if (!runtime) {
        return;
      }
      const config = readOcmConfig(el);
      const cleanup = runtime.mount(el, config);
      el.dataset.ocmBooted = '1';
      if (typeof cleanup === 'function') {
        this.cleanups.set(el, cleanup);
      }
    });
  }

  /** Tear down mounts under root (tests / SPA navigations). */
  unboot(root: ParentNode = document): void {
    root
      .querySelectorAll<HTMLElement>(`[${OCM_RUNTIME_ATTR}][data-ocm-booted="1"]`)
      .forEach((el) => {
        this.cleanups.get(el)?.();
        this.cleanups.delete(el);
        delete el.dataset.ocmBooted;
      });
    this.booted = false;
  }

  get isBooted(): boolean {
    return this.booted;
  }
}

/** Shared registry for the published `public.js` bundle (plugins self-register). */
export const publishRuntimes = new PublishRuntimeRegistry();

/** Call from plugins/.../publish/runtime.ts — side-effect registration. */
export function registerPublishRuntime(def: PublishRuntimeDefinition): PublishRuntimeDefinition {
  publishRuntimes.register(def);
  return def;
}

export interface ComposePublishedDocumentOptions {
  bodyHtml: string;
  cssHref?: string | null;
  jsHref?: string | null;
  title?: string;
  contentClass?: string;
}

/** Full standalone HTML document (published export). */
export function composePublishedDocument(opts: ComposePublishedDocumentOptions): string {
  const css =
    opts.cssHref === null || opts.cssHref === undefined
      ? ''
      : `<link rel="stylesheet" href="${escapeAttr(opts.cssHref)}">`;
  const js =
    opts.jsHref === null || opts.jsHref === undefined || opts.jsHref === ''
      ? ''
      : `<script src="${escapeAttr(opts.jsHref)}" defer></script>`;
  const title = opts.title ? `<title>${escapeText(opts.title)}</title>` : '';
  const contentClass = opts.contentClass ?? PUBLISHED_CONTENT_CLASS;
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    ${title}
    ${css}
    <style>
      @media print {
        body { margin: 0; padding: 1rem; }
      }
    </style>
    ${js}
  </head>
  <body>
    <div class="${escapeAttr(contentClass)}">
${opts.bodyHtml}
    </div>
  </body>
</html>`;
}

function escapeAttr(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeText(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Default CDN base for published assets (css/js). */
export const PUBLISHED_CDN_BASE = 'https://cdn.jsdelivr.net/npm/on-codemerge/dist';

export function publishedCssHref(base = PUBLISHED_CDN_BASE): string {
  return `${base}/public.css`;
}

export function publishedJsHref(base = PUBLISHED_CDN_BASE): string {
  return `${base}/public.js`;
}
