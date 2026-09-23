import { TextDecoder, TextEncoder } from 'node:util';

globalThis.TextEncoder ??= TextEncoder;
globalThis.TextDecoder ??= TextDecoder;

if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

if (typeof globalThis.structuredClone !== 'function') {
  // Polyfill for jsdom — structuredClone is unavailable there.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion, unicorn/prefer-structured-clone -- polyfill body
  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

type StubGradient = { addColorStop: (offset: number, color: string) => void };

function stubGradient(): StubGradient {
  return {
    addColorStop(_offset: number, _color: string): void {},
  };
}

function stubMetrics(text: string): TextMetrics {
  return {
    width: text.length * 10,
    actualBoundingBoxAscent: 8,
    actualBoundingBoxDescent: 2,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: text.length * 10,
    fontBoundingBoxAscent: 8,
    fontBoundingBoxDescent: 2,
    alphabeticBaseline: 0,
    emHeightAscent: 8,
    emHeightDescent: 2,
    hangingBaseline: 0,
    ideographicBaseline: 0,
  };
}

function stubImageData(width: number, height: number): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
    colorSpace: 'srgb',
  };
}

/**
 * jsdom prints "Not implemented: HTMLCanvasElement's getContext()" for every
 * call unless the native `canvas` package is installed. Font probe / ColorWell /
 * charts only need a stub 2d context in unit tests — not pixel-accurate paint.
 */
function installCanvas2dStub(): void {
  if (typeof HTMLCanvasElement === 'undefined') {
    return;
  }
  const proto = HTMLCanvasElement.prototype;
  const previous = proto.getContext.bind(proto);

  proto.getContext = function getContext(
    this: HTMLCanvasElement,
    type: string,
    options?: CanvasRenderingContext2DSettings
  ): RenderingContext | null {
    if (type !== '2d') {
      return previous.call(this, type, options);
    }

    const ctx = {
      canvas: this,
      fillStyle: '#000',
      strokeStyle: '#000',
      font: '10px sans-serif',
      lineWidth: 1,
      globalAlpha: 1,
      measureText: stubMetrics,
      fillRect() {},
      clearRect() {},
      strokeRect() {},
      fillText() {},
      strokeText() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      fill() {},
      stroke() {},
      save() {},
      restore() {},
      translate() {},
      scale() {},
      rotate() {},
      setTransform() {},
      resetTransform() {},
      drawImage() {},
      createLinearGradient: () => stubGradient(),
      createRadialGradient: () => stubGradient(),
      getImageData: () => stubImageData(1, 1),
      putImageData() {},
      createImageData: (w: number | ImageData, h?: number) => {
        const width = typeof w === 'number' ? w : 1;
        const height = typeof h === 'number' ? h : 1;
        return stubImageData(width, height);
      },
    };

    return ctx as CanvasRenderingContext2D;
  };
}

installCanvas2dStub();
