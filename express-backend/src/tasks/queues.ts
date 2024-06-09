import { rabbitMQConnection } from './rabbitMQClient';

export const CREATE_SCORES_QUEUE = 'CREATE_SCORES';
export const createScoresChannel = await rabbitMQConnection.createChannel();
await createScoresChannel.assertQueue(CREATE_SCORES_QUEUE);
