import { InferSchemaType, Schema, model } from 'mongoose';

export const userProfileSchema = new Schema({
  // this is not the MongoDB ObjectId, but a unique identifier passed
  // in the payload to the JWT token
  userId: String,
  configuredSentenceLists: {
    type: [Schema.ObjectId],
    require: false,
    default: [],
  },
});

export type UserProfileType = InferSchemaType<typeof userProfileSchema>;

export const UserProfile = model('UserProfile', userProfileSchema);
