import { TextDecoder, TextEncoder } from 'node:util';

globalThis.TextEncoder ??= TextEncoder as unknown as typeof globalThis.TextEncoder;
globalThis.TextDecoder ??= TextDecoder as unknown as typeof globalThis.TextDecoder;

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
