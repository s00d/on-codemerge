import { createButton } from '../../utils/helpers.ts';

interface ToolbarButtonOptions {
  icon: string;
  title: string | undefined;
  onClick: () => void;
  disabled?: boolean;
}

export function createToolbarButton({
  icon,
  title,
  onClick,
  disabled = false,
}: ToolbarButtonOptions): HTMLButtonElement {
  const button = createButton('', (e) => {
    e.preventDefault();
    if (!disabled) {
      onClick();
    }
  });
  button.className = 'toolbar-button';
  button.title = title ?? '';
  button.innerHTML = icon;
  button.disabled = disabled;

  return button;
}
