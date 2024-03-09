import { Schema, InferSchemaType, model } from 'mongoose';
import { LANGUAGE_CODES } from '../../../shared/languages';
import { sentenceListSchema } from '../sentence-list';

export const sentenceSchema = new Schema({
  text: String,
  textLanguageCode: {
    type: String,
    enum: LANGUAGE_CODES,
  },
  translations: [Schema.ObjectId],
  sentenceList: sentenceListSchema,
});

export type SentenceType = InferSchemaType<typeof sentenceSchema>;

export default model('Sentence', sentenceSchema);
