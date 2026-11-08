/**
 * Host color scheme. The host page owns `html.dark` (see ocm-theme.css); anything that bakes
 * colors into pixels (chart images, mermaid SVG) must read it at paint time and repaint on flip.
 */
export function isDarkHost(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

/** Calls `cb` whenever `html.dark` toggles; returns the unsubscribe. */
export function onColorSchemeChange(cb: (dark: boolean) => void): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  let dark = isDarkHost();
  const observer = new MutationObserver(() => {
    const next = isDarkHost();
    if (next !== dark) {
      dark = next;
      cb(next);
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}
