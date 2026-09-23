import { definePublishRuntime, readOcmConfig } from '../../../../packages/sdk/src/publish';

export interface ReminderPublishItem {
  id: string;
  triggerTime: number;
  message: string;
  title?: string;
}

export interface CalendarRemindersPublishConfig {
  reminders: ReminderPublishItem[];
  pollMs?: number;
  dismissMs?: number;
}

function ensureContainer(): HTMLElement {
  let container = document.querySelector<HTMLElement>('.calendar-reminders-container');
  if (container) {
    return container;
  }
  container = document.createElement('div');
  container.className = 'calendar-reminders-container';
  container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;max-width:400px';
  document.body.append(container);
  return container;
}

function showToast(item: ReminderPublishItem, dismissMs: number): void {
  const existing = document.querySelectorAll('[data-reminder-id]');
  for (const node of existing) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (node.dataset.reminderId === item.id) {
      return;
    }
  }
  const root = document.createElement('div');
  root.className = 'calendar-reminder';
  root.dataset.reminderId = item.id;

  const header = document.createElement('div');
  header.className = 'reminder-header';

  const icon = document.createElement('div');
  icon.className = 'reminder-icon';
  icon.textContent = '⏰';

  const title = document.createElement('div');
  title.className = 'reminder-title';
  title.textContent = item.title ?? 'Event Reminder';

  const close = document.createElement('button');
  close.className = 'reminder-close';
  close.type = 'button';
  close.textContent = '×';
  close.addEventListener('click', () => {
    root.remove();
  });

  header.append(icon, title, close);

  const content = document.createElement('div');
  content.className = 'reminder-content';
  const message = document.createElement('div');
  message.className = 'reminder-message';
  message.textContent = item.message;
  content.append(message);

  root.append(header, content);
  ensureContainer().append(root);

  globalThis.setTimeout(() => {
    root.remove();
  }, dismissMs);
}

/** Published reminders — picked up by src/public.ts via import.meta.glob. */
export const runtime = definePublishRuntime({
  id: 'calendar-reminders',
  mount(el, config) {
    const cfg =
      (config as CalendarRemindersPublishConfig | null) ??
      (readOcmConfig(el) as CalendarRemindersPublishConfig | null);
    const reminders = cfg?.reminders;
    if (!reminders || reminders.length === 0) {
      return;
    }
    const pollMs = cfg.pollMs ?? 60_000;
    const dismissMs = cfg.dismissMs ?? 30_000;
    const shown = new Set<string>();

    const check = () => {
      const now = Date.now();
      for (const reminder of reminders) {
        if (shown.has(reminder.id) || reminder.triggerTime > now) {
          continue;
        }
        shown.add(reminder.id);
        showToast(reminder, dismissMs);
      }
    };

    check();
    const id = globalThis.setInterval(check, pollMs);
    return () => {
      globalThis.clearInterval(id);
    };
  },
});
