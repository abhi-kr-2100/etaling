import { Box, Button, Typography } from '@mui/material';

export default function SentenceListTile({ title }: SentenceListTileProps) {
  return (
    <Box borderRadius={'5px'} border={`1px solid`} padding={'1em'}>
      <Typography>{title}</Typography>
      <Box>
        <Button>Play</Button>
      </Box>
    </Box>
  );
}

export interface SentenceListTileProps {
  title: string;
}
