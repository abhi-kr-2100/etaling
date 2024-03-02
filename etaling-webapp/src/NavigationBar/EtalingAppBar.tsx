import { AppBar } from '@mui/material';
import { NavBarItem } from '../assets/routes';
import MenuItem from './MenuItem';
import EtalingToolbar from './EtalingToolbar';

export default function EtalingAppBar({ items }: EtalingAppBarProps) {
  return (
    <AppBar position="sticky">
      <EtalingToolbar>
        {items
          .filter((item) => !item.hide)
          .map((item) => (
            <MenuItem
              title={item.title}
              path={item.path}
              key={item.title}
              onClick={item.onClick}
            />
          ))}
      </EtalingToolbar>
    </AppBar>
  );
}

export interface EtalingAppBarProps {
  items: NavBarItem[];
}
