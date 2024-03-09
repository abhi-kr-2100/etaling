import { Schema, model } from 'mongoose';

import { LANGUAGE_CODES } from '../../../shared/languages';

export const wordSchema = new Schema({
  wordText: String,
  languageCode: LANGUAGE_CODES,
});

export default model('Word', wordSchema);
