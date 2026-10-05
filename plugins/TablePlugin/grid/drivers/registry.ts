import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import type { CellValue, TableColumn } from '../../io/adapters';
import { parseTableBoolean } from '../../io/adapters';
import { stringifyCell } from '../../io/matrix';
import { lineCountInText, ROW_LINE_CAP } from '../viewport';

export type CellRenderCtx = {
  value: CellValue;
  column: TableColumn;
  rowId: string;
  selected: boolean;
  editing: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  onChange: (value: CellValue) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onCommitEnter?: () => void;
};

let cellPaintDepth = 0;

/** While the grid remounts cells, ignore input blur so edit mode is not cancelled. */
export function runCellPaint(fn: () => void): void {
  cellPaintDepth++;
  try {
    fn();
  } finally {
    cellPaintDepth--;
  }
}

function commitField(
  ctx: CellRenderCtx,
  isNumber: boolean,
  el: HTMLInputElement | HTMLTextAreaElement
): void {
  if (isNumber && el instanceof HTMLInputElement) {
    const n = el.valueAsNumber;
    ctx.onChange(Number.isFinite(n) ? n : el.value);
    return;
  }
  ctx.onChange(el.value);
}

const FIELD =
  'w-full min-w-0 rounded-ocm-sm border border-ocm-accent bg-ocm-input px-1.5 font-mono text-[13px] text-ocm-text outline-none';
const INPUT = `h-7 ${FIELD}`;

function alignClass(align: CellRenderCtx['align']): string {
  if (align === 'center') {
    return 'justify-center text-center';
  }
  if (align === 'right') {
    return 'justify-end text-right';
  }
  return 'justify-start text-left';
}

function displayButton(ctx: CellRenderCtx, extraClass = ''): ViewSpec {
  const colorStyle = ctx.color ? { color: ctx.color } : undefined;
  const text = stringifyCell(ctx.value);
  const multiline = text.includes('\n');
  return h(
    'button',
    {
      class: `flex w-full min-w-0 overflow-hidden whitespace-pre-wrap rounded-ocm-sm border px-1.5 font-mono text-[13px] ${
        multiline ? 'h-full min-h-7 items-start py-1 leading-5' : 'h-7 items-center'
      } ${alignClass(ctx.align)} ${
        ctx.selected
          ? 'border-ocm-accent bg-ocm-accent-soft text-ocm-text'
          : 'border-transparent hover:border-ocm-border'
      } ${extraClass}`,
      style: colorStyle,
      attrs: { type: 'button', title: multiline ? text : undefined },
      on: {
        pointerdown: (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          ctx.onStartEdit();
        },
      },
    },
    text
  );
}

function renderTextLike(ctx: CellRenderCtx, isNumber: boolean): ViewSpec {
  if (ctx.editing && ctx.column.editable !== false) {
    const text = stringifyCell(ctx.value);
    const align =
      ctx.align === 'center' ? 'text-center' : ctx.align === 'right' ? 'text-right' : 'text-left';
    if (isNumber) {
      return h('input', {
        class: `${INPUT} tabular-nums ${align}`,
        style: ctx.color ? { color: ctx.color } : undefined,
        attrs: {
          type: 'number',
          'aria-label': `${ctx.column.title} cell`,
          'data-ocm-cell-edit': 'true',
        },
        props: { value: text },
        on: cellEditEvents(ctx, true),
      });
    }
    const lines = Math.min(ROW_LINE_CAP, Math.max(1, lineCountInText(text)));
    return h('textarea', {
      class: `${FIELD} h-full min-h-7 resize-none overflow-auto py-1 leading-5 ${align}`,
      style: ctx.color ? { color: ctx.color } : undefined,
      attrs: {
        rows: lines,
        'aria-label': `${ctx.column.title} cell`,
        'data-ocm-cell-edit': 'true',
      },
      props: { value: text },
      on: cellEditEvents(ctx, false),
    });
  }
  return displayButton(ctx);
}

function cellEditEvents(
  ctx: CellRenderCtx,
  isNumber: boolean
): Record<string, (ev: Event) => void> {
  return {
    change: (ev) => {
      const t = ev.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
        commitField(ctx, isNumber, t);
      }
    },
    input: (ev) => {
      if (isNumber) {
        return;
      }
      const t = ev.target;
      if (!(t instanceof HTMLTextAreaElement)) {
        return;
      }
      if (lineCountInText(t.value) !== lineCountInText(stringifyCell(ctx.value))) {
        commitField(ctx, false, t);
      }
    },
    keydown: (ev) => {
      if (!(ev instanceof KeyboardEvent)) {
        return;
      }
      if (ev.key === 'Enter' && ev.shiftKey && !isNumber) {
        ev.stopPropagation();
        return;
      }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        ev.stopPropagation();
        const t = ev.target;
        if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
          commitField(ctx, isNumber, t);
        }
        ctx.onEndEdit();
        ctx.onCommitEnter?.();
        return;
      }
      if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
      }
    },
    blur: () => {
      if (cellPaintDepth > 0) {
        return;
      }
      ctx.onEndEdit();
    },
  };
}

function renderBoolean(ctx: CellRenderCtx): ViewSpec {
  return h(
    'div',
    {
      class: `flex w-full ${
        ctx.align === 'center'
          ? 'justify-center'
          : ctx.align === 'right'
            ? 'justify-end'
            : 'justify-start'
      }`,
    },
    h('input', {
      class: 'size-4',
      attrs: {
        type: 'checkbox',
        'aria-label': `${ctx.column.title} cell`,
        disabled: ctx.column.editable === false ? true : undefined,
      },
      props: { checked: parseTableBoolean(ctx.value) },
      on: {
        change: (ev) => {
          const t = ev.target;
          if (t instanceof HTMLInputElement) {
            ctx.onChange(t.checked);
          }
        },
      },
    })
  );
}

export function renderCell(ctx: CellRenderCtx): ViewSpec {
  if (ctx.column.type === 'boolean') {
    return renderBoolean(ctx);
  }
  return renderTextLike(ctx, ctx.column.type === 'number');
}
