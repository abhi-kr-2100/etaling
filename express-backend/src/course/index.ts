import { type InferSchemaType, Schema, model } from 'mongoose';
import { sentenceListSchema } from '../sentence-list';

export const courseSchema = new Schema({
  title: { type: String, required: true },
  sentenceLists: { type: [sentenceListSchema], default: [] },
});

export type CourseType = InferSchemaType<typeof courseSchema>;

export default model('Course', courseSchema);
