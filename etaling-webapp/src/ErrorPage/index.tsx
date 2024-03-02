import { Box, Typography } from '@mui/material';
import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <Box
      width={'100%'}
      height={'100%'}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <Typography variant="h1">Oops!</Typography>
      <Typography variant="h2">
        Sorry, an unexpected error has occurred.
      </Typography>
      <Typography>{error.statusText ?? error.message}</Typography>
    </Box>
  );
}
