import { h, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { Calendar, CreateCalendarData } from '../types';

/** Calendar form — ViewSpec only. */
export class CalendarForm {
  private readonly editor: EditorAPI;
  private readonly onSubmit: (data: CreateCalendarData) => void;
  private readonly draft: { title: string; description: string };
  private mountHandle: MountHandle | null = null;

  constructor(
    editor: EditorAPI,
    onSubmit: (data: CreateCalendarData) => void,
    calendar?: Calendar
  ) {
    this.editor = editor;
    this.onSubmit = onSubmit;
    this.draft = {
      title: calendar?.title ?? '',
      description: calendar?.description ?? '',
    };
  }

  view(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return h('div', { class: 'calendar-form-container space-y-3' }, [
      h('div', { class: 'form-group' }, [
        h('label', { attrs: { for: 'calendar-title' } }, t('calendar.calendarTitle')),
        h('input', {
          class: 'w-full p-2 border rounded',
          attrs: { id: 'calendar-title', type: 'text', required: true },
          props: { value: this.draft.title },
          on: {
            input: (e) => {
              const inputEl = e.target;
              if (inputEl instanceof HTMLInputElement) {
                this.draft.title = inputEl.value;
              }
            },
          },
        }),
      ]),
      h('div', { class: 'form-group' }, [
        h('label', { attrs: { for: 'calendar-description' } }, t('common.description')),
        h('textarea', {
          class: 'w-full p-2 border rounded',
          attrs: { id: 'calendar-description', rows: 3 },
          props: { value: this.draft.description },
          on: {
            input: (e) => {
              const inputEl = e.target;
              if (inputEl instanceof HTMLTextAreaElement) {
                this.draft.description = inputEl.value;
              }
            },
          },
        }),
      ]),
    ]);
  }

  mountInto(host: HTMLElement): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view());
  }

  submit(): boolean {
    if (!this.draft.title.trim()) {
      this.editor.notify(this.editor.t('common.titleIsRequired'));
      return false;
    }
    this.onSubmit({
      title: this.draft.title.trim(),
      description: this.draft.description,
    });
    return true;
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
  }
}
