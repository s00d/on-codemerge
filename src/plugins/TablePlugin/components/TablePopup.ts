import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';

export interface TableInsertOptions {
  rows: number;
  cols: number;
  hasHeader: boolean;
}

const GRID = 8;

/**
 * Compact insert-table picker: hover grid + header toggle + size label.
 */
export class TablePopup {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private hasHeader = false;
  private callback: ((options: TableInsertOptions) => void) | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private content(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return h('div', { class: 'table-picker' }, [
      h(
        'label',
        { class: 'table-picker__option' },
        h('input', {
          attrs: { type: 'checkbox', id: 'tableHeader' },
          on: {
            change: (e) => {
              const input = e.target;
              this.hasHeader = input instanceof HTMLInputElement ? input.checked : false;
            },
          },
        }),
        t('table.includeHeaderRow')
      ),
      foreign((host, scope) => {
        let selectedRows = 0;
        let selectedCols = 0;
        const cells: HTMLElement[] = [];
        let labelEl: HTMLElement | null = null;

        const paint = (rows: number, cols: number) => {
          selectedRows = rows;
          selectedCols = cols;
          if (labelEl) {
            labelEl.textContent =
              rows > 0 && cols > 0 ? `${rows} × ${cols}` : t('Hover to select size');
          }
          cells.forEach((cell, i) => {
            const r = Math.floor(i / GRID) + 1;
            const c = (i % GRID) + 1;
            cell.classList.toggle('is-active', r <= rows && c <= cols);
          });
        };

        const handle = mount(
          host,
          h('div', { class: 'table-picker__body' }, [
            h(
              'div',
              {
                class: 'table-picker__grid',
                attrs: { role: 'grid', 'aria-label': t('Table size') },
                on: {
                  mousemove: (e) => {
                    const from = e.target instanceof Element ? e.target : null;
                    const cell = from?.closest('.table-picker__cell') ?? null;
                    if (!(cell instanceof HTMLElement)) {
                      return;
                    }
                    const index = cells.indexOf(cell);
                    if (index === -1) {
                      return;
                    }
                    paint(Math.floor(index / GRID) + 1, (index % GRID) + 1);
                  },
                  mouseleave: () => {
                    paint(0, 0);
                  },
                  click: () => {
                    if (selectedRows < 1 || selectedCols < 1) {
                      return;
                    }
                    this.callback?.({
                      rows: selectedRows,
                      cols: selectedCols,
                      hasHeader: this.hasHeader,
                    });
                    this.popups.close();
                  },
                },
              },
              ...Array.from({ length: GRID * GRID }, (_, i) =>
                h('button', {
                  class: 'table-picker__cell',
                  attrs: { type: 'button', tabindex: -1 },
                  ref: `cell-${i}`,
                })
              )
            ),
            h('div', { class: 'table-picker__label', ref: 'label' }, t('Hover to select size')),
          ])
        );

        for (let i = 0; i < GRID * GRID; i++) {
          const cell = handle.refs[`cell-${i}`];
          // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
          if (cell) {
            cells.push(cell);
          }
        }
        labelEl = handle.refs.label ?? null;
        scope.own(handle);
      }),
    ]);
  }

  public show(callback: (options: TableInsertOptions) => void): void {
    this.callback = callback;
    this.hasHeader = false;
    this.popups.open({
      title: this.editor.t('table.insert'),
      className: 'table-popup',
      size: 'sm',
      closeOnClickOutside: true,
      items: [{ type: 'view', id: 'table-grid', view: () => this.content() }],
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
      ],
    });
  }
}
