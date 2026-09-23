/** Disposable callback registered in a scope. */
export type DisposeFn = () => void;

/** Anything with destroy/dispose/hide — registered via scope.own / OwnedSlot. */
export type Ownable = {
  destroy?: () => void;
  dispose?: () => void;
  hide?: () => void;
};

/** Tear down an Ownable: destroy → dispose → hide. */
export function teardownOwnable(resource: Ownable): void {
  if (typeof resource.destroy === 'function') {
    resource.destroy();
    return;
  }
  if (typeof resource.dispose === 'function') {
    resource.dispose();
    return;
  }
  if (typeof resource.hide === 'function') {
    resource.hide();
  }
}

/**
 * Replaceable Ownable slot bound to a scope.
 * `replace(next)` destroys the previous instance; scope dispose clears the slot.
 * Use for Resizer / one-active popup / ephemeral UI instead of manual destroy().
 */
export class OwnedSlot<T extends Ownable> {
  private current: T | null = null;

  constructor(scope: DisposableScope) {
    scope.disposable(() => {
      this.clear();
    });
  }

  get value(): T | null {
    return this.current;
  }

  /** Swap current resource; previous is torn down automatically. */
  replace(next: T | null): T | null {
    if (this.current && this.current !== next) {
      teardownOwnable(this.current);
    }
    this.current = next;
    return next;
  }

  clear(): void {
    this.replace(null);
  }
}

/**
 * Auto-cleanup stack for plugin/widget lifetimes.
 * Dispose order is LIFO (last registered cleaned first).
 */
export class DisposableScope {
  private readonly stack: DisposeFn[] = [];
  private closed = false;

  get isDisposed(): boolean {
    return this.closed;
  }

  /** Register a cleanup; returns unregister that removes it without running. */
  disposable(fn: DisposeFn): DisposeFn {
    if (this.closed) {
      fn();
      return () => {};
    }
    this.stack.push(fn);
    return () => {
      const i = this.stack.lastIndexOf(fn);
      if (i !== -1) {
        this.stack.splice(i, 1);
      }
    };
  }

  /**
   * Register a resource for automatic teardown when this scope disposes.
   * Prefer over `disposable(() => x.destroy())`.
   */
  own<T extends Ownable>(resource: T): T {
    this.disposable(() => {
      teardownOwnable(resource);
    });
    return resource;
  }

  /** Slot for a replaceable Ownable (e.g. Resizer recreated on click). */
  slot<T extends Ownable = Ownable>(): OwnedSlot<T> {
    return new OwnedSlot<T>(this);
  }

  /** Nested child scope; disposed with (or before) parent. */
  child(): DisposableScope {
    const child = new DisposableScope();
    this.disposable(() => {
      child.dispose();
    });
    return child;
  }

  on<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): DisposeFn {
    const handler = listener as EventListener;
    target.addEventListener(type, handler, options);
    return this.disposable(() => {
      target.removeEventListener(type, handler, options);
    });
  }

  interval(ms: number, fn: () => void): DisposeFn {
    const id = setInterval(fn, ms);
    return this.disposable(() => {
      clearInterval(id);
    });
  }

  timeout(ms: number, fn: () => void): DisposeFn {
    const id = setTimeout(fn, ms);
    return this.disposable(() => {
      clearTimeout(id);
    });
  }

  dispose(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    for (let i = this.stack.length - 1; i >= 0; i--) {
      try {
        this.stack[i]();
      } catch (error) {
        console.error('DisposableScope dispose error', error);
      }
    }
    this.stack.length = 0;
  }
}

export type Disposable = Pick<
  DisposableScope,
  'disposable' | 'dispose' | 'isDisposed' | 'child' | 'own' | 'slot' | 'on' | 'interval' | 'timeout'
>;
