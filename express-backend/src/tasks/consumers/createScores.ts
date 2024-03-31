import 'dotenv/config';
import { redisCluster } from '../../db/redis';

import ampqlib, { ConsumeMessage } from 'amqplib';
import { CREATE_SCORES_QUEUE } from '../queues';
import { createSomeScoresForUser } from '../../middlewares/helpers';
import { UserProfileType } from '../../user-profile';
import { Document, Types } from 'mongoose';

const rabbitMQConnection = await ampqlib.connect(process.env.RABBITMQ_URL);

const createScoresChannel = await rabbitMQConnection.createChannel();
await createScoresChannel.assertQueue(CREATE_SCORES_QUEUE);
createScoresChannel.consume(CREATE_SCORES_QUEUE, createScores);

export async function createScores(message: ConsumeMessage) {
  const { user, sentenceListId } = JSON.parse(message.content.toString()) as {
    user: Document<Types.ObjectId, {}, UserProfileType> &
      UserProfileType & {
        _id: Types.ObjectId;
      };
    sentenceListId: string;
  };

  const lockName = `lock:${user._id.toString()}:${sentenceListId}`;
  const acquired = await redisCluster.setnx(lockName, 'acquired');

  if (acquired === 0) {
    // Task is already being processed. This is a duplicate and can be ignored.
    return;
  }

  try {
    await createSomeScoresForUser(user, sentenceListId);
    user.configuredSentenceLists.push(new Types.ObjectId(sentenceListId));
    await user.save();
    createScoresChannel.ack(message);
  } finally {
    await redisCluster.del(lockName);
  }
}
