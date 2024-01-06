import { defineConfig } from 'vite';
import * as path from "path";

export default defineConfig({
  // Конфигурация для сборки всех пакетов и приложения
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts'), // Основная точка входа
        editor: path.resolve(__dirname, 'packages/editor/src/index.ts'),
        // Добавьте здесь другие плагины
      },
      output: {
        // Настройка для размещения файлов плагинов в подпапках dist/plugins
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'main') {
            return 'main.js';
          }
          return `plugins/[name].js`;
        }
      }
    }
  }
});
