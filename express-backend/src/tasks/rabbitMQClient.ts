import 'dotenv/config';
import amqplib from 'amqplib';

export const rabbitMQConnection = await amqplib.connect(
  process.env.RABBITMQ_URL,
);
