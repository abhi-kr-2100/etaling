import { Chip } from '@mui/material';
import { CorrectedWordScoreType } from './Play';

export default function Word({ wordText, wordScore }: WordProps) {
  return (
    <Chip
      color="primary"
      size="small"
      label={wordText || wordScore.word!.wordText!}
    />
  );
}

export interface WordProps {
  wordText: string;
  wordScore: CorrectedWordScoreType;
}
