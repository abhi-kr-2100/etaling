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

interface EFUpdateInfo {
  id: string;
  ef: number;
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

    updatedEF(state, action: PayloadAction<EFUpdateInfo>) {
      const { id: wordId, ef } = action.payload;
      state.sentences.forEach((sentence, sidx) => {
        sentence.words.forEach((word, widx) => {
          if (word._id !== wordId) {
            return;
          }

          state.sentences[sidx].words[widx].score.easinessFactor = ef;
        });
      });
    },

    destroyedPlaylist(state) {
      state.sentences = [];
    },
  },
});

export const {
  createdPlaylist,
  updatedWordScore,
  updatedEF,
  destroyedPlaylist,
} = playlistSlice.actions;
export default playlistSlice.reducer;
