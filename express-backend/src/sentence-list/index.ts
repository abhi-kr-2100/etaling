import { type InferSchemaType, Schema, model } from 'mongoose';
import { userProfileSchema } from '../user-profile';

export const sentenceListSchema = new Schema({
  title: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
  owner: { type: userProfileSchema, required: true },
});

export type SentenceListType = InferSchemaType<typeof sentenceListSchema>;

export default model('SentenceList', sentenceListSchema);
