#!/usr/bin/env node
/**
 * Runtime + types gates for `on-codemerge/<surface>` after `pnpm build`.
 * Usage: node scripts/check-surface.mjs [surface|all] [export|types|all]
 */
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, writeFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SURFACES = {
  json: {
    plugin: 'JsonPlugin',
    extras: ['ParseError', 'parseText', 'createDefaultPlugins', 'docToValue'],
  },
  markdown: {
    plugin: 'MarkdownPlugin',
    extras: ['ParseError', 'parseText', 'createDefaultPlugins', 'projectPreviewHtml'],
  },
  code: {
    plugin: 'CodeBlockPlugin',
    extras: ['ParseError', 'parseText', 'createDefaultPlugins', 'languageFromDoc'],
  },
  forms: {
    plugin: 'FormBuilderPlugin',
    extras: ['ParseError', 'parseText', 'createDefaultPlugins', 'isFormConfig', 'formView'],
  },
  charts: {
    plugin: 'ChartsPlugin',
    extras: ['ParseError', 'parseText', 'createDefaultPlugins', 'normalizeChartAttrs'],
  },
  calendar: {
    plugin: 'CalendarPlugin',
    extras: [
      'ParseError',
      'parseText',
      'createDefaultPlugins',
      'coerceCalendarDoc',
      'isCalendarDoc',
      'renderView',
    ],
  },
};

const root = resolve(import.meta.dirname, '..');
const surfaceArg = process.argv[2] ?? 'all';
const modeArg = process.argv[3] ?? 'all';

const names =
  surfaceArg === 'all' ? Object.keys(SURFACES) : surfaceArg in SURFACES ? [surfaceArg] : null;
if (!names) {
  console.error('[check-surface] unknown surface', surfaceArg);
  process.exit(1);
}

async function checkExport(name) {
  const cfg = SURFACES[name];
  const expectedEsm = resolve(root, `dist/${name}.mjs`);
  const parent = pathToFileURL(resolve(root, 'package.json')).href;
  const spec = `on-codemerge/${name}`;
  const tag = `[check-${name}-export]`;
  const esmUrl = import.meta.resolve(spec, parent);
  const esmPath = fileURLToPath(esmUrl);
  if (resolve(esmPath) !== expectedEsm) {
    console.error(tag, 'ESM resolve expected', expectedEsm, 'got', esmPath);
    process.exit(1);
  }
  if (!existsSync(esmPath)) {
    console.error(tag, 'missing', esmPath, '(run pnpm build)');
    process.exit(1);
  }
  const esm = await import(esmUrl);
  if (typeof esm.Editor !== 'function') {
    console.error(tag, 'ESM Editor not a function');
    process.exit(1);
  }
  for (const key of cfg.extras) {
    if (!(key in esm)) {
      console.error(tag, 'ESM missing export', key);
      process.exit(1);
    }
  }
  if (typeof esm.ParseError !== 'function') {
    console.error(tag, 'ESM ParseError not a constructor');
    process.exit(1);
  }
  const pe = new esm.ParseError('probe', 7);
  if (!(pe instanceof Error) || pe.name !== 'ParseError' || pe.offset !== 7) {
    console.error(tag, 'ESM ParseError instance broken');
    process.exit(1);
  }

  const req = createRequire(resolve(root, 'package.json'));
  const cjs = req(spec);
  if (typeof cjs.Editor !== 'function') {
    console.error(tag, 'CJS Editor not a function');
    process.exit(1);
  }
  for (const key of cfg.extras) {
    if (!(key in cjs)) {
      console.error(tag, 'CJS missing export', key);
      process.exit(1);
    }
  }
  const cjsPe = new cjs.ParseError('probe');
  if (!(cjsPe instanceof Error) || cjsPe.name !== 'ParseError') {
    console.error(tag, 'CJS ParseError instance broken');
    process.exit(1);
  }

  const appDts = resolve(root, `dist/apps/${name}/src/app.d.ts`);
  const parseDts = resolve(root, 'dist/apps/wysiwyg/src/utils/parseSoT.d.ts');
  const entryDts = resolve(root, `dist/${name}.d.ts`);
  const entryDcts = resolve(root, `dist/${name}.d.cts`);
  if (!existsSync(appDts)) {
    console.error(tag, 'missing nested app d.ts', appDts);
    process.exit(1);
  }
  if (!existsSync(parseDts)) {
    console.error(tag, 'missing parseSoT.d.ts', parseDts);
    process.exit(1);
  }
  if (!existsSync(entryDts)) {
    console.error(tag, 'missing entry d.ts', entryDts);
    process.exit(1);
  }
  if (!existsSync(entryDcts)) {
    console.error(tag, 'missing entry d.cts', entryDcts);
    process.exit(1);
  }

  console.log(tag, 'ok', esmPath);
}

function checkTypes(name) {
  const cfg = SURFACES[name];
  const dts = resolve(root, `dist/${name}.d.ts`);
  const tag = `[check-${name}-types]`;
  if (!existsSync(dts)) {
    console.error(tag, 'missing', dts, '(run pnpm build)');
    process.exit(1);
  }
  const dir = mkdtempSync(join(tmpdir(), `ocm-${name}-types-`));
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
        `import { Editor, ParseError, ${cfg.plugin} } from 'on-codemerge/${name}';`,
        'declare const host: HTMLElement;',
        `const editor: Editor = new Editor(host, { plugins: [${cfg.plugin}({ surface: 'workspace' })] });`,
        'void editor.getText;',
        'const err: Error | null = editor.setText("{}");',
        'void err;',
        'const pe: ParseError = new ParseError("x", 1);',
        'void pe.offset;',
        'const asPe: boolean = err instanceof ParseError;',
        'void asPe;',
      ].join('\n')
    );
    const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
    execFileSync(process.execPath, [tsc, '-p', dir], { stdio: 'inherit' });
    console.log(tag, 'ok (bundler moduleResolution)');
  } catch (err) {
    console.error(tag, 'failed');
    process.exit(typeof err?.status === 'number' ? err.status : 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const name of names) {
  if (modeArg === 'export' || modeArg === 'all') {
    await checkExport(name);
  }
  if (modeArg === 'types' || modeArg === 'all') {
    checkTypes(name);
  }
}
