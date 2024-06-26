import { t } from 'i18next';

import ErrorPage from '../ErrorPage';
import Homepage from '../Homepage';
import NavigationBar from '../NavigationBar';
import LoginPage from '../LoginPage';
import SentenceListsPage from '../SentenceListsPage';
import PlayPage from '../PlayPage';

const routes = [
  {
    path: '/',
    element: <NavigationBar />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <Homepage />,
        title: t('Home', { ns: 'NavigationBar' }),
      },
      {
        path: 'lists',
        children: [
          {
            path: '',
            element: <SentenceListsPage />,
            title: t('Lists', { ns: 'NavigationBar' }),
          },
          {
            path: ':id',
            element: <PlayPage />,
            title: t('Play', { ns: 'NavigationBar' }),
          },
        ],
      },
      {
        path: 'login',
        element: <LoginPage />,
        title: t('Login', { ns: 'NavigationBar' }),
      },
    ],
  },
];

export default routes;

export const getNavbarItems = (
  isUserAuthenticated: boolean,
  login: CallableFunction,
  logout: CallableFunction,
) =>
  [
    {
      title: t('Home', { ns: 'NavigationBar' }),
      path: '/',
    },
    {
      title: t('Lists', { ns: 'NavigationBar' }),
      path: '/lists',
    },
    {
      title: t('Login', { ns: 'NavigationBar' }),
      onClick: login,
      hide: isUserAuthenticated,
    },
    {
      title: t('Logout', { ns: 'NavigationBar' }),
      onClick: logout,
      hide: !isUserAuthenticated,
    },
  ] as NavBarItem[];

export interface NavBarItem {
  title: string;
  path?: string;
  onClick?: CallableFunction;
  hide?: boolean;
}
