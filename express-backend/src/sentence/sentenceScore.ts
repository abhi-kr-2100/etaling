import { InferSchemaType, Schema, model } from 'mongoose';
import { scoreSchema } from '../word/wordScore';
import { sentenceSchema } from '.';

export const sentenceScoreSchema = new Schema({
  sentence: sentenceSchema,
  user: Schema.ObjectId,

  score: scoreSchema,
  level: Number,
});

export type SentenceScoreType = InferSchemaType<typeof sentenceScoreSchema>;

export default model('SentenceScore', sentenceScoreSchema);
