import { Chip } from '@mui/material';
import { CorrectedWordScoreType } from './Play';

export default function Word({ wordText, wordScore }: WordProps) {
  const ef = wordScore.score.easinessFactor;
  const color = ef < 2.5 ? 'error' : ef === 2.5 ? 'info' : 'success';

  return (
    <Chip
      color={color}
      size="small"
      label={wordText || wordScore.word!.wordText!}
    />
  );
}

export interface WordProps {
  wordText: string;
  wordScore: CorrectedWordScoreType;
}
