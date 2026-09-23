import { downloadBlob, pickFile, h, mount, renderDetached } from '@on-codemerge/sdk';
import type { DisposableScope, ViewSpec } from '@on-codemerge/sdk';
import { atomAlignStyle } from '../../../utils/atomAlign';

export function downloadJson(filename: string, data: string): void {
  downloadBlob(data, filename, 'application/json');
}

export function pickJsonFile(onText: (text: string) => void): void {
  void pickFile({ accept: '.json' }).then((files) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      onText(typeof reader.result === 'string' ? reader.result : '');
    });
    reader.readAsText(file);
    return;
  });
}

export function mountTimerView(
  el: HTMLElement,
  spec: ViewSpec,
  scope: DisposableScope,
  align = ''
): void {
  el.className = 'ocm-timer-atom';
  // Sized host so toolbar align (margin auto) works like math/chart.
  el.style.maxWidth = '28rem';
  el.style.marginLeft = '';
  el.style.marginRight = '';
  el.style.display = '';
  Object.assign(el.style, atomAlignStyle(align));
  scope.own(mount(el, spec));
}

/** Tick countdown in place (widgets/ is allowed to touch DOM). */
export function tickTimerWidget(
  element: HTMLElement,
  left: { days: number; hours: number; minutes: number; seconds: number; isExpired: boolean },
  expiredLabel: string
): void {
  const timerId = element.dataset.timerId;
  if (!timerId) {
    return;
  }
  const countdown = element.querySelector('.timer-countdown');
  if (!countdown) {
    return;
  }
  if (left.isExpired) {
    const { el: expired } = renderDetached(h('div', { class: 'timer-expired' }, expiredLabel));
    countdown.replaceChildren(expired);
    return;
  }
  const setVal = (suffix: string, value: string) => {
    const node = element.querySelector(`#timer-${suffix}-${timerId}`);
    if (node) {
      node.textContent = value;
    }
  };
  setVal('days', String(left.days));
  setVal('hours', left.hours.toString().padStart(2, '0'));
  setVal('minutes', left.minutes.toString().padStart(2, '0'));
  setVal('seconds', left.seconds.toString().padStart(2, '0'));
}
