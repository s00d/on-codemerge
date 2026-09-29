/**
 * Parse an HTML fragment into `el` without assigning `innerHTML`
 * (keeps XSS surface on DOMParser + importNode, matches timer/calendar widget pattern).
 */
export function replaceChildrenWithHtml(el: HTMLElement, html: string): void {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const frag = el.ownerDocument.createDocumentFragment();
  for (const node of Array.from(doc.body.childNodes)) {
    frag.append(el.ownerDocument.importNode(node, true));
  }
  el.replaceChildren(frag);
}
