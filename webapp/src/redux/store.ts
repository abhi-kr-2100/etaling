import { configureStore } from '@reduxjs/toolkit';
import playlistReducer from '../PlayPage/playlistSlice';

export const store = configureStore({
  reducer: {
    playlist: playlistReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
