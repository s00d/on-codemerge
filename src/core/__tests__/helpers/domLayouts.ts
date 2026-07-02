/** Типичные DOM-структуры contentEditable после Enter */

export interface DomLayout {
  name: string;
  html: string;
  line1Text: string;
  line2Text: string;
  line1Selector?: string;
  line2Selector?: string;
}

export const DOM_LAYOUTS = {
  br: {
    name: 'plain text + br + plain text',
    html: 'Line one<br>Line two',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line2Selector: undefined,
  },
  divAfterBr: {
    name: 'plain text + div',
    html: 'Line one<div>Line two</div>',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line2Selector: 'div',
  },
  twoDivs: {
    name: 'div + div',
    html: '<div>Line one</div><div>Line two</div>',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line1Selector: 'div:first-child',
    line2Selector: 'div:last-child',
  },
  emptyLineBetween: {
    name: 'plain text + empty div + plain text',
    html: 'Line one<div><br></div>Line two',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line2Selector: undefined,
  },
  line1Bold: {
    name: 'bold line1 + plain line2 in div',
    html: '<span class="format-bold">Line one</span><div>Line two</div>',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line2Selector: 'div',
  },
  twoParagraphs: {
    name: 'p + p',
    html: '<p>Line one</p><p>Line two</p>',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line1Selector: 'p:first-child',
    line2Selector: 'p:last-child',
  },
  spanWrappedLines: {
    name: 'span + br + span',
    html: '<span>Line one</span><br><span>Line two</span>',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line1Selector: 'span:first-of-type',
    line2Selector: 'span:last-of-type',
  },
  preformattedNested: {
    name: 'bold span line1 + div line2',
    html: '<span class="format-bold">Line one</span><div>Line two</div>',
    line1Text: 'Line one',
    line2Text: 'Line two',
    line2Selector: 'div',
  },
} as const satisfies Record<string, DomLayout>;

export type DomLayoutKey = keyof typeof DOM_LAYOUTS;
