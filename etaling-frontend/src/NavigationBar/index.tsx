import { Box } from '@mui/material';

import { navbarItems } from '../assets/routes';
import { Link, Outlet } from 'react-router-dom';

export default function NavigationBar() {
  return (
    <>
      <Box>
        <ul>
          {navbarItems.map((route) => (
            <li key={route.title}>
              <Link to={route.path}>{route.title}</Link>
            </li>
          ))}
        </ul>
      </Box>
      <Outlet />
    </>
  );
}
