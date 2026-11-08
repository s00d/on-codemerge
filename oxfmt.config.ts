import { defineConfig } from 'oxfmt';

/** @type {import('oxfmt').Config} */
export default defineConfig({
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  ignorePatterns: [
    '**/dist/**',
    '**/dist-json/**',
    '**/dist-markdown/**',
    '**/node_modules/**',
    '**/coverage/**',
    'pnpm-lock.yaml',
    'docs/.nuxt/**',
    'docs/.output/**',
    'docs/.data/**',
    'docs/content/9.changelog.md',
  ],
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
});
