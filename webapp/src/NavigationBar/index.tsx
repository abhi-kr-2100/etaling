import { Outlet } from 'react-router-dom';

import EtalingAppBar from './EtalingAppBar';
import PageContainer from './PageContainer';

import { getNavbarItems } from '../assets/routes';
import { useAuth0 } from '@auth0/auth0-react';

export default function NavigationBar() {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const navBarItems = getNavbarItems(
    isAuthenticated,
    loginWithRedirect,
    logout,
  );

  return (
    <>
      <EtalingAppBar items={navBarItems} />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </>
  );
}
