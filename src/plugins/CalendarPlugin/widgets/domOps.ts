import { downloadBlob, pickFile, mount } from '@on-codemerge/sdk';
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
