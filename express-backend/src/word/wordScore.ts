import { type InferSchemaType, Schema, model } from 'mongoose';
import { wordSchema } from './word';
import { userProfileSchema } from '../user-profile';

export const scoreSchema = new Schema({
  repetitionNumber: { type: Number, min: 0, default: 0 },
  easinessFactor: { type: Number, default: 2.5 },
  interRepetitionIntervalInDays: {
    type: Number,
    min: 1,
    default: 1,
  },
  lastReviewDate: { type: Date },
});

export const wordScoreSchema = new Schema({
  word: { type: wordSchema, required: true },
  owner: { type: userProfileSchema, required: true },

  score: { type: scoreSchema, required: true },
});

export type WordScoreType = InferSchemaType<typeof wordScoreSchema>;
export type ScoreType = InferSchemaType<typeof scoreSchema>;

export default model('WordScore', wordScoreSchema);
