import { InferSchemaType, Schema, model } from 'mongoose';
import { wordSchema } from './word';

export const scoreSchema = new Schema({
  repetitionNumber: { type: Number, min: 0, default: 0 },
  easinessFactor: { type: Number, default: 2.5 },
  interRepetitionIntervalInDays: { type: Number, min: 1, required: false },
  lastReviewDate: { type: Date, required: false },
});

export const wordScoreSchema = new Schema({
  word: wordSchema,
  user: Schema.ObjectId,

  score: scoreSchema,
});

export type WordScoreType = InferSchemaType<typeof wordScoreSchema>;
export type ScoreType = InferSchemaType<typeof scoreSchema>;

export default model('WordScore', wordScoreSchema);
