import { redisCluster } from '../../db/redis';

import ampqlib from 'amqplib';
import { CREATE_SCORES_QUEUE } from '../queues';
import { createSomeScoresForUser } from '../../middlewares/helpers';

const rabbitMQConnection = await ampqlib.connect(process.env.RABBITMQ_URL);

const createScoresChannel = await rabbitMQConnection.createChannel();
await createScoresChannel.assertQueue(CREATE_SCORES_QUEUE);
createScoresChannel.consume(CREATE_SCORES_QUEUE, async (message) => {
  if (message === null) {
    return;
  }

  const { user, sentenceListId } = JSON.parse(message.content.toString());

  const lockName = `lock:${user._id.toString()}:${sentenceListId}`;
  const acquired = await redisCluster.setnx(lockName, 'acquired');

  if (acquired === 0) {
    // Task is already being processed. This is a duplicate and can be ignored.
    return;
  }

  try {
    await createSomeScoresForUser(user, sentenceListId);
    createScoresChannel.ack(message);
  } finally {
    await redisCluster.del(lockName);
  }
});
