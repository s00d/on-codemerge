export function createToolbarButton(
  icon: string,
  title: string,
  action: () => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'toolbar-button';
  button.title = title;
  button.innerHTML = icon;
  button.addEventListener('click', (e) => {
    e.preventDefault();
    action();
  });
  return button;
}
