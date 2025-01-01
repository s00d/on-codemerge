import { createButton } from '../../utils/helpers.ts';

export function createToolbarButton(
  icon: string,
  title: string,
  action: () => void
): HTMLButtonElement {
  const button = createButton('', (e) => {
    e.preventDefault();
    action();
  });
  button.className = 'toolbar-button';
  button.title = title;
  button.innerHTML = icon;
  return button;
}
