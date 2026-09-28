import { h } from '@on-codemerge/sdk';
import type { ViewSpec } from '@on-codemerge/sdk';
import { BUILD_GROUPS } from '../constants/symbols';
import { insertWithHoles } from '../utils/insertTemplate';

type InsertFn = (template: string) => void;

/** Build-mode palette (structures / ops / greek) — Chart data-tools analog. */
export function mathBuildPanel(onInsert: InsertFn, t: (k: string) => string): ViewSpec {
  return h(
    'div',
    { class: 'math-build-panel flex flex-col gap-3' },
    ...BUILD_GROUPS.map((group) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h(
          'div',
          { class: 'text-xs font-medium uppercase tracking-wide text-ocm-text-muted' },
          t(`math.group.${group.title}`) || group.title
        ),
        h(
          'div',
          { class: 'flex flex-wrap gap-1' },
          ...group.items.map((item) =>
            h(
              'button',
              {
                class:
                  'rounded border border-ocm-border bg-ocm-surface px-2 py-1 text-sm text-ocm-text hover:bg-ocm-surface-hover',
                attrs: { type: 'button', title: item.insert },
                on: {
                  click: () => {
                    onInsert(item.insert);
                  },
                },
              },
              item.label
            )
          )
        ),
      ])
    )
  );
}

export { insertWithHoles };
