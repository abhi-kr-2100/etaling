import { InferSchemaType, Schema, model } from 'mongoose';
import { userProfileSchema } from '../user-profile';

export const sentenceListSchema = new Schema({
  title: String,
  isPublic: { type: Boolean, default: true },
  owner: userProfileSchema,
});

export type SentenceListType = InferSchemaType<typeof sentenceListSchema>;

export default model('SentenceList', sentenceListSchema);
