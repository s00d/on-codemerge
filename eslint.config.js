import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['src/**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off', // Добавлено правило
      '@typescript-eslint/no-unused-vars': 'off', // Добавлено правило
      'no-case-declarations': 'off', // Добавлено правило
      '@typescript-eslint/no-explicit-any': 'off', // Добавлено правило
      'no-useless-escape': 'off', // Добавлено правило
      "no-useless-backreference": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  configPrettier,
];
