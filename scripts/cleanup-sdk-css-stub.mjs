/**
 * Remove Vite lib JS stub left after CSS-only SDK build; keep `dist/sdk.css`.
 */
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const stub = resolve(process.cwd(), 'dist/sdk-css-stub.mjs');
if (existsSync(stub)) {
  rmSync(stub);
  console.log('cleanup-sdk-css-stub: removed dist/sdk-css-stub.mjs');
}
const map = resolve(process.cwd(), 'dist/sdk-css-stub.mjs.map');
if (existsSync(map)) {
  rmSync(map);
}
