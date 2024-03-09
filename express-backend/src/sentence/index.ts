import { Schema, InferSchemaType, model } from 'mongoose';
import { LANGUAGE_CODES } from '../../../shared/languages';

export const sentenceSchema = new Schema({
  text: String,
  textLanguageCode: LANGUAGE_CODES,
  translations: [Schema.ObjectId],
});

export type SentenceType = InferSchemaType<typeof sentenceSchema>;

export default model('Sentence', sentenceSchema);
