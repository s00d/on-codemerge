import { PopupController, canvas, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import { clamp, hexToHsv, hsvToHex, neutrals, quickSwatches } from './colorMath';
import type { Hsv } from './colorMath';

export interface ColorWellOptions {
  title: string;
  /** Starting color (hex). */
  initial?: string | null;
  /** Instant pick. */
  onPick: (hex: string) => void;
  /** Clear / remove color. */
  onClear?: () => void;
  /** Show clear control (default true when onClear set). */
  allowClear?: boolean;
}

function paintSv(el: HTMLCanvasElement, hue: number): void {
  const ctx = el.getContext('2d');
  if (!ctx) {
    return;
  }
  const { width: w, height: ht } = el;
  for (let y = 0; y < ht; y++) {
    const v = 1 - y / Math.max(1, ht - 1);
    for (let x = 0; x < w; x++) {
      const s = x / Math.max(1, w - 1);
      ctx.fillStyle = hsvToHex(hue, s, v);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function paintHue(el: HTMLCanvasElement): void {
  const ctx = el.getContext('2d');
  if (!ctx) {
    return;
  }
  const { width: w, height: ht } = el;
  for (let x = 0; x < w; x++) {
    ctx.fillStyle = hsvToHex((360 * x) / Math.max(1, w - 1), 1, 1);
    ctx.fillRect(x, 0, 1, ht);
  }
}

function swatchSpec(c: string, onClick: () => void): ViewSpec {
  return h('button', {
    class:
      'ocm-color-well__swatch aspect-square cursor-pointer rounded border border-ocm-border p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-ocm-border',
    attrs: { type: 'button', title: c },
    style: { backgroundColor: c },
    on: { click: onClick },
  });
}

function wellPanel(
  initial: Hsv,
  opts: {
    onPick: (hex: string) => void;
    onClear?: () => void;
    allowClear: boolean;
    t: (key: string) => string;
  }
): ViewSpec {
  let hsv: Hsv = { ...initial };

  return foreign((host, scope) => {
    const root = mount(
      host,
      h(
        'div',
        { class: 'ocm-color-well flex min-w-50 flex-col gap-2 select-none py-1' },
        h('div', { class: 'flex items-center gap-2' }, [
          h('div', {
            class: 'size-7 shrink-0 rounded-md border border-ocm-border',
            ref: 'preview',
          }),
          h('span', { class: 'font-mono text-xs text-ocm-text-muted', ref: 'hex' }),
        ]),
        h('div', { class: 'relative w-full' }, [
          canvas({
            class: 'ocm-color-well__sv h-35 w-full cursor-crosshair touch-none rounded-md bg-black',
            width: 200,
            height: 140,
            ref: 'sv',
            attrs: { 'aria-label': opts.t('color.saturationValue') },
          }),
          h('div', {
            class:
              'pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0_/_35%)]',
            ref: 'svThumb',
          }),
        ]),
        h('div', { class: 'relative w-full' }, [
          canvas({
            class: 'h-3.5 w-full cursor-pointer touch-none rounded-full',
            width: 200,
            height: 14,
            ref: 'hue',
            attrs: { 'aria-label': opts.t('color.hue') },
          }),
          h('div', {
            class:
              'pointer-events-none absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0_/_35%)]',
            ref: 'hueThumb',
          }),
        ]),
        h('div', { class: 'grid grid-cols-9 gap-1', ref: 'quick' }),
        h('div', { class: 'grid grid-cols-9 gap-1', ref: 'gray' }),
        opts.allowClear && opts.onClear
          ? h(
              'button',
              {
                class:
                  'mt-0.5 w-full cursor-pointer rounded-md border border-ocm-border bg-transparent px-2 py-1.5 text-sm text-ocm-text hover:bg-ocm-surface-hover',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    opts.onClear?.();
                  },
                },
              },
              opts.t('color.clear')
            )
          : null
      )
    );
    scope.own(root);

    const preview = root.refs.preview;
    const hexLabel = root.refs.hex;
    const sv = root.refs.sv as HTMLCanvasElement;
    const hue = root.refs.hue as HTMLCanvasElement;
    const svThumb = root.refs.svThumb;
    const hueThumb = root.refs.hueThumb;
    const quickHost = root.refs.quick;
    const grayHost = root.refs.gray;

    let quickMount: MountHandle | null = null;
    let grayMount: MountHandle | null = null;

    const sync = (commit: boolean) => {
      const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
      preview.style.backgroundColor = hex;
      hexLabel.textContent = hex;
      paintSv(sv, hsv.h);
      svThumb.style.left = `${hsv.s * 100}%`;
      svThumb.style.top = `${(1 - hsv.v) * 100}%`;
      hueThumb.style.left = `${(hsv.h / 360) * 100}%`;

      const quickSpec = quickSwatches(hsv.h).map((c) =>
        swatchSpec(c, () => {
          const next = hexToHsv(c);
          if (next) {
            hsv = next;
            sync(true);
          }
        })
      );
      if (quickMount) {
        quickMount.update(quickSpec);
      } else {
        quickMount = mount(quickHost, quickSpec);
        scope.own(quickMount);
      }

      if (commit) {
        opts.onPick(hex);
      }
    };

    grayMount = mount(
      grayHost,
      neutrals().map((c) =>
        swatchSpec(c, () => {
          const next = hexToHsv(c);
          if (next) {
            hsv = next;
            sync(true);
          }
        })
      )
    );
    scope.own(grayMount);

    const bindDrag = (
      el: HTMLCanvasElement,
      read: (x: number, y: number, rect: DOMRect) => void
    ) => {
      let dragging = false;
      const move = (clientX: number, clientY: number) => {
        const rect = el.getBoundingClientRect();
        read(clientX, clientY, rect);
        sync(false);
      };
      scope.on(el, 'pointerdown', (e) => {
        dragging = true;
        el.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      });
      scope.on(el, 'pointermove', (e) => {
        if (!dragging) {
          return;
        }
        move(e.clientX, e.clientY);
      });
      const onUp = (e: PointerEvent) => {
        if (!dragging) {
          return;
        }
        dragging = false;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        sync(true);
      };
      scope.on(el, 'pointerup', onUp);
      scope.on(el, 'pointercancel', onUp);
    };

    bindDrag(sv, (cx, cy, rect) => {
      const x = clamp((cx - rect.left) / rect.width, 0, 1);
      const y = clamp((cy - rect.top) / rect.height, 0, 1);
      hsv = { ...hsv, s: x, v: 1 - y };
    });
    bindDrag(hue, (cx, _cy, rect) => {
      const x = clamp((cx - rect.left) / rect.width, 0, 1);
      hsv = { ...hsv, h: x * 360 };
    });

    paintHue(hue);
    sync(false);
  });
}

/**
 * Reusable HSV color well popup (instant apply, no stored palette).
 */
export class ColorWell {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  close(): void {
    this.popups.close();
  }

  /** Embeddable panel ViewSpec (e.g. table format popup). */
  panel(options: Omit<ColorWellOptions, 'title'>): ViewSpec {
    return colorWellView(options, (k) => this.editor.t(k));
  }

  show(options: ColorWellOptions): void {
    const allowClear = options.allowClear ?? Boolean(options.onClear);
    this.popups.open({
      title: options.title,
      size: 'sm',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'well',
          view: () =>
            colorWellView(
              {
                initial: options.initial,
                onPick: options.onPick,
                onClear: options.onClear
                  ? () => {
                      options.onClear?.();
                      this.popups.close();
                    }
                  : undefined,
                allowClear,
              },
              (k) => this.editor.t(k)
            ),
        },
      ],
    });
  }
}

/** Standalone embeddable well (no popup wrapper). */
export function colorWellView(
  options: Omit<ColorWellOptions, 'title'>,
  t: (key: string) => string = (k) => k
): ViewSpec {
  const initial =
    (options.initial && hexToHsv(options.initial)) || ({ h: 210, s: 0.7, v: 0.9 } satisfies Hsv);
  const allowClear = options.allowClear ?? Boolean(options.onClear);
  return wellPanel(initial, {
    onPick: options.onPick,
    onClear: options.onClear,
    allowClear,
    t,
  });
}

/** Convenience one-shot open (keeps ColorWell instance). */
export function openColorWell(
  editor: EditorAPI,
  scope: DisposableScope,
  options: ColorWellOptions
): ColorWell {
  const well = new ColorWell(editor, scope);
  well.show(options);
  return well;
}

/**
 * One-shot color popup without DisposableScope (charts / calendar / embeds).
 * Closes after pick or clear.
 */
export function pickColor(
  editor: EditorAPI,
  options: {
    title?: string;
    initial?: string | null;
    onPick: (hex: string) => void;
    onClear?: () => void;
    allowClear?: boolean;
  }
): void {
  const allowClear = options.allowClear ?? Boolean(options.onClear);
  editor.ui.popup.open({
    title: options.title ?? editor.t('color.colors'),
    size: 'sm',
    closeOnClickOutside: true,
    items: [
      {
        type: 'view',
        id: 'well',
        view: () =>
          colorWellView(
            {
              initial: options.initial,
              allowClear,
              onPick: (hex) => {
                options.onPick(hex);
                editor.ui.popup.hide();
              },
              onClear: options.onClear
                ? () => {
                    options.onClear?.();
                    editor.ui.popup.hide();
                  }
                : undefined,
            },
            (k) => editor.t(k)
          ),
      },
    ],
  });
}

/** Swatch button that opens `pickColor` and updates its own background. */
export function colorSwatchButton(
  editor: EditorAPI,
  getHex: () => string,
  setHex: (hex: string) => void,
  opts?: {
    title?: string;
    className?: string;
    allowClear?: boolean;
    onClear?: () => void;
  }
): ViewSpec {
  return foreign((host, scope) => {
    const title = opts?.title ?? editor.t('common.color');
    const className =
      opts?.className ?? 'size-8 shrink-0 cursor-pointer rounded border border-ocm-border';

    const handle = mount(
      host,
      h('button', {
        class: className,
        attrs: { type: 'button', title },
        style: { backgroundColor: getHex() || '#ffffff' },
        ref: 'btn',
        on: {
          click: () => {
            pickColor(editor, {
              title,
              initial: getHex(),
              onPick: (hex) => {
                setHex(hex);
                handle.refs.btn.style.backgroundColor = hex;
              },
              onClear: opts?.onClear
                ? () => {
                    opts.onClear?.();
                    handle.refs.btn.style.backgroundColor = getHex() || '#ffffff';
                  }
                : undefined,
              allowClear: opts?.allowClear,
            });
          },
        },
      })
    );
    scope.own(handle);
  });
}

/** Tiny preview chip for toolbar / menus. */
export function colorChip(hex: string | null | undefined): ViewSpec {
  return h('span', {
    class: `inline-block size-3 align-middle rounded-sm border border-ocm-border${
      hex ? '' : ' bg-[repeating-conic-gradient(#ccc_0%_25%,#fff_0%_50%)] bg-size-[0.5rem_0.5rem]'
    }`,
    style: hex ? { backgroundColor: hex } : undefined,
  });
}
