import type { HTMLEditor } from '../core/HTMLEditor';

export function focusNodeStart(node: Node, editor?: HTMLEditor): void {
  // Create a text node if the node is empty
  if (!node.firstChild) {
    node.appendChild(document.createTextNode(''));
  }

  // Create a new range
  const range = document.createRange();
  const selection = editor?.getTextFormatter()?.getSelection() || window.getSelection();

  // Set the range to the node's content
  range.selectNodeContents(node);
  range.collapse(true); // Collapse to start

  // Apply the selection
  selection?.removeAllRanges();
  selection?.addRange(range);

  // Focus if the node is an element
  if (node instanceof HTMLElement) {
    node.focus();
  }
}
