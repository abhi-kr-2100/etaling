import { Schema, InferSchemaType, model } from 'mongoose';
import { LANGUAGE_CODES } from '../../../webapp/src/assets/language';

export const sentenceSchema = new Schema({
  text: String,
  textLanguageCode: LANGUAGE_CODES,
  _translationIds: [Schema.ObjectId],
});

export type SentenceType = InferSchemaType<typeof sentenceSchema>;

export default model('Sentence', sentenceSchema);
