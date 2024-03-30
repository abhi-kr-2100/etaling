import ampqlib from 'amqplib';
import { CREATE_SCORES_QUEUE } from './queues';

export const rabbitMQConnection = await ampqlib.connect(
  process.env.RABBITMQ_URL,
);

export const createScoresChannel = await rabbitMQConnection.createChannel();
await createScoresChannel.assertQueue(CREATE_SCORES_QUEUE);
