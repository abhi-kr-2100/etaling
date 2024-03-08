import { Schema, model } from 'mongoose';

import { LANGUAGE_CODES } from '../../../webapp/src/assets/language';

export const wordSchema = new Schema({
  wordText: String,
  languageCode: LANGUAGE_CODES,
});

export default model('Word', wordSchema);
