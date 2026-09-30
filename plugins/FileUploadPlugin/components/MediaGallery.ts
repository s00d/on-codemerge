import { foreign, h, img, mount } from '@on-codemerge/sdk';
import type { ViewSpec } from '@on-codemerge/sdk';
import { clearIcon, deleteIcon, fileIcon, imageIcon, uploadIcon } from '@ocm/wysiwyg/icons';
import type { MediaListItem } from '../services/mediaApi';

export type MediaGalleryLabels = {
  search: string;
  searchPlaceholder: string;
  refresh: string;
  loading: string;
  empty: string;
  noMatches: string;
  failed: string;
  results: string;
  insert: string;
  delete: string;
  deleteConfirm: string;
  deleting: string;
};

export type MediaGalleryOpts = {
  mode: 'grid' | 'list';
  items: MediaListItem[];
  loading: boolean;
  error: string;
  labels: MediaGalleryLabels;
  formatSize: (bytes: number) => string;
  onSelect: (item: MediaListItem) => void;
  onRefresh: () => void;
  /** When set, each item shows a delete control (`DELETE` handled by caller). */
  onDelete?: (item: MediaListItem) => Promise<void>;
};

type GalleryPaintOpts = MediaGalleryOpts & {
  deletingId: string | null;
  onRequestDelete: (item: MediaListItem) => void;
};

/**
 * Shared media gallery: search, refresh, delete, polished empty/loading states,
 * image grid or file list. Owns search/delete-busy state so typing does not remount the modal.
 */
export function mediaGalleryView(opts: MediaGalleryOpts): ViewSpec {
  return foreign((host, scope) => {
    host.className = 'ocm-media-gallery flex flex-col gap-3';
    let query = '';
    let deletingId: string | null = null;
    let resultsHost: HTMLElement | null = null;

    const paintOpts = (): GalleryPaintOpts => ({
      ...opts,
      deletingId,
      onRequestDelete: (item) => {
        void runDelete(item);
      },
    });

    const filtered = (): MediaListItem[] => {
      const q = query.trim().toLowerCase();
      if (!q) {
        return opts.items;
      }
      return opts.items.filter((item) => {
        const hay = `${item.name} ${item.mime ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    };

    const paintResults = (): void => {
      if (!resultsHost) {
        return;
      }
      mount(resultsHost, resultsBody());
    };

    const runDelete = async (item: MediaListItem): Promise<void> => {
      if (!opts.onDelete || deletingId) {
        return;
      }
      const msg = opts.labels.deleteConfirm.replaceAll('{name}', item.name);
      if (!globalThis.confirm(msg)) {
        return;
      }
      deletingId = item.id;
      paintResults();
      try {
        await opts.onDelete(item);
      } finally {
        deletingId = null;
        paintResults();
      }
    };

    const resultsBody = (): ViewSpec => {
      if (opts.error) {
        return statusCard(
          'error',
          opts.labels.failed,
          opts.error,
          opts.labels.refresh,
          opts.onRefresh
        );
      }
      if (opts.loading) {
        return statusCard('loading', opts.labels.loading);
      }
      if (opts.items.length === 0) {
        return statusCard('empty', opts.labels.empty);
      }
      const items = filtered();
      if (items.length === 0) {
        return statusCard('empty', opts.labels.noMatches);
      }
      const po = paintOpts();
      return opts.mode === 'grid' ? gridView(items, po) : listView(items, po);
    };

    const toolbar = (): ViewSpec =>
      h('div', { class: 'flex flex-col gap-2 sm:flex-row sm:items-center' }, [
        h('div', { class: 'relative min-w-0 flex-1' }, [
          h('input', {
            class:
              'w-full rounded-xl border border-ocm-border bg-ocm-surface py-2 pl-3 pr-9 text-sm text-ocm-text shadow-sm placeholder:text-ocm-text-muted focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30',
            attrs: {
              type: 'search',
              value: query,
              placeholder: opts.labels.searchPlaceholder,
              'aria-label': opts.labels.search,
              'data-ocm-gallery-search': '1',
              autocomplete: 'off',
              spellcheck: 'false',
            },
            on: {
              input: (e) => {
                const el = e.target;
                if (el instanceof HTMLInputElement) {
                  query = el.value;
                  paintResults();
                  updateCount();
                  updateClear();
                }
              },
            },
          }),
          h(
            'button',
            {
              class:
                'absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ocm-text-muted hover:bg-ocm-surface-muted hover:text-ocm-text',
              attrs: {
                type: 'button',
                title: opts.labels.search,
                'data-ocm-gallery-clear': '1',
                hidden: 'true',
              },
              props: { innerHTML: clearIcon },
              on: {
                click: () => {
                  query = '';
                  const input = host.querySelector<HTMLInputElement>('[data-ocm-gallery-search]');
                  if (input) {
                    input.value = '';
                    input.focus();
                  }
                  paintResults();
                  updateCount();
                  updateClear();
                },
              },
            },
            []
          ),
        ]),
        h('div', { class: 'flex shrink-0 items-center gap-2' }, [
          h(
            'span',
            {
              class: 'text-[11px] tabular-nums text-ocm-text-muted',
              attrs: { 'data-ocm-gallery-count': '1' },
            },
            countLabel()
          ),
          h(
            'button',
            {
              class:
                'inline-flex items-center gap-1.5 rounded-xl border border-ocm-border bg-ocm-surface px-3 py-2 text-xs font-medium text-ocm-text shadow-sm hover:bg-ocm-surface-muted disabled:cursor-not-allowed disabled:opacity-50',
              attrs: {
                type: 'button',
                ...(opts.loading ? { disabled: 'true' } : {}),
              },
              on: {
                click: () => {
                  opts.onRefresh();
                },
              },
            },
            opts.labels.refresh
          ),
        ]),
      ]);

    const countLabel = (): string => {
      if (opts.loading || opts.error || opts.items.length === 0) {
        return '';
      }
      const n = filtered().length;
      return opts.labels.results.replace('{n}', String(n));
    };

    const updateCount = (): void => {
      const el = host.querySelector('[data-ocm-gallery-count]');
      if (el) {
        el.textContent = countLabel();
      }
    };

    const updateClear = (): void => {
      const btn = host.querySelector<HTMLButtonElement>('[data-ocm-gallery-clear]');
      if (!btn) {
        return;
      }
      btn.hidden = query.trim().length === 0;
    };

    const shell = mount(
      host,
      h('div', { class: 'flex flex-col gap-3' }, [
        toolbar(),
        h('div', {
          class: 'min-h-[220px]',
          ref: 'results',
        }),
      ])
    );
    scope.own(shell);
    resultsHost = shell.refs.results instanceof HTMLElement ? shell.refs.results : null;
    paintResults();
  });
}

function gridView(items: MediaListItem[], opts: GalleryPaintOpts): ViewSpec {
  return h(
    'div',
    {
      class:
        'grid max-h-[min(420px,50vh)] grid-cols-2 gap-2.5 overflow-y-auto p-0.5 sm:grid-cols-3 md:grid-cols-4',
      attrs: { role: 'listbox', 'aria-label': opts.labels.search },
    },
    items.map((item) => {
      const busy = opts.deletingId === item.id;
      return h(
        'div',
        {
          class:
            'group relative aspect-square overflow-hidden rounded-xl border border-ocm-border bg-zinc-100 text-left shadow-sm transition hover:border-sky-500 hover:shadow-md dark:bg-zinc-800',
          attrs: { role: 'option' },
        },
        [
          h(
            'button',
            {
              class:
                'absolute inset-0 z-0 block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
              attrs: {
                type: 'button',
                title: item.name,
                ...(busy ? { disabled: 'true' } : {}),
              },
              on: {
                click: () => {
                  if (!busy) {
                    opts.onSelect(item);
                  }
                },
              },
            },
            [
              img({
                class:
                  'h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]',
                src: item.thumbUrl || item.url,
                alt: item.name,
                attrs: { loading: 'lazy', draggable: 'false' },
              }),
              h(
                'div',
                {
                  class:
                    'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-2 pt-8',
                },
                [
                  h(
                    'p',
                    { class: 'truncate text-[11px] font-medium text-white drop-shadow' },
                    item.name
                  ),
                  item.size !== undefined
                    ? h(
                        'p',
                        { class: 'truncate text-[10px] text-white/80' },
                        opts.formatSize(item.size)
                      )
                    : null,
                ]
              ),
              h(
                'span',
                {
                  class:
                    'pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-sky-600/95 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100',
                },
                opts.labels.insert
              ),
            ]
          ),
          opts.onDelete
            ? h(
                'button',
                {
                  class:
                    'absolute right-1.5 top-1.5 z-10 inline-flex size-7 items-center justify-center rounded-md bg-black/55 text-white opacity-0 shadow transition hover:bg-red-600 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60',
                  attrs: {
                    type: 'button',
                    title: opts.labels.delete,
                    'aria-label': opts.labels.delete,
                    ...(busy ? { disabled: 'true' } : {}),
                  },
                  props: { innerHTML: deleteIcon },
                  on: {
                    click: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      opts.onRequestDelete(item);
                    },
                  },
                },
                []
              )
            : null,
          busy
            ? h(
                'div',
                {
                  class:
                    'absolute inset-0 z-20 flex items-center justify-center bg-black/45 text-[11px] font-medium text-white',
                },
                opts.labels.deleting
              )
            : null,
        ]
      );
    })
  );
}

function listView(items: MediaListItem[], opts: GalleryPaintOpts): ViewSpec {
  return h(
    'ul',
    {
      class:
        'max-h-[min(420px,50vh)] divide-y divide-ocm-border overflow-y-auto rounded-xl border border-ocm-border bg-ocm-surface',
      attrs: { role: 'listbox', 'aria-label': opts.labels.search },
    },
    items.map((item) => {
      const busy = opts.deletingId === item.id;
      return h(
        'li',
        {
          class: `flex items-center gap-3 px-3 py-2.5 transition ${
            busy
              ? 'opacity-70'
              : 'hover:bg-sky-50/80 focus-within:bg-sky-50/80 dark:hover:bg-sky-950/40'
          }`,
          attrs: { role: 'option' },
        },
        [
          h(
            'button',
            {
              class: 'flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left',
              attrs: {
                type: 'button',
                title: item.name,
                ...(busy ? { disabled: 'true' } : {}),
              },
              on: {
                click: () => {
                  if (!busy) {
                    opts.onSelect(item);
                  }
                },
              },
            },
            [
              h(
                'div',
                {
                  class:
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocm-surface-muted text-ocm-text-muted',
                  props: { innerHTML: mimeGlyph(item.mime) },
                },
                []
              ),
              h('div', { class: 'min-w-0 flex-1' }, [
                h('p', { class: 'truncate text-sm font-medium text-ocm-text' }, item.name),
                h(
                  'p',
                  { class: 'truncate text-[11px] text-ocm-text-muted' },
                  busy ? opts.labels.deleting : metaLine(item, opts.formatSize)
                ),
              ]),
              h(
                'span',
                {
                  class:
                    'shrink-0 rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm',
                },
                opts.labels.insert
              ),
            ]
          ),
          opts.onDelete
            ? h(
                'button',
                {
                  class:
                    'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-ocm-border text-ocm-text-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50',
                  attrs: {
                    type: 'button',
                    title: opts.labels.delete,
                    'aria-label': opts.labels.delete,
                    ...(busy ? { disabled: 'true' } : {}),
                  },
                  props: { innerHTML: deleteIcon },
                  on: {
                    click: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      opts.onRequestDelete(item);
                    },
                  },
                },
                []
              )
            : null,
        ]
      );
    })
  );
}

function statusCard(
  kind: 'loading' | 'empty' | 'error',
  title: string,
  detail?: string,
  actionLabel?: string,
  onAction?: () => void
): ViewSpec {
  const icon = kind === 'error' ? clearIcon : kind === 'loading' ? uploadIcon : imageIcon;
  return h(
    'div',
    {
      class:
        'flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ocm-border bg-ocm-surface-muted/40 px-6 py-10 text-center',
    },
    [
      h('div', {
        class: `flex h-12 w-12 items-center justify-center rounded-2xl ${
          kind === 'error'
            ? 'bg-red-100 text-red-600'
            : 'bg-ocm-surface text-ocm-text-muted shadow-sm'
        } [&>svg]:h-6 [&>svg]:w-6 ${kind === 'loading' ? 'animate-pulse' : ''}`,
        props: { innerHTML: icon },
      }),
      h(
        'p',
        {
          class: `text-sm font-medium ${kind === 'error' ? 'text-red-600' : 'text-ocm-text'}`,
        },
        title
      ),
      detail ? h('p', { class: 'max-w-sm text-xs text-ocm-text-muted' }, detail) : null,
      actionLabel && onAction
        ? h(
            'button',
            {
              class:
                'mt-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700',
              attrs: { type: 'button' },
              on: { click: onAction },
            },
            actionLabel
          )
        : null,
    ]
  );
}

function metaLine(item: MediaListItem, formatSize: (n: number) => string): string {
  const parts: string[] = [];
  if (item.mime) {
    parts.push(shortMime(item.mime));
  }
  if (item.size !== undefined && item.size !== null) {
    parts.push(formatSize(item.size));
  }
  return parts.join(' · ');
}

function shortMime(mime: string): string {
  const sub = mime.split('/')[1];
  return (sub ?? mime).toUpperCase();
}

function mimeGlyph(mime: string | undefined): string {
  if (mime?.startsWith('image/')) {
    return imageIcon;
  }
  return fileIcon;
}
