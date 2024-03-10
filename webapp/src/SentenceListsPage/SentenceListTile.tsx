import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function SentenceListTile({ title, id }: SentenceListTileProps) {
  return (
    <Box borderRadius={'5px'} border={`1px solid`} padding={'1em'}>
      <Typography>{title}</Typography>
      <Box>
        <Link to={`/lists/${id}`}>Play</Link>
      </Box>
    </Box>
  );
}

export interface SentenceListTileProps {
  title: string;
  id: string;
}
