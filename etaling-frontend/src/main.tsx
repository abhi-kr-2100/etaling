import React from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@emotion/react';

import './i18next.ts';

import theme from './assets/theme.tsx';

import Homepage from './Homepage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Homepage />
    </ThemeProvider>
  </React.StrictMode>,
);
