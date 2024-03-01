import { AppBar, Toolbar } from '@mui/material';
import { NavBarItem } from '../assets/routes';
import MenuItem from './MenuItem';

export default function EtalingAppBar({ items }: EtalingAppBarProps) {
  return (
    <AppBar position="sticky">
      <Toolbar>
        {items.map((item) => (
          <MenuItem title={item.title} path={item.path} key={item.title} />
        ))}
      </Toolbar>
    </AppBar>
  );
}

export interface EtalingAppBarProps {
  items: NavBarItem[];
}
