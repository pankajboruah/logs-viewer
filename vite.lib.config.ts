import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    dts({
      tsconfigPath: 'tsconfig.lib.json',
      include: [
        'src/LogsViewer/**',
        'src/components/**',
        'src/theme/**',
        'src/utils/**',
        'src/index.ts',
        'src/vite-env.d.ts',
      ],
      insertTypesEntry: true,
      rollupTypes: false,
    }),
  ],
  resolve: {
    alias: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api',
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'logs-viewer.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@mui/material',
        '@mui/system',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'monaco-editor',
        '@monaco-editor/react',
      ],
    },
  },
});
