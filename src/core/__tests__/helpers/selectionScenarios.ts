import type { DomLayout, DomLayoutKey } from './domLayouts';
import type { SelectionHelper } from './SelectionHelper';

export type SelectionScenarioId =
  | 'partial_word_start'
  | 'partial_word_end'
  | 'full_word'
  | 'full_line2'
  | 'cursor_mid_word'
  | 'cursor_line_start'
  | 'cursor_line_end'
  | 'partial_line1_word'
  | 'cross_line_via_br'
  | 'drag_range_offsets';

export interface SelectionScenario {
  id: SelectionScenarioId;
  supports: (layoutKey: DomLayoutKey) => boolean;
  apply: (helper: SelectionHelper, layout: DomLayout) => void;
  isPartial: boolean;
}

const line2Parent = (layout: DomLayout) => layout.line2Selector;
const line1Parent = (layout: DomLayout) => layout.line1Selector;

function getContainer(helper: SelectionHelper): HTMLElement {
  return helper.getContainer();
}

const setCursorInText = (
  helper: SelectionHelper,
  parentSelector: string | undefined,
  text: string,
  offset: number
) => {
  const container = getContainer(helper);
  const parent = parentSelector ? container.querySelector(parentSelector) : container;
  if (!parent) throw new Error(`Parent not found: ${parentSelector}`);

  const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const idx = node.textContent?.indexOf(text);
    if (idx !== -1 && idx !== undefined) {
      const range = document.createRange();
      range.setStart(node, idx + offset);
      range.setEnd(node, idx + offset);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
  }
  throw new Error(`Text "${text}" not found for cursor`);
};

export const SELECTION_SCENARIOS: SelectionScenario[] = [
  {
    id: 'partial_word_start',
    supports: () => true,
    isPartial: true,
    apply: (helper, layout) => {
      const parent = line2Parent(layout);
      const container = getContainer(helper);
      if (parent) {
        const el = container.querySelector(parent)!;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode()!;
        const idx = node.textContent!.indexOf('two');
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + 3);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      } else {
        helper.selectByText('two');
        const sel = window.getSelection()!;
        const range = sel.getRangeAt(0);
        range.setEnd(range.startContainer, range.startOffset + 3);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    },
  },
  {
    id: 'partial_word_end',
    supports: () => true,
    isPartial: true,
    apply: (helper, layout) => {
      const parent = line2Parent(layout);
      if (parent) helper.selectByText('two', parent);
      else helper.selectByText('two');
      const sel = window.getSelection()!;
      const range = sel.getRangeAt(0);
      const len = range.toString().length;
      range.setStart(range.endContainer, range.endOffset - Math.min(3, len));
      sel.removeAllRanges();
      sel.addRange(range);
    },
  },
  {
    id: 'full_word',
    supports: () => true,
    isPartial: false,
    apply: (helper, layout) => {
      const parent = line2Parent(layout);
      if (parent) helper.selectByText('two', parent);
      else helper.selectByText('two');
    },
  },
  {
    id: 'full_line2',
    supports: () => true,
    isPartial: false,
    apply: (helper, layout) => {
      const parent = line2Parent(layout);
      if (parent) helper.selectByText(layout.line2Text, parent);
      else helper.selectByText(layout.line2Text);
    },
  },
  {
    id: 'cursor_mid_word',
    supports: () => true,
    isPartial: true,
    apply: (helper, layout) => setCursorInText(helper, line2Parent(layout), 'two', 1),
  },
  {
    id: 'cursor_line_start',
    supports: () => true,
    isPartial: true,
    apply: (helper, layout) => {
      const container = getContainer(helper);
      const parent = line2Parent(layout);
      const el = parent ? container.querySelector(parent)! : container;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const node = walker.nextNode()!;
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 0);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    },
  },
  {
    id: 'cursor_line_end',
    supports: () => true,
    isPartial: true,
    apply: (helper, layout) => {
      const container = getContainer(helper);
      const parent = line2Parent(layout);
      const el = parent ? container.querySelector(parent)! : container;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let last: Text | null = null;
      while (walker.nextNode()) last = walker.currentNode as Text;
      if (!last) throw new Error('No text node');
      const range = document.createRange();
      range.setStart(last, last.length);
      range.setEnd(last, last.length);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    },
  },
  {
    id: 'partial_line1_word',
    supports: (key) => key !== 'line1Bold' && key !== 'preformattedNested',
    isPartial: true,
    apply: (helper, layout) => {
      const word = layout.line1Selector ? 'one' : 'Line';
      const parent = line1Parent(layout);
      if (parent) helper.selectByText(word, parent);
      else helper.selectByText(word);
    },
  },
  {
    id: 'cross_line_via_br',
    supports: (key) => key === 'br' || key === 'spanWrappedLines',
    isPartial: true,
    apply: (helper) => {
      const text = getContainer(helper).textContent!;
      const start = text.indexOf('one');
      const end = text.indexOf('Line two') + 4;
      helper.selectInContainer(start, end);
    },
  },
  {
    id: 'drag_range_offsets',
    supports: () => true,
    isPartial: true,
    apply: (helper) => {
      const text = getContainer(helper).textContent!;
      const line2Start = text.indexOf('two');
      helper.selectInContainer(line2Start, line2Start + 3);
    },
  },
];

export function getApplicableScenarios(layoutKey: DomLayoutKey): SelectionScenario[] {
  return SELECTION_SCENARIOS.filter((s) => s.supports(layoutKey));
}
