import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/web/calendar-app.tsx'),
      name: 'KingAirCalendar',
      formats: ['iife'],
      fileName: () => 'calendar.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'calendar.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
});
