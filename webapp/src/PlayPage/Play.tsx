import { SentenceType } from '../../../express-backend/src/sentence';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';
import FillInTheBlanks from './FillInTheBlanks';

export default function Play({ sentences }: PlayProps) {
  return (
    <>
      {sentences.map((s) => (
        <FillInTheBlanks sentenceData={s} key={s.sentence.text} />
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
