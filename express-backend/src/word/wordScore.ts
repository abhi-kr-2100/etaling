import { InferSchemaType, Schema, model } from 'mongoose';

export const scoreSchema = new Schema({
  repetitionNumber: { type: Number, min: 0, default: 0 },
  easinessFactor: { type: Number, default: 2.5 },
  interRepetitionIntervalInDays: { type: Number, min: 1, required: false },
  lastReviewDate: { type: Date, required: false },
});

export const wordScoreSchema = new Schema({
  _wordId: Schema.ObjectId,
  _userId: Schema.ObjectId,

  score: scoreSchema,
});

export type WordScoreType = InferSchemaType<typeof wordScoreSchema>;
export type ScoreType = InferSchemaType<typeof scoreSchema>;

export default model('WordScore', wordScoreSchema);
