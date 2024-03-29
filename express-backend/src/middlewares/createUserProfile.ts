import { Request, Response, NextFunction } from 'express';

import { UserProfile } from '../user-profile';

export default async function createUserProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth?.payload.sub) {
    return next();
  }

  const existingUser = await UserProfile.findOne({
    userId: req.auth.payload.sub,
  });
  if (existingUser) {
    return next();
  }

  await UserProfile.create({
    userId: req.auth.payload.sub,
  });

  return next();
}
