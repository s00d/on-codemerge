export class StyleManager {
  addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
  }

  addInlineStyle(element: HTMLElement, style: string): void {
    element.setAttribute('style', style);
  }
}
