import sample from 'lodash/sample';

import { SentenceData } from './Play';

import { getLanguageModel } from '../../../express-backend/src/language-models';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';
import { Typography } from '@mui/material';
import { useMemo } from 'react';

export default function FillInTheBlanks({
  sentenceData,
}: FillInTheBlanksProps) {
  const text = sentenceData.sentence.text!;
  const wordToMask = useMemo(
    () => sample(sentenceData.words) as WordScoreType,
    [sentenceData],
  );

  const lm = getLanguageModel(sentenceData.sentence.textLanguageCode!);
  const occurrences = lm.findWord(text, wordToMask.word!.wordText!);
  const occurrenceToMask = useMemo(
    () => sample(occurrences) as [number, number],
    [occurrences],
  );

  const maskedText =
    text.slice(0, occurrenceToMask[0]) +
    '***' +
    text.slice(occurrenceToMask[1]);

  return <Typography>{maskedText}</Typography>;
}

export interface FillInTheBlanksProps {
  sentenceData: SentenceData;
}
