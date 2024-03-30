import { Request, Response, NextFunction } from 'express';

import { Types } from 'mongoose';
import { UserProfile } from '../user-profile';
import createScoresForUser from '../scripts/ScoreCreator';

export default async function createUserSpecificScores(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth?.payload.sub || !req.params?.id) {
    return next();
  }

  const user = await UserProfile.findOne({ userId: req.auth.payload.sub });
  await createScoresForUser(user._id, new Types.ObjectId(req.params.id));

  return next();
}
