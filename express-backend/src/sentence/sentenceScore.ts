import { InferSchemaType, Schema, model } from 'mongoose';
import { scoreSchema } from '../word/wordScore';
import { sentenceSchema } from '.';
import { userProfileSchema } from '../user-profile';

export const sentenceScoreSchema = new Schema({
  sentence: { type: sentenceSchema, required: true },
  owner: { type: userProfileSchema, required: true },

  score: { type: scoreSchema, required: true },
  level: Number,
});

export type SentenceScoreType = InferSchemaType<typeof sentenceScoreSchema>;

export default model('SentenceScore', sentenceScoreSchema);
