import { InferSchemaType, Schema, model } from 'mongoose';

import { LANGUAGE_CODES } from '../../../shared/languages';

export const wordSchema = new Schema({
  wordText: { type: String, required: true },
  languageCode: {
    type: String,
    enum: LANGUAGE_CODES,
    required: true,
  },
});

export type WordType = InferSchemaType<typeof wordSchema>;

export default model('Word', wordSchema);
