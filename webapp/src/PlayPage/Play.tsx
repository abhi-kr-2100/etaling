import { Typography } from '@mui/material';
import { SentenceType } from '../../../express-backend/src/sentence';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';

export default function Play({ sentences }: PlayProps) {
  return (
    <>
      {sentences.map((s) => (
        <Typography key={s.sentence._id as string}>
          {s.sentence.text}
        </Typography>
      ))}
    </>
  );
}

export interface PlayProps {
  sentences: SentenceData[];
}

export interface SentenceData {
  sentence: SentenceType;
  translations: SentenceType[];
  words: WordScoreType[];
}
