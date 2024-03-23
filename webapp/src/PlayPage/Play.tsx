import { SentenceType } from '../../../express-backend/src/sentence';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';
import Questions from './Questions';

export default function Play({ sentences }: PlayProps) {
  return (
    <Questions
      questions={sentences}
      afterCheck={(wasCorrect: boolean) => console.log(wasCorrect)}
      onFinish={() => console.log('Done!')}
    />
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
