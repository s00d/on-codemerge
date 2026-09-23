import { definePublishRuntime, readOcmConfig } from '../../../../packages/sdk/src/publish';

export interface TimerPublishConfig {
  target: string;
  expiredText?: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function setText(root: HTMLElement, sel: string, value: string): void {
  const el = root.querySelector(sel);
  if (el) {
    el.textContent = value;
  }
}

/** Published countdown — picked up by src/public.ts via import.meta.glob. */
export const runtime = definePublishRuntime({
  id: 'timer',
  mount(el, config) {
    const cfg =
      (config as TimerPublishConfig | null) ?? (readOcmConfig(el) as TimerPublishConfig | null);
    if (!cfg?.target) {
      return;
    }
    const targetMs = new Date(cfg.target).getTime();
    if (Number.isNaN(targetMs)) {
      return;
    }
    const expiredText = cfg.expiredText ?? 'Expired';
    const timerId = el.dataset.timerId ?? '';

    const tick = (): boolean => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        const countdown = el.querySelector('.timer-countdown');
        if (countdown) {
          countdown.textContent = '';
          const expired = document.createElement('div');
          expired.className = 'timer-expired';
          expired.textContent = expiredText;
          countdown.append(expired);
        }
        return false;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const byClass = (name: string, value: string) => {
        setText(el, `.timer-${name}`, value);
      };
      byClass('days', String(days));
      byClass('hours', pad2(hours));
      byClass('minutes', pad2(minutes));
      byClass('seconds', pad2(seconds));

      if (timerId) {
        setText(el, `#timer-days-${timerId}`, String(days));
        setText(el, `#timer-hours-${timerId}`, pad2(hours));
        setText(el, `#timer-minutes-${timerId}`, pad2(minutes));
        setText(el, `#timer-seconds-${timerId}`, pad2(seconds));
      }
      return true;
    };

    if (!tick()) {
      return;
    }
    const id = globalThis.setInterval(() => {
      if (!tick()) {
        globalThis.clearInterval(id);
      }
    }, 1000);
    return () => {
      globalThis.clearInterval(id);
    };
  },
});
