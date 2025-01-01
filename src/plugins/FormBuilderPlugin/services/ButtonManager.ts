export class ButtonManager {
  createButton(label: string, target: string = ''): HTMLElement {
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = target;
    link.textContent = label;
    return link;
  }
}
