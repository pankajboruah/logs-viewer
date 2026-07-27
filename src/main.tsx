import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import DemoApp from './demo/DemoApp';

const darkTheme = createTheme({ palette: { mode: 'dark' } });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <DemoApp />
    </ThemeProvider>
  </React.StrictMode>
);
