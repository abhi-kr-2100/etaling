import sample from 'lodash/sample';

import { SentenceData } from './Play';

import { getLanguageModel } from '../../../express-backend/src/language-models';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';
import { Typography } from '@mui/material';

export default function FillInTheBlanks({
  sentenceData,
}: FillInTheBlanksProps) {
  const text = sentenceData.sentence.text!;
  const wordToMask = sample(sentenceData.words) as WordScoreType;

  const lm = getLanguageModel(sentenceData.sentence.textLanguageCode!);
  const occurrences = lm.findWord(text, wordToMask.word!.wordText!);
  const occurrenceToMask = sample(occurrences) as [number, number];

  const maskedText =
    text.slice(0, occurrenceToMask[0]) +
    '***' +
    text.slice(occurrenceToMask[1]);

  return <Typography>{maskedText}</Typography>;
}

export interface FillInTheBlanksProps {
  sentenceData: SentenceData;
}
