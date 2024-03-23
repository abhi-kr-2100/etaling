import { useState } from 'react';
import { SentenceType } from '../../../express-backend/src/sentence';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';
import FillInTheBlanks from './FillInTheBlanks';
import { Box, Button } from '@mui/material';

export default function Play({ sentences }: PlayProps) {
  const [currQuestionIdx, setCurrQuestionIdx] = useState(0);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      sx={{
        gap: 1.5,
      }}
      alignItems={'center'}
    >
      <FillInTheBlanks sentenceData={sentences[currQuestionIdx]} />
      <Button
        disabled={currQuestionIdx == sentences.length - 1}
        onClick={() => setCurrQuestionIdx((prev) => prev + 1)}
      >
        Next
      </Button>
    </Box>
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
