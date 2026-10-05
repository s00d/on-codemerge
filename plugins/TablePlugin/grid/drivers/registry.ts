import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import type { CellValue, TableColumn } from '../../io/adapters';
import { parseTableBoolean } from '../../io/adapters';
import { stringifyCell } from '../../io/matrix';

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
};

const INPUT =
  'h-7 w-full min-w-0 rounded-ocm-sm border border-sky-500 bg-ocm-surface px-1.5 font-mono text-[13px] outline-none';

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
  return h(
    'button',
    {
      class: `flex h-7 w-full min-w-0 items-center truncate rounded-ocm-sm border px-1.5 font-mono text-[13px] ${alignClass(
        ctx.align
      )} ${
        ctx.selected ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-ocm-border'
      } ${extraClass}`,
      style: colorStyle,
      attrs: { type: 'button' },
      on: {
        click: () => {
          ctx.onStartEdit();
        },
        dblclick: () => {
          ctx.onStartEdit();
        },
      },
    },
    stringifyCell(ctx.value)
  );
}

function renderTextLike(ctx: CellRenderCtx, isNumber: boolean): ViewSpec {
  if (ctx.editing && ctx.column.editable !== false) {
    return h('input', {
      class: `${isNumber ? `${INPUT} tabular-nums` : INPUT} ${
        ctx.align === 'center' ? 'text-center' : ctx.align === 'right' ? 'text-right' : 'text-left'
      }`,
      style: ctx.color ? { color: ctx.color } : undefined,
      attrs: {
        type: isNumber ? 'number' : 'text',
        'aria-label': `${ctx.column.title} cell`,
        autofocus: true,
      },
      props: { value: stringifyCell(ctx.value) },
      on: {
        change: (ev) => {
          const t = ev.target;
          if (!(t instanceof HTMLInputElement)) {
            return;
          }
          if (isNumber) {
            const n = t.valueAsNumber;
            ctx.onChange(Number.isFinite(n) ? n : t.value);
          } else {
            ctx.onChange(t.value);
          }
        },
        blur: () => {
          ctx.onEndEdit();
        },
      },
    });
  }
  return displayButton(ctx);
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
