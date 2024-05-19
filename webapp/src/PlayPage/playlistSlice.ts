import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SentenceData } from './Play';
import getUpdatedWordScore, {
  GradeType,
} from '../../../express-backend/src/word/scoringAlgorithm';
import { ScoreType } from '../../../express-backend/src/word/wordScore';

interface PlaylistState {
  sentences: SentenceData[];
}

interface ScoreUpdateInfo {
  id: string;
  grade: GradeType;
}

const initialState: PlaylistState = {
  sentences: [],
};

const playlistSlice = createSlice({
  name: 'playlist',
  initialState,
  reducers: {
    createdPlaylist(state, action: PayloadAction<SentenceData[]>) {
      state.sentences = action.payload;
    },

    updatedWordScore(state, action: PayloadAction<ScoreUpdateInfo>) {
      const { id: wordId, grade } = action.payload;
      state.sentences.forEach((sentence, sidx) => {
        sentence.words.forEach((word, widx) => {
          if (word._id !== wordId) {
            return;
          }

          const updatedScore = getUpdatedWordScore(
            grade,
            word.score as unknown as ScoreType,
          );
          state.sentences[sidx].words[widx].score = {
            ...updatedScore,
            lastReviewDate: updatedScore.lastReviewDate!.toISOString(),
          };
        });
      });
    },

    destroyedPlaylist(state) {
      state.sentences = [];
    },
  },
});

export const { createdPlaylist, updatedWordScore, destroyedPlaylist } =
  playlistSlice.actions;
export default playlistSlice.reducer;
