import { h, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { CalendarEvent, CreateEventData } from '../types';
import { colorSwatchButton } from '../../../utils/ColorWell';

type CategoryManagerLike = {
  getCategories: () => { id: string; name: string }[];
};

function splitCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x !== '');
}

/** Event form — ViewSpec only. */
export class EventForm {
  private readonly editor: EditorAPI;
  private readonly onSubmit: (data: CreateEventData) => void;
  private readonly categoryManager?: CategoryManagerLike;
  private readonly draft: {
    title: string;
    description: string;
    date: string;
    time: string;
    duration: string;
    color: string;
    priority: string;
    category: string;
    location: string;
    attendees: string;
    tags: string;
    reminder: string;
    isAllDay: boolean;
  };
  private mountHandle: MountHandle | null = null;

  constructor(
    editor: EditorAPI,
    onSubmit: (data: CreateEventData) => void,
    event?: CalendarEvent,
    categoryManager?: CategoryManagerLike
  ) {
    this.editor = editor;
    this.onSubmit = onSubmit;
    this.categoryManager = categoryManager;
    this.draft = {
      title: event?.title ?? '',
      description: event?.description ?? '',
      date: event?.date ?? '',
      time: event?.time ?? '',
      duration: String(event?.duration ?? 60),
      color: event?.color ?? '#3b82f6',
      priority: event?.priority ?? 'medium',
      category: event?.category ?? '',
      location: event?.location ?? '',
      attendees: event?.attendees?.join(', ') ?? '',
      tags: event?.tags?.join(', ') ?? '',
      reminder: (() => {
        const r = event?.reminder;
        return r === null || r === undefined ? '' : String(r);
      })(),
      isAllDay: event?.isAllDay ?? false,
    };
  }

  private input(
    id: string,
    label: string,
    type: string,
    value: string,
    onInput: (v: string) => void,
    extra: Record<string, string | number | boolean | null | undefined> = {}
  ): ViewSpec {
    return h('div', { class: 'form-group mb-3' }, [
      h('label', { attrs: { for: id } }, label),
      h('input', {
        class: 'w-full p-2 border rounded',
        attrs: { id, type, ...extra },
        props: { value },
        on: {
          input: (e) => {
            onInput((e.target as HTMLInputElement).value);
          },
        },
      }),
    ]);
  }

  view(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    const categories = this.categoryManager?.getCategories() ?? [];
    return h('div', { class: 'event-form-container space-y-2' }, [
      this.input('event-title', t('common.title'), 'text', this.draft.title, (v) => {
        this.draft.title = v;
      }),
      h('div', { class: 'form-group mb-3' }, [
        h('label', { attrs: { for: 'event-description' } }, t('common.description')),
        h('textarea', {
          class: 'w-full p-2 border rounded',
          attrs: { id: 'event-description', rows: 3 },
          props: { value: this.draft.description },
          on: {
            input: (e) => {
              this.draft.description = (e.target as HTMLTextAreaElement).value;
            },
          },
        }),
      ]),
      h('div', { class: 'grid grid-cols-2 gap-4' }, [
        this.input('event-date', t('common.date'), 'date', this.draft.date, (v) => {
          this.draft.date = v;
        }),
        this.input('event-time', t('common.time'), 'time', this.draft.time, (v) => {
          this.draft.time = v;
        }),
      ]),
      h('div', { class: 'grid grid-cols-2 gap-4' }, [
        this.input(
          'event-duration',
          t('common.durationMinutes'),
          'number',
          this.draft.duration,
          (v) => {
            this.draft.duration = v;
          },
          { min: 15, step: 15 }
        ),
        h('div', { class: 'form-group mb-3' }, [
          h('label', {}, t('common.color')),
          colorSwatchButton(
            this.editor,
            () => this.draft.color,
            (hex) => {
              this.draft.color = hex;
            }
          ),
        ]),
      ]),
      h('div', { class: 'grid grid-cols-2 gap-4' }, [
        h('div', { class: 'form-group mb-3' }, [
          h('label', { attrs: { for: 'event-priority' } }, t('common.priority')),
          h(
            'select',
            {
              class: 'w-full p-2 border rounded',
              attrs: { id: 'event-priority' },
              props: { value: this.draft.priority },
              on: {
                change: (e) => {
                  this.draft.priority = (e.target as HTMLSelectElement).value;
                },
              },
            },
            h('option', { attrs: { value: 'low' } }, t('common.low')),
            h('option', { attrs: { value: 'medium' } }, t('common.medium')),
            h('option', { attrs: { value: 'high' } }, t('common.high'))
          ),
        ]),
        h('div', { class: 'form-group mb-3' }, [
          h('label', { attrs: { for: 'event-category' } }, t('common.category')),
          h(
            'select',
            {
              class: 'w-full p-2 border rounded',
              attrs: { id: 'event-category' },
              props: { value: this.draft.category },
              on: {
                change: (e) => {
                  this.draft.category = (e.target as HTMLSelectElement).value;
                },
              },
            },
            h('option', { attrs: { value: '' } }, t('common.selectCategory')),
            ...categories.map((cat) => h('option', { attrs: { value: cat.id } }, cat.name))
          ),
        ]),
      ]),
      this.input('event-location', t('common.location'), 'text', this.draft.location, (v) => {
        this.draft.location = v;
      }),
      this.input('event-attendees', t('calendar.attendees'), 'text', this.draft.attendees, (v) => {
        this.draft.attendees = v;
      }),
      this.input('event-tags', t('common.tags'), 'text', this.draft.tags, (v) => {
        this.draft.tags = v;
      }),
      this.input(
        'event-reminder',
        t('calendar.reminderMinutesBefore'),
        'number',
        this.draft.reminder,
        (v) => {
          this.draft.reminder = v;
        },
        { min: 0, placeholder: t('calendar.noReminder') }
      ),
      h('label', { class: 'flex items-center gap-2 mb-3' }, [
        h('input', {
          attrs: { type: 'checkbox', id: 'event-all-day' },
          props: { checked: this.draft.isAllDay },
          on: {
            change: (e) => {
              this.draft.isAllDay = (e.target as HTMLInputElement).checked;
            },
          },
        }),
        t('calendar.allDayEvent'),
      ]),
    ]);
  }

  mountInto(host: HTMLElement): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view());
  }

  submit(): boolean {
    if (!this.draft.title.trim() || !this.draft.date || !this.draft.time) {
      this.editor.notify(this.editor.t('formBuilder.requiredFieldsMissing'));
      return false;
    }
    this.onSubmit({
      title: this.draft.title.trim(),
      description: this.draft.description,
      date: this.draft.date,
      time: this.draft.time,
      duration: Number(this.draft.duration) || 60,
      location: this.draft.location,
      color: this.draft.color,
      isAllDay: this.draft.isAllDay,
      priority: this.draft.priority as 'low' | 'medium' | 'high',
      category: this.draft.category,
      attendees: splitCsv(this.draft.attendees),
      tags: splitCsv(this.draft.tags),
      reminder: this.draft.reminder === '' ? undefined : Math.trunc(Number(this.draft.reminder)),
    });
    return true;
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
  }
}
