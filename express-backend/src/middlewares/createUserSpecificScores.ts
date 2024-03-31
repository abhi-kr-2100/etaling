import { Request, Response, NextFunction } from 'express';

import { createScoresChannel } from '../tasks';
import { CREATE_SCORES_QUEUE } from '../tasks/queues';

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

  const lockName = `lock:${user._id.toString()}:${req.params.id}`;
  const acquired = await redisCluster.setnx(lockName, 'acquired');
  if (acquired === 0) {
    console.error(`createUserSpecificScores: couldn't acquire ${lockName}`);
    return next();
  }
  const limit = Number.parseInt(req.query.limit as string);
  await createSomeScoresForUser(user, req.params.id, limit);
  await redisCluster.del(lockName);

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
