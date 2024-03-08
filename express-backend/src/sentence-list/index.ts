import { InferSchemaType, Schema, model } from 'mongoose';

export const sentenceListSchema = new Schema({
  title: String,
  _ownerId: Schema.ObjectId,
  _sentenceIds: [Schema.ObjectId],
});

export type SentenceListType = InferSchemaType<typeof sentenceListSchema>;

export default model('SentenceList', sentenceListSchema);
