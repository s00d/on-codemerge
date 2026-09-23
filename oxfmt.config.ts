import { defineConfig } from 'oxfmt';

/** @type {import('oxfmt').Config} */
export default defineConfig({
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  ignorePatterns: [
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    'pnpm-lock.yaml',
    'docs/.vitepress/cache/**',
    'docs/.vitepress/dist/**',
  ],
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
});
