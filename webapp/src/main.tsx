import React from 'react';
import ReactDOM from 'react-dom/client';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { Auth0Provider } from '@auth0/auth0-react';
import { QueryClientProvider } from '@tanstack/react-query';

import 'normalize.css';
import './i18next.ts';

import theme from './assets/theme.tsx';
import routes from './assets/routes.tsx';
import { queryClient } from './queries';

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }}
      >
        <ThemeProvider theme={theme}>
          <RouterProvider router={router} />
        </ThemeProvider>
      </Auth0Provider>
    </QueryClientProvider>
  </React.StrictMode>,
);
