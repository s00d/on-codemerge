export function onViteAfterUpdate(callback: () => void): void {
  if (import.meta.hot) {
    import.meta.hot.on('vite:afterUpdate', callback);
  }
}
