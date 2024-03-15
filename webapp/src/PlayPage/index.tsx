import { Typography } from '@mui/material';
import { Navigate, useParams } from 'react-router-dom';
import { getPlaylist, useAuthenticatedQuery } from '../queries';
import { useAuth0 } from '@auth0/auth0-react';

export default function PlayPage() {
  const { id: listId } = useParams();
  const { isAuthenticated, isLoading: isAuthenticating } = useAuth0();

  const {
    data: playlist,
    error: playlistFetchError,
    isLoading: isFetchingPlaylist,
  } = useAuthenticatedQuery(
    {
      queryKey: [`playlist-${listId}`],
      queryFn: getPlaylist,
      enabled: isAuthenticated,
    },
    listId,
    10,
    'en',
  );

  if (playlistFetchError) {
    return (
      <Typography>
        Error fetching playlist: {playlistFetchError.name}:{' '}
        {playlistFetchError.message}
      </Typography>
    );
  }

  if (isFetchingPlaylist || isAuthenticating) {
    return <Typography>Loading...</Typography>;
  }

  if (!isAuthenticated) {
    return <Navigate to={'/login'} replace />;
  }

  return <Typography>{playlist}</Typography>;
}
