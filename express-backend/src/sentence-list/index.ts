import { InferSchemaType, Schema, model } from 'mongoose';

export const sentenceListSchema = new Schema({
  title: String,
  owner: Schema.ObjectId,
  sentences: [Schema.ObjectId],
});

export type SentenceListType = InferSchemaType<typeof sentenceListSchema>;

export default model('SentenceList', sentenceListSchema);
