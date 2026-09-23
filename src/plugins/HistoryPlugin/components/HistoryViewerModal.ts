import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { HistoryState } from '../types';
import { formatClock, formatTimestamp } from '../utils/formatters';
import { computeDiff } from '../utils/diff';
import type { DiffChange } from '../utils/diff';

function diffStats(changes: DiffChange[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const c of changes) {
    if (!c.value?.trim()) {
      continue;
    }
    if (c.type === 'add') {
      added += c.value.length;
    } else if (c.type === 'remove') {
      removed += c.value.length;
    }
  }
  return { added, removed };
}

/** Large history viewer — timeline + diff, restore in footer. */
export class HistoryViewerModal {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private states: HistoryState[] = [];
  private currentIndex = -1;
  private selectedIndex = -1;
  private onRestore: ((content: string) => void) | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private t(key: string, params?: Record<string, string | number | boolean>): string {
    return this.editor.t(key, params);
  }

  private selectedState(): HistoryState | null {
    return this.states[this.selectedIndex] ?? null;
  }

  private diffChildren(changes: DiffChange[]): ViewSpec[] {
    return changes.map((change) => {
      if (change.type === 'add') {
        return h('span', { class: 'hv-diff__add' }, change.value);
      }
      if (change.type === 'remove') {
        return h('span', { class: 'hv-diff__remove' }, change.value);
      }
      return change.value;
    });
  }

  private timelineSpec(): ViewSpec {
    // Newest first
    const order = this.states.map((_, i) => i).toReversed();

    if (order.length === 0) {
      return h('div', { class: 'hv-empty' }, this.t('history.empty'));
    }

    return h(
      'div',
      { class: 'hv-timeline', attrs: { role: 'list' } },
      order.map((index) => {
        const state = this.states[index];
        const isCurrent = index === this.currentIndex;
        const isSelected = index === this.selectedIndex;
        const classes = ['hv-item', isCurrent ? 'is-current' : '', isSelected ? 'is-selected' : '']
          .filter(Boolean)
          .join(' ');

        return h(
          'button',
          {
            class: classes,
            attrs: {
              type: 'button',
              role: 'listitem',
              'data-index': String(index),
            },
            on: {
              click: () => {
                this.selectedIndex = index;
                this.refresh();
              },
            },
          },
          [
            h('span', { class: 'hv-item__rail', attrs: { 'aria-hidden': 'true' } }, [
              h('span', { class: 'hv-item__dot' }),
            ]),
            h('span', { class: 'hv-item__body' }, [
              h('span', { class: 'hv-item__row' }, [
                h(
                  'span',
                  { class: 'hv-item__title' },
                  this.t('history.versionN', { n: index + 1 })
                ),
                isCurrent ? h('span', { class: 'hv-badge' }, this.t('history.current')) : null,
              ]),
              h('span', { class: 'hv-item__meta' }, [
                formatTimestamp(state.timestamp, (k, p) => this.t(k, p)),
                h('span', { class: 'hv-item__sep' }, '·'),
                formatClock(state.timestamp),
              ]),
            ]),
          ]
        );
      })
    );
  }

  private detailSpec(): ViewSpec {
    const index = this.selectedIndex >= 0 ? this.selectedIndex : this.currentIndex;
    const state = this.states[index];
    if (state === undefined) {
      return h('div', { class: 'hv-empty' }, this.t('history.empty'));
    }

    const previous = index > 0 ? (this.states[index - 1]?.content ?? '') : '';
    const changes = computeDiff(previous, state.content);
    const stats = diffStats(changes);
    const isInitial = index === 0;
    const isCurrent = index === this.currentIndex;

    return h('div', { class: 'hv-detail' }, [
      h('div', { class: 'hv-detail__head' }, [
        h('div', { class: 'hv-detail__titles' }, [
          h('div', { class: 'hv-detail__title' }, this.t('history.versionN', { n: index + 1 })),
          h('div', { class: 'hv-detail__sub' }, [
            formatTimestamp(state.timestamp, (k, p) => this.t(k, p)),
            isCurrent ? h('span', { class: 'hv-badge' }, this.t('history.current')) : null,
          ]),
        ]),
        h('div', { class: 'hv-stats' }, [
          isInitial
            ? h('span', { class: 'hv-stat hv-stat--muted' }, this.t('history.initialVersion'))
            : [
                h(
                  'span',
                  { class: 'hv-stat hv-stat--add' },
                  this.t('history.charsAdded', { n: stats.added })
                ),
                h(
                  'span',
                  { class: 'hv-stat hv-stat--remove' },
                  this.t('history.charsRemoved', { n: stats.removed })
                ),
              ],
        ]),
      ]),
      h('div', { class: 'hv-diff' }, [
        h(
          'div',
          { class: 'hv-diff__label' },
          isInitial ? this.t('history.initialVersion') : this.t('history.changesFromPrevious')
        ),
        h('div', { class: 'hv-diff__content' }, ...this.diffChildren(changes)),
      ]),
    ]);
  }

  private rootView(): ViewSpec {
    const total = this.states.length;
    return h('div', { class: 'hv-shell' }, [
      h('aside', { class: 'hv-sidebar' }, [
        h('div', { class: 'hv-sidebar__head' }, [
          h('div', { class: 'hv-sidebar__title' }, this.t('history.versions')),
          h('div', { class: 'hv-sidebar__count' }, this.t('history.versionCount', { n: total })),
        ]),
        this.timelineSpec(),
      ]),
      h('main', { class: 'hv-main' }, [this.detailSpec()]),
    ]);
  }

  private popupOptions() {
    const selected = this.selectedState();
    const canRestore =
      selected !== null && this.selectedIndex !== this.currentIndex && this.selectedIndex >= 0;

    return {
      title: this.t('history.editHistory'),
      className: 'history-viewer-modal',
      size: 'lg' as const,
      closeOnClickOutside: true,
      items: [{ type: 'view' as const, id: 'history-viewer', view: () => this.rootView() }],
      buttons: [
        {
          label: this.t('history.close'),
          variant: 'secondary' as const,
          onClick: () => {},
        },
        ...(canRestore
          ? [
              {
                label: this.t('history.restore'),
                variant: 'primary' as const,
                onClick: () => {
                  this.onRestore?.(selected.content);
                },
              },
            ]
          : []),
      ],
    };
  }

  private refresh(): void {
    this.popups.update(this.popupOptions());
  }

  public show(
    states: HistoryState[],
    currentIndex: number,
    onRestore: (content: string) => void
  ): void {
    this.states = states;
    this.currentIndex = currentIndex;
    this.selectedIndex = currentIndex;
    this.onRestore = onRestore;
    this.popups.open(this.popupOptions());
  }
}
