import 'dotenv/config';
import '../db/mongo';
import { redisCluster } from '../db/redis';
import type { ConsumeMessage } from 'amqplib';
import { CREATE_SCORES_QUEUE, createScoresChannel } from './queues';
import { createScores } from './consumers/createScores';

createScoresChannel.consume(
  CREATE_SCORES_QUEUE,
  (msg: ConsumeMessage | null) => {
    createScores(msg, createScoresChannel, redisCluster);
  },
);
