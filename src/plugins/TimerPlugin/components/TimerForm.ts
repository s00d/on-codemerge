import type { EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { h, mount } from '@on-codemerge/sdk';
import type { MountHandle } from '@on-codemerge/sdk';
import type { Timer, CreateTimerData } from '../types';

/** Timer form — ViewSpec only (no helpers / getElement). */
export class TimerForm {
  private readonly editor: EditorAPI;
  private readonly onSubmit: (data: CreateTimerData) => void;
  private readonly draft: {
    title: string;
    description: string;
    date: string;
    time: string;
    color: string;
    category: string;
    tags: string;
  };
  private mountHandle: MountHandle | null = null;

  constructor(editor: EditorAPI, onSubmit: (data: CreateTimerData) => void, timer?: Timer) {
    this.editor = editor;
    this.onSubmit = onSubmit;
    this.draft = {
      title: timer?.title ?? '',
      description: timer?.description ?? '',
      date: timer?.targetDate ? timer.targetDate.toISOString().slice(0, 10) : '',
      time: timer?.targetTime ?? '',
      color: timer?.color ?? '#3b82f6',
      category: timer?.category ?? '',
      tags: timer?.tags?.join(', ') ?? '',
    };
  }

  private field(
    id: string,
    label: string,
    type: string,
    value: string,
    onInput: (v: string) => void,
    extra: Record<string, string | number | boolean | null | undefined> = {}
  ): ViewSpec {
    return h('div', { class: 'form-group mb-3' }, [
      h('label', { attrs: { for: id } }, label),
      type === 'textarea'
        ? h('textarea', {
            class: 'w-full p-2 border rounded',
            attrs: { id, rows: 3, placeholder: label },
            props: { value },
            on: {
              input: (e) => {
                onInput((e.target as HTMLTextAreaElement).value);
              },
            },
          })
        : h('input', {
            class: 'w-full p-2 border rounded',
            attrs: { id, type, placeholder: label, ...extra },
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
    return h('div', { class: 'timer-form-container space-y-2' }, [
      this.field('title', t('common.title'), 'text', this.draft.title, (v) => {
        this.draft.title = v;
      }),
      this.field(
        'description',
        t('common.description'),
        'textarea',
        this.draft.description,
        (v) => {
          this.draft.description = v;
        }
      ),
      this.field('targetDate', t('common.targetDate'), 'date', this.draft.date, (v) => {
        this.draft.date = v;
      }),
      this.field('targetTime', t('common.targetTime'), 'time', this.draft.time, (v) => {
        this.draft.time = v;
      }),
      this.field('color', t('common.color'), 'color', this.draft.color, (v) => {
        this.draft.color = v;
      }),
      this.field('category', t('common.category'), 'text', this.draft.category, (v) => {
        this.draft.category = v;
      }),
      this.field('tags', t('common.tagsCommaSeparated'), 'text', this.draft.tags, (v) => {
        this.draft.tags = v;
      }),
    ]);
  }

  mountInto(host: HTMLElement): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view());
  }

  submit(): void {
    const { title, description, date, time, color, category, tags } = this.draft;
    if (!title.trim()) {
      this.editor.notify(this.editor.t('common.titleIsRequired'));
      return;
    }
    if (!date) {
      this.editor.notify(this.editor.t('common.targetDateIsRequired'));
      return;
    }
    if (!time) {
      this.editor.notify(this.editor.t('common.targetTimeIsRequired'));
      return;
    }
    const targetDate = new Date(`${date}T${time}`);
    if (isNaN(targetDate.getTime())) {
      this.editor.notify(this.editor.t('formBuilder.invalidDateTimeFormat'));
      return;
    }
    const data: CreateTimerData = {
      title,
      description,
      targetDate,
      targetTime: time,
      color: color || '#3b82f6',
      category,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    this.onSubmit(data);
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
  }
}
