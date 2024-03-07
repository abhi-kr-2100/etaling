import { Box, Button, Typography, styled } from '@mui/material';
import { NavBarItem } from '../assets/routes';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function MenuItem({ title, path, onClick }: NavBarItem) {
  useEffect(() => {
    if (path && onClick) {
      console.error('Both path and onClick passed to MenuItem');
    } else if (!path && !onClick) {
      console.error('Neither path, nor onClick passed to MenuItem');
    }
  }, [path, onClick]);

  return (
    <Box>
      <Typography>
        {path ? (
          <MenuItemLink to={path}>{title}</MenuItemLink>
        ) : onClick ? (
          <MenuItemButton onClick={onClick}>{title}</MenuItemButton>
        ) : null}
      </Typography>
    </Box>
  );
}

export const MenuItemLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.common.black,
}));

export const MenuItemButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: theme.palette.common.black,
}));
