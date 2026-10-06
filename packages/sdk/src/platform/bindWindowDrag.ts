export type WindowDragHandlers = {
  onMove: (ev: PointerEvent) => void;
  onUp: (ev: PointerEvent) => void;
};

/** Window pointermove/up with AbortSignal so remount cannot leak listeners. */
export function bindWindowDrag(handlers: WindowDragHandlers): AbortController {
  const ac = new AbortController();
  const { signal } = ac;
  const onUp = (ev: PointerEvent): void => {
    ac.abort();
    handlers.onUp(ev);
  };
  window.addEventListener('pointermove', handlers.onMove, { signal });
  window.addEventListener('pointerup', onUp, { signal });
  window.addEventListener('pointercancel', onUp, { signal });
  return ac;
}
