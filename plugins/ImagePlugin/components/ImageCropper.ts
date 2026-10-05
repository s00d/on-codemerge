import { foreign, h, img, mount } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import { applyAspectPreset, clampCrop, fitScale, fullFrame } from '../utils/cropMath';
import type { AspectPreset, CropRect } from '../utils/cropMath';

export type ImageCropperApi = {
  getCrop(): CropRect;
  getImage(): HTMLImageElement | null;
  setAspect(preset: AspectPreset): void;
};

type CropperOpts = {
  src: string;
  initialCrop?: CropRect | null;
  onReady?: (api: ImageCropperApi) => void;
  /** Fired after crop rect settles (load + pointer-up). */
  onCropChange?: (crop: CropRect) => void;
  maxBox?: { w: number; h: number };
};

/**
 * Interactive crop UI: dimmed overlay, drag move, corner resize, aspect presets via API.
 */
export function imageCropperView(opts: CropperOpts): ViewSpec {
  const maxW = opts.maxBox?.w ?? 560;
  const maxH = opts.maxBox?.h ?? 360;

  return foreign((host, scope) => {
    host.className = 'ocm-image-cropper relative select-none';

    let imageEl: HTMLImageElement | null = null;
    let frameEl: HTMLElement | null = null;
    let boxEl: HTMLElement | null = null;
    let nw = 0;
    let nh = 0;
    let scale = 1;
    let crop = fullFrame(1, 1);
    let aspect: AspectPreset = 'free';
    let drag: null | {
      mode: 'move' | 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
      startX: number;
      startY: number;
      start: CropRect;
    } = null;

    const paintBox = (): void => {
      if (!boxEl || !frameEl) {
        return;
      }
      boxEl.style.left = `${crop.x * scale}px`;
      boxEl.style.top = `${crop.y * scale}px`;
      boxEl.style.width = `${crop.w * scale}px`;
      boxEl.style.height = `${crop.h * scale}px`;
    };

    const api: ImageCropperApi = {
      getCrop: () => ({ ...crop }),
      getImage: () => imageEl,
      setAspect: (preset) => {
        aspect = preset;
        if (nw > 0 && nh > 0) {
          crop = applyAspectPreset(nw, nh, preset);
          paintBox();
        }
      },
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (!drag) {
        return;
      }
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      const s = drag.start;
      const ratio =
        aspect === 'free' ? null : aspect === '1:1' ? 1 : aspect === '16:9' ? 16 / 9 : 4 / 3;

      if (drag.mode === 'move') {
        crop = clampCrop({ x: s.x + dx, y: s.y + dy, w: s.w, h: s.h }, nw, nh, null);
      } else {
        let x = s.x;
        let y = s.y;
        let cropW = s.w;
        let cropH = s.h;
        if (drag.mode.includes('w')) {
          x = s.x + dx;
          cropW = s.w - dx;
        }
        if (drag.mode.includes('e')) {
          cropW = s.w + dx;
        }
        if (drag.mode.includes('n')) {
          y = s.y + dy;
          cropH = s.h - dy;
        }
        if (drag.mode.includes('s')) {
          cropH = s.h + dy;
        }
        if (cropW < 8) {
          if (drag.mode.includes('w')) {
            x = s.x + s.w - 8;
          }
          cropW = 8;
        }
        if (cropH < 8) {
          if (drag.mode.includes('n')) {
            y = s.y + s.h - 8;
          }
          cropH = 8;
        }
        crop = clampCrop({ x, y, w: cropW, h: cropH }, nw, nh, ratio);
      }
      paintBox();
    };

    const onPointerUp = (e: PointerEvent): void => {
      if (!drag) {
        return;
      }
      drag = null;
      const target = e.currentTarget;
      if (target instanceof HTMLElement) {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      opts.onCropChange?.({ ...crop });
    };

    const startDrag = (mode: NonNullable<typeof drag>['mode']) => (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      target.setPointerCapture(e.pointerId);
      drag = { mode, startX: e.clientX, startY: e.clientY, start: { ...crop } };
    };

    const handle = (pos: NonNullable<typeof drag>['mode'], cls: string, size = 'h-3 w-3') =>
      h('div', {
        class: `absolute z-20 ${size} rounded-sm border-2 border-white bg-sky-500 shadow ${cls}`,
        style: { touchAction: 'none' },
        on: {
          pointerdown: startDrag(pos),
          pointermove: onPointerMove,
          pointerup: onPointerUp,
          pointercancel: onPointerUp,
        },
      });

    const shell = mount(
      host,
      h(
        'div',
        {
          class:
            'ocm-image-cropper__frame relative mx-auto overflow-hidden rounded-lg bg-zinc-900/90',
          ref: 'frame',
          style: { maxWidth: `${maxW}px`, maxHeight: `${maxH}px` },
        },
        [
          img({
            class: 'block max-h-full max-w-full',
            ref: 'image',
            src: opts.src,
            alt: '',
            attrs: { draggable: 'false' },
            style: { maxWidth: `${maxW}px`, maxHeight: `${maxH}px` },
          }),
          h(
            'div',
            {
              class: 'absolute border-2 border-sky-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]',
              ref: 'box',
              style: { touchAction: 'none', cursor: 'move' },
              on: {
                pointerdown: startDrag('move'),
                pointermove: onPointerMove,
                pointerup: onPointerUp,
                pointercancel: onPointerUp,
              },
            },
            [
              handle('nw', 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize'),
              handle('ne', 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize'),
              handle('sw', 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize'),
              handle('se', 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize'),
              handle(
                'n',
                'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
                'h-2.5 w-3'
              ),
              handle(
                's',
                'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
                'h-2.5 w-3'
              ),
              handle(
                'w',
                'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
                'h-3 w-2.5'
              ),
              handle(
                'e',
                'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
                'h-3 w-2.5'
              ),
            ]
          ),
        ]
      )
    );
    scope.own(shell);

    frameEl = shell.refs.frame instanceof HTMLElement ? shell.refs.frame : null;
    boxEl = shell.refs.box instanceof HTMLElement ? shell.refs.box : null;
    imageEl = shell.refs.image instanceof HTMLImageElement ? shell.refs.image : null;

    const onLoad = (): void => {
      if (!imageEl) {
        return;
      }
      nw = imageEl.naturalWidth || imageEl.width;
      nh = imageEl.naturalHeight || imageEl.height;
      scale = fitScale(nw, nh, maxW, maxH);
      const dispW = nw * scale;
      const dispH = nh * scale;
      if (frameEl) {
        frameEl.style.width = `${dispW}px`;
        frameEl.style.height = `${dispH}px`;
      }
      imageEl.style.width = `${dispW}px`;
      imageEl.style.height = `${dispH}px`;
      crop = opts.initialCrop ? clampCrop(opts.initialCrop, nw, nh, null) : fullFrame(nw, nh);
      paintBox();
      opts.onReady?.(api);
    };

    if (imageEl) {
      if (imageEl.complete && imageEl.naturalWidth > 0) {
        onLoad();
      } else {
        imageEl.addEventListener('load', onLoad);
        scope.disposable(() => imageEl?.removeEventListener('load', onLoad));
      }
    }
  });
}
