import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import banner from 'vite-plugin-banner';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Читаем package.json для получения версии и информации об авторе
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
    postcss: './postcss.config.js',
  },
  plugins: [
    svgLoader({
      svgoConfig: {
        multipass: true,
      },
    }),
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json',
      outDir: 'dist/types',
    }),
    wasm(),
    banner( `${packageJson.name} v${packageJson.version} @author ${packageJson.author} @license ${packageJson.license} @homepage ${packageJson.homepage} @repository ${packageJson.repository.url} Copyright (c) ${new Date().getFullYear()} ${packageJson.author} - Built on ${new Date().toISOString()}`),
  ],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        app: './src/app.ts',
        main: './src/main.ts',
        HTMLEditor: './src/core/HTMLEditor.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: true,
        dir: 'dist',
        exports: 'named',
      },
    },
  },
  optimizeDeps: {
    // Убедитесь, что WASM включен в оптимизацию зависимостей
    exclude: ['spellchecker-wasm'], // Исключите WASM-библиотеку из оптимизации
  },
});
