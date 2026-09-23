import { downloadBlob, pickFile, mount } from '@on-codemerge/sdk';
import type { DisposableScope, ViewSpec } from '@on-codemerge/sdk';
import { atomAlignStyle } from '../../../utils/atomAlign';

export function downloadJson(filename: string, data: string): void {
  downloadBlob(data, filename, 'application/json');
}

export function pickJsonFile(onText: (text: string) => void): void {
  void (async () => {
    try {
      const files = await pickFile({ accept: '.json' });
      const file = files?.[0];
      if (!file) {
        return;
      }
      const text = await file.text();
      onText(text);
    } catch {
      /* user cancelled or read failed */
    }
  })();
}

export function mountCalendarView(
  el: HTMLElement,
  spec: ViewSpec,
  scope: DisposableScope,
  align = ''
): void {
  el.className = 'ocm-calendar-atom';
  el.style.maxWidth = '28rem';
  el.style.marginLeft = '';
  el.style.marginRight = '';
  el.style.display = '';
  Object.assign(el.style, atomAlignStyle(align));
  scope.own(mount(el, spec));
}
