import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api',
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  build: {
    outDir: 'dist-demo',
    sourcemap: true,
  },
});
