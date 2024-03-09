import { InferSchemaType, Schema, model } from 'mongoose';
import { scoreSchema } from '../word/wordScore';
import { sentenceSchema } from '.';
import { userProfileSchema } from '../user-profile';

export const sentenceScoreSchema = new Schema({
  sentence: sentenceSchema,
  owner: userProfileSchema,

  score: scoreSchema,
  level: Number,
});

export type SentenceScoreType = InferSchemaType<typeof sentenceScoreSchema>;

export default model('SentenceScore', sentenceScoreSchema);
