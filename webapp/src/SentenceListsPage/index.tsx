import { Box, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { getSentenceLists, useAuthenticatedQuery } from '../queries';
import { useAuth0 } from '@auth0/auth0-react';
import ItemList from '../components/ItemList';
import SentenceListTile from './SentenceListTile';

export default function SentenceListsPage() {
  const { isAuthenticated, isLoading: isAuthenticating } = useAuth0();

  const {
    data: sentenceLists,
    error: sentenceListsFetchError,
    isLoading: isFetchingSentenceLists,
  } = useAuthenticatedQuery({
    queryKey: ['sentence-list'],
    queryFn: getSentenceLists,
    enabled: isAuthenticated,
  });

  if (sentenceListsFetchError) {
    return (
      <Typography>
        Error fetching sentence lists: {sentenceListsFetchError.name}:{' '}
        {sentenceListsFetchError.message}
      </Typography>
    );
  }

  if (isFetchingSentenceLists || isAuthenticating) {
    return <Typography>Loading...</Typography>;
  }

  if (!isAuthenticated) {
    return <Navigate to={'/login'} replace />;
  }

  return (
    <Box width={'100%'} height={'100%'} padding={'1em'} marginTop={'64px'}>
      <ItemList
        items={sentenceLists}
        itemToTile={(item) => (
          <SentenceListTile key={item.title} title={item.title} />
        )}
        style={{
          gap: '20px',
        }}
      />
    </Box>
  );
}
