import { Schema, model } from 'mongoose';

export const userProfileSchema = new Schema({
  userId: String,
});

export const UserProfile = model('UserProfile', userProfileSchema);
