import { t } from 'i18next';

import ErrorPage from '../ErrorPage';
import Homepage from '../Homepage';
import NavigationBar from '../NavigationBar';
import LoginPage from '../LoginPage';

const routes = [
  {
    path: '/',
    element: <NavigationBar />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Homepage />,
        title: t('Home', { ns: 'NavigationBar' }),
      },
      {
        path: '/login',
        element: <LoginPage />,
        title: t('Login', { ns: 'Navigationbar' }),
      },
    ],
  },
];

export default routes;

export const navbarItems = routes[0].children.map((route) => ({
  path: route.path,
  title: route.title,
})) as NavBarItem[];

export interface NavBarItem {
  path: string;
  title: string;
}
