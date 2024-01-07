import path from 'path';
import {defineConfig} from "vite";

export default defineConfig({
  root: './src',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        dir: `docs/`,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
