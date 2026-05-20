import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // React + works-calendar's deps reference Node's `process` at module-eval
  // time. Vite's library mode does NOT inject it, so the browser throws
  // "process is not defined" before anything mounts. Replace the common
  // NODE_ENV check at build time and ship a tiny runtime shim for any
  // remaining bare `process.` accesses.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/web/calendar-app.tsx'),
      name: 'JetCalendar',
      formats: ['iife'],
      fileName: () => 'calendar.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'calendar.[ext]',
        inlineDynamicImports: true,
        banner: 'window.process=window.process||{env:{NODE_ENV:"production"}};window.global=window.global||window;',
      },
    },
  },
});
