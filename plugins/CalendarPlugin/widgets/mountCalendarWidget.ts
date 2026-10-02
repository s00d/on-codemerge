import { h, mount } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle } from '@codemerge/sdk';
import type { CalendarDoc } from '../types';
import { coerceCalendarDoc, emptyCalendarDoc } from '../drivers/defaults';
import { renderView } from '../drivers/views';
import { isCalendarDoc } from '../types';
import { atomAlignStyle } from '@ocm/wysiwyg/utils/atomAlign';

export type MountCalendarWidgetOptions = {
  payload: unknown;
  editor: EditorAPI;
  scope: DisposableScope;
  align?: string;
  onOpenStudio?: () => void;
};

/** Compact in-document calendar preview (selected view from payload). */
export function mountCalendarWidget(
  host: HTMLElement,
  opts: MountCalendarWidgetOptions
): MountHandle {
  host.className = 'ocm-calendar-atom calendar-widget';
  host.style.maxWidth = '28rem';
  Object.assign(host.style, atomAlignStyle(opts.align ?? ''));

  const doc: CalendarDoc = isCalendarDoc(opts.payload)
    ? opts.payload
    : coerceCalendarDoc(opts.payload ?? emptyCalendarDoc());

  const open = () => {
    opts.onOpenStudio?.();
  };

  const body =
    doc.events.length === 0
      ? h(
          'div',
          { class: 'calendar-empty', on: { click: open } },
          opts.editor.t('calendar.noEvents') || 'No events'
        )
      : renderView(doc, {
          i18n: { t: (k) => opts.editor.t(k) || k },
          selectedEventId: null,
          onSelectEvent: () => {
            open();
          },
          onSelectDay: () => {
            open();
          },
          onChangeView: () => {
            open();
          },
        });

  const handle = mount(
    host,
    h(
      'div',
      { class: 'calendar-widget__inner' },
      h('div', { class: 'calendar-header' }, h('div', { class: 'calendar-title' }, doc.title)),
      h('div', { class: 'calendar-body' }, body)
    )
  );
  opts.scope.disposable(() => {
    handle.destroy();
  });
  return handle;
}
