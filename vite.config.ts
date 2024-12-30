import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import dts from 'vite-plugin-dts';

export default defineConfig({
  css: {
    postcss: './postcss.config.js', // Укажите путь к конфигурации PostCSS
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
  ],
  build: {
    cssCodeSplit: true, // Включает разделение CSS
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
      external: [], // Укажите внешние зависимости, если они есть
      output: {
        preserveModules: true,
        dir: 'dist',
      },
    },
  },
});
