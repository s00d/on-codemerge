import type { Timer, CreateTimerData, UpdateTimerData, TimerTimeLeft } from '../types';
import type { EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { h } from '@on-codemerge/sdk';
import { parseJson } from '../../../utils/asAttr';
import { atomAlignStyle } from '../../../utils/atomAlign';

function dateReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function timerSep(): ViewSpec {
  return h('span', { class: 'timer-sep', attrs: { 'aria-hidden': 'true' } }, ':');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStoredTimer(value: unknown): value is Timer & { targetDate: string | Date } {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.targetTime === 'string' &&
    typeof value.isActive === 'boolean' &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number' &&
    (typeof value.targetDate === 'string' || value.targetDate instanceof Date)
  );
}

export class TimerManager {
  private readonly timersKey = 'html-editor-timers';
  private readonly editor: EditorAPI;

  constructor(editor: EditorAPI) {
    this.editor = editor;
  }

  public getTimers(): Timer[] {
    const stored = localStorage.getItem(this.timersKey);
    if (stored === null || stored === undefined || stored === '') {
      return [];
    }

    const parsed = parseJson(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isStoredTimer).map((t) => ({
      ...t,
      targetDate: new Date(t.targetDate),
    }));
  }

  public getTimer(id: string): Timer | null {
    const timers = this.getTimers();
    return timers.find((timer) => timer.id === id) ?? null;
  }

  /** Upsert by id so remounted widgets keep ticking without inventing a new timer. */
  public ensureTimer(timer: Timer): void {
    const timers = this.getTimers();
    const next = {
      ...timer,
      targetDate: timer.targetDate instanceof Date ? timer.targetDate : new Date(timer.targetDate),
    };
    const idx = timers.findIndex((t) => t.id === next.id);
    if (idx === -1) {
      timers.push(next);
    } else {
      timers[idx] = next;
    }
    localStorage.setItem(this.timersKey, JSON.stringify(timers));
  }

  public createTimer(data: CreateTimerData): Timer {
    const timers = this.getTimers();
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
      targetTime: data.targetTime,
      color: data.color ?? '#3b82f6',
      category: data.category,
      tags: data.tags ?? [],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    timers.push(newTimer);
    localStorage.setItem(this.timersKey, JSON.stringify(timers, dateReplacer));
    return newTimer;
  }

  public updateTimer(id: string, data: UpdateTimerData): Timer {
    const timers = this.getTimers();
    const index = timers.findIndex((timer) => timer.id === id);

    if (index === -1) {
      throw new Error('Timer not found');
    }

    const updated: Timer = {
      ...timers[index],
      ...data,
      updatedAt: Date.now(),
    };

    timers[index] = updated;
    localStorage.setItem(this.timersKey, JSON.stringify(timers, dateReplacer));
    return updated;
  }

  public deleteTimer(id: string): void {
    const timers = this.getTimers().filter((timer) => timer.id !== id);
    localStorage.setItem(this.timersKey, JSON.stringify(timers));
  }

  public getTimeLeft(timer: Timer): TimerTimeLeft {
    // Если targetDate это объект Date, используем его напрямую
    let targetDateTime: Date;
    if (timer.targetDate instanceof Date) {
      targetDateTime = timer.targetDate;
    } else {
      // Fallback для старых данных, где targetDate была строкой
      targetDateTime = new Date(`${String(timer.targetDate)}T${timer.targetTime}`);
    }

    const now = new Date();
    const diff = targetDateTime.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  }

  /** Timer widget ViewSpec (editor + publish). */
  public timerView(timer: Timer, opts?: { align?: string }): ViewSpec {
    const timeLeft = this.getTimeLeft(timer);
    const categoryName = (timer.category ?? '').trim();
    const showCategory = categoryName.length > 0;

    let targetDate: Date;
    if (timer.targetDate instanceof Date) {
      targetDate = timer.targetDate;
    } else {
      targetDate = new Date(`${String(timer.targetDate)}T${timer.targetTime}`);
    }

    const formattedTargetDate = targetDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const config = {
      target: targetDate.toISOString(),
      expiredText: this.editor.t('timer.timerExpired'),
    };

    const unit = (suffix: string, value: string, label: string) =>
      h('div', { class: 'timer-unit' }, [
        h(
          'span',
          {
            class: `timer-value timer-${suffix}`,
            attrs: { id: `timer-${suffix}-${timer.id}` },
          },
          value
        ),
        h('span', { class: 'timer-label' }, label),
      ]);

    const countdown = timeLeft.isExpired
      ? h('div', { class: 'timer-expired' }, this.editor.t('timer.timeExpired'))
      : h(
          'div',
          {
            class: 'timer-countdown',
            attrs: { id: `timer-countdown-${timer.id}` },
          },
          [
            unit('days', String(timeLeft.days), this.editor.t('timer.days')),
            timerSep(),
            unit('hours', pad2(timeLeft.hours), this.editor.t('timer.hours')),
            timerSep(),
            unit('minutes', pad2(timeLeft.minutes), this.editor.t('common.min')),
            timerSep(),
            unit('seconds', pad2(timeLeft.seconds), this.editor.t('timer.sec')),
          ]
        );

    const metaBits: ViewSpec[] = [];
    if (timer.description) {
      metaBits.push(h('span', { class: 'timer-description' }, timer.description));
    }
    metaBits.push(
      h('span', { class: 'timer-target-date' }, [
        h('span', { class: 'timer-target-label' }, this.editor.t('common.until')),
        ' ',
        formattedTargetDate,
      ])
    );

    const align = opts?.align ?? '';
    const alignStyle = atomAlignStyle(align);
    const style: Record<string, string> = {
      ...(timer.color ? { ['--timer-color' as string]: timer.color } : {}),
      ...(Object.keys(alignStyle).length > 0 ? { maxWidth: '28rem', ...alignStyle } : {}),
    };

    return h(
      'div',
      {
        class: 'timer-widget not-prose',
        attrs: {
          'data-node': 'timer',
          'data-timer-id': timer.id,
          'data-ocm-runtime': 'timer',
          'data-ocm-config': JSON.stringify(config),
        },
        style: Object.keys(style).length > 0 ? style : undefined,
      },
      [
        h('div', { class: 'timer-top' }, [
          h('div', { class: 'timer-meta' }, [
            h('div', { class: 'timer-title-row' }, [
              h('div', { class: 'timer-title' }, timer.title),
              showCategory ? h('div', { class: 'timer-category' }, categoryName) : null,
            ]),
            h('div', { class: 'timer-sub' }, metaBits),
          ]),
          countdown,
        ]),
        timer.tags && timer.tags.length > 0
          ? h(
              'div',
              { class: 'timer-tags' },
              timer.tags.map((tag) => h('span', { class: 'timer-tag' }, tag))
            )
          : null,
      ]
    );
  }

  public exportTimer(id: string): string {
    const timer = this.getTimer(id);
    if (!timer) {
      throw new Error('Timer not found');
    }

    const exportData = {
      timer,
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importTimer(data: string): Timer {
    try {
      const importData = parseJson(data);
      if (
        importData === null ||
        importData === undefined ||
        typeof importData !== 'object' ||
        Array.isArray(importData)
      ) {
        throw new Error('Invalid timer data format');
      }
      const timer = (importData as { timer?: CreateTimerData }).timer;
      if (timer === null || timer === undefined) {
        throw new Error('Invalid timer data format');
      }

      return this.createTimer({
        title: timer.title,
        description: timer.description,
        targetDate: timer.targetDate,
        targetTime: timer.targetTime,
        color: timer.color,
        category: timer.category,
        tags: timer.tags,
      });
    } catch (error) {
      throw new Error('Invalid timer data format', { cause: error });
    }
  }

  public copyTimer(id: string): Timer {
    const originalTimer = this.getTimer(id);
    if (!originalTimer) {
      throw new Error('Timer not found');
    }

    return this.createTimer({
      title: `${originalTimer.title} (Копия)`,
      description: originalTimer.description,
      targetDate: originalTimer.targetDate,
      targetTime: originalTimer.targetTime,
      color: originalTimer.color,
      category: originalTimer.category,
      tags: originalTimer.tags,
    });
  }
}
