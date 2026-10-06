/** Coalesced rAF: one pending callback, cancelled on dispose. */
export type FrameScheduler = {
  schedule(cb: () => void, mode?: 'coalesce' | 'replace'): void;
  cancel(): void;
};

export function createFrameScheduler(): FrameScheduler {
  let id = 0;
  return {
    schedule(cb, mode = 'coalesce') {
      if (id !== 0) {
        if (mode === 'coalesce') {
          return;
        }
        cancelAnimationFrame(id);
        id = 0;
      }
      id = requestAnimationFrame(() => {
        id = 0;
        cb();
      });
    },
    cancel() {
      if (id !== 0) {
        cancelAnimationFrame(id);
        id = 0;
      }
    },
  };
}
