import { Box, Typography, styled } from '@mui/material';
import { NavBarItem } from '../assets/routes';
import { Link } from 'react-router-dom';

export default function MenuItem({ title, path }: NavBarItem) {
  return (
    <Box>
      <Typography>
        <MenuItemLink to={path}>{title}</MenuItemLink>
      </Typography>
    </Box>
  );
}

export const MenuItemLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.common.black,
}));
