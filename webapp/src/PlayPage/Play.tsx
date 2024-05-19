import { useNavigate } from 'react-router-dom';
import { SentenceType } from '../../../express-backend/src/sentence';
import {
  ScoreType,
  WordScoreType,
} from '../../../express-backend/src/word/wordScore';
import { updateSentenceScore, updateWordScore } from '../queries';
import Questions from './Questions';
import { useAuth0 } from '@auth0/auth0-react';
import { Types } from 'mongoose';
import { useEffect } from 'react';
import { useAppDispatch } from '../redux/hooks';
import {
  createdPlaylist,
  destroyedPlaylist,
  updatedWordScore,
} from './playlistSlice';
import { GradeType } from '../../../express-backend/src/word/scoringAlgorithm';

export default function Play({ sentences }: PlayProps) {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(createdPlaylist(sentences));
    return () => {
      dispatch(destroyedPlaylist());
    };
  }, [dispatch, sentences]);

  return (
    <Questions
      afterCheck={async (wasCorrect: boolean, idx: number, wordId: string) => {
        const sentenceScoreId =
          sentences[idx].sentence.sentenceScoreId.toString();
        const grade = (wasCorrect ? 5 : 0) as GradeType;

        const token = await getAccessTokenSilently();
        await Promise.all([
          updateWordScore(token, wordId, grade),
          updateSentenceScore(token, sentenceScoreId, grade),
        ]);
        dispatch(updatedWordScore({ id: wordId, grade }));
      }}
      onFinish={() => navigate('/lists')}
    />
  );
}

export interface PlayProps {
  sentences: SentenceData[];
}

export interface SentenceData {
  sentence: SentenceType & { sentenceScoreId: Types.ObjectId };
  translations: SentenceType[];
  words: CorrectedWordScoreType[];
}

// According to Mongoose lastReviewDate is of type Date, but it's actually a
// string
export type CorrectedWordScoreType = Omit<WordScoreType, 'score'> & {
  _id: string;
  score: Omit<ScoreType, 'lastReviewDate'> & { lastReviewDate: string };
};
