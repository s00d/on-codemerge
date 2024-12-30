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
  const button = document.createElement('button');
  button.className = 'toolbar-button';
  button.title = title ?? '';
  button.innerHTML = icon;
  button.disabled = disabled;

  if (!disabled) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });
  }

  return button;
}
