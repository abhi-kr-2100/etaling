import { InferSchemaType, Schema, model } from 'mongoose';

export const sentenceListSchema = new Schema({
  title: String,
  isPublic: { type: Boolean, default: true },
  owner: Schema.ObjectId,
  sentences: [Schema.ObjectId],
});

export type SentenceListType = InferSchemaType<typeof sentenceListSchema>;

export default model('SentenceList', sentenceListSchema);
