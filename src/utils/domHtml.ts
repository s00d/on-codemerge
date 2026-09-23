/**
 * Parse an HTML fragment into `el` without assigning `innerHTML`
 * (keeps XSS surface on DOMParser + importNode, matches timer/calendar widget pattern).
 */
export function replaceChildrenWithHtml(el: HTMLElement, html: string): void {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  el.replaceChildren(...[...doc.body.childNodes].map((n) => el.ownerDocument.importNode(n, true)));
}
