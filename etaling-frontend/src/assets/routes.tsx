import { t } from 'i18next';
import ErrorPage from '../ErrorPage';
import Homepage from '../Homepage';
import NavigationBar from '../NavigationBar';

export default [
  {
    path: '/',
    element: <NavigationBar />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Homepage />,
      },
    ],
  },
];

export const navbarItems = [
  {
    path: '/',
    title: t('Home', { ns: 'NavigationBar' }),
  },
];
