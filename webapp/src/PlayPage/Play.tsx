import { SentenceType } from '../../../express-backend/src/sentence';
import { WordScoreType } from '../../../express-backend/src/word/wordScore';
import { updateSentenceScore } from '../queries';
import Questions from './Questions';
import { useAuth0 } from '@auth0/auth0-react';
import { Types } from 'mongoose';

export default function Play({ sentences }: PlayProps) {
  const { getAccessTokenSilently } = useAuth0();

  return (
    <Questions
      questions={sentences}
      afterCheck={async (wasCorrect: boolean, idx: number) => {
        const token = await getAccessTokenSilently();
        await updateSentenceScore(
          token,
          sentences[idx].sentence.sentenceScoreId.toString(),
          wasCorrect ? 5 : 0,
        );
      }}
      onFinish={() => console.log('Done!')}
    />
  );
}

export interface PlayProps {
  sentences: SentenceData[];
}

export interface SentenceData {
  sentence: SentenceType & { sentenceScoreId: Types.ObjectId };
  translations: SentenceType[];
  words: WordScoreType[];
}
