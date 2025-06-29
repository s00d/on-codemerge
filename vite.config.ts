import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';

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
