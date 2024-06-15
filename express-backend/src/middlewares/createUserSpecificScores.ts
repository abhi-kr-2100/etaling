import { Request, Response, NextFunction } from 'express';

import { CREATE_SCORES_QUEUE, createScoresChannel } from '../tasks/queues';

import { UserProfile } from '../user-profile';
import { createSomeScoresForUser } from './helpers';
import { redisCluster } from '../db/redis';

export default async function createUserSpecificScores(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth?.payload.sub || !req.params?.id) {
    return next();
  }

  const user = await UserProfile.findOne({ userId: req.auth.payload.sub });
  const configuredSentenceListIds = user.configuredSentenceLists.map((id) =>
    id.toString(),
  );
  if (configuredSentenceListIds.includes(req.params.id)) {
    return next();
  }

  const flagName = `flag:createUserSpecificScores:${user._id.toString()}:${req.params.id}`;
  const wasFlagNotAlreadySet = await redisCluster.setnx(flagName, 'acquired');
  if (wasFlagNotAlreadySet === 0) {
    console.error(`createUserSpecificScores:  ${flagName} already set.`);
    return next();
  }
  const limit = Number.parseInt(req.query.limit as string);
  await createSomeScoresForUser(user, req.params.id, limit);
  await redisCluster.del(flagName);

  createScoresChannel.sendToQueue(
    CREATE_SCORES_QUEUE,
    Buffer.from(
      JSON.stringify({
        user,
        sentenceListId: req.params.id,
      }),
    ),
  );

  return next();
}
