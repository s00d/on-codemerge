#!/usr/bin/env node
/**
 * Types gate: published `on-codemerge/markdown` under moduleResolution bundler.
 * Run after `pnpm build`.
 */
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const dts = resolve(root, 'dist/markdown.d.ts');
if (!existsSync(dts)) {
  console.error('[check-markdown-types] missing', dts, '(run pnpm build)');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'ocm-md-types-'));
try {
  mkdirSync(join(dir, 'node_modules'));
  symlinkSync(root, join(dir, 'node_modules/on-codemerge'));
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          target: 'ES2022',
          lib: ['ES2022', 'DOM'],
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: [],
        },
        files: ['probe.ts'],
      },
      null,
      2
    )
  );
  writeFileSync(
    join(dir, 'probe.ts'),
    [
      "import { Editor, MarkdownPlugin } from 'on-codemerge/markdown';",
      'declare const host: HTMLElement;',
      "const editor: Editor = new Editor(host, { plugins: [MarkdownPlugin({ surface: 'workspace' })] });",
      'void editor.getText;',
    ].join('\n')
  );

  const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, '-p', dir], { stdio: 'inherit' });
  console.log('[check-markdown-types] ok (bundler moduleResolution)');
} catch (err) {
  console.error('[check-markdown-types] failed');
  process.exit(typeof err?.status === 'number' ? err.status : 1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
