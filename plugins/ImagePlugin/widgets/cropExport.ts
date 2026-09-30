import type { CropRect } from '../utils/cropMath';

function encodeMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/png') {
    return mime;
  }
  return 'image/png';
}

/**
 * Rasterize a crop of an already-decoded HTMLImageElement.
 * Must run inside a `foreign` / widgets boundary (canvas DOM).
 */
export function cropImageToBlob(
  image: HTMLImageElement,
  crop: CropRect,
  mime: string,
  quality = 0.92
): Promise<Blob> {
  const w = Math.max(1, Math.round(crop.w));
  const h = Math.max(1, Math.round(crop.h));
  const canvasEl = document.createElement('canvas');
  canvasEl.width = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Canvas unavailable'));
  }
  ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  const type = encodeMime(mime);
  const q = Math.min(1, Math.max(0.05, quality));
  return new Promise((resolve, reject) => {
    canvasEl.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode crop'));
        }
      },
      type,
      type === 'image/png' ? undefined : q
    );
  });
}

/** Rotate source by ±90° → PNG data URL (used before remounting the cropper). */
export function rotateImageDataUrl(src: string, degrees: 90 | -90): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => {
      const swap = Math.abs(degrees) % 180 === 90;
      const nw = image.naturalWidth || image.width;
      const nh = image.naturalHeight || image.height;
      const canvasEl = document.createElement('canvas');
      canvasEl.width = swap ? nh : nw;
      canvasEl.height = swap ? nw : nh;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.translate(canvasEl.width / 2, canvasEl.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(image, -nw / 2, -nh / 2);
      try {
        resolve(canvasEl.toDataURL('image/png'));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Rotate failed (CORS?)'));
      }
    });
    image.addEventListener('error', () => {
      reject(new Error('Failed to load image for rotate'));
    });
    // Gallery URLs may be cross-origin; anonymous lets canvas export when CORS allows.
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = src;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob'));
      }
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Failed to read blob'));
    });
    reader.readAsDataURL(blob);
  });
}
