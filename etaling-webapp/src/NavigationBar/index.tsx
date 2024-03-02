import { Outlet } from 'react-router-dom';

import EtalingAppBar from './EtalingAppBar';
import PageContainer from './PageContainer';

import { navbarItems } from '../assets/routes';

export default function NavigationBar() {
  return (
    <>
      <EtalingAppBar items={navbarItems} />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </>
  );
}
