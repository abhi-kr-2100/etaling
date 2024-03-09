import { InferSchemaType, Schema, model } from 'mongoose';

import { LANGUAGE_CODES } from '../../../shared/languages';

export const wordSchema = new Schema({
  wordText: String,
  languageCode: {
    type: String,
    enum: LANGUAGE_CODES,
  },
});

export type WordType = InferSchemaType<typeof wordSchema>;

export default model('Word', wordSchema);
