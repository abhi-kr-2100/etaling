import type { Channel, ConsumeMessage } from 'amqplib';
import Client from 'ioredis';
import { createSomeScoresForUser } from '../../middlewares/helpers';
import { UserProfile, type UserProfileType } from '../../user-profile';
import { Types } from 'mongoose';

export async function createScores(
  message: ConsumeMessage,
  channel: Channel,
  redisCluster: Client,
) {
  const { user, sentenceListId } = JSON.parse(message.content.toString()) as {
    user: UserProfileType & {
      _id: Types.ObjectId;
    };
    sentenceListId: string;
  };

  const flagName = `flag:createUserSpecificScores:${user._id.toString()}:${sentenceListId}`;
  const wasFlagNotAlreadySet = await redisCluster.setnx(flagName, 'acquired');

  if (wasFlagNotAlreadySet === 0) {
    // Task is already being processed. This is a duplicate and can be ignored.
    return;
  }

  try {
    await createSomeScoresForUser(user, sentenceListId);
    const savedUser = await UserProfile.findById(user._id);
    if (savedUser === null) {
      console.error(
        `Given user was not found in the database! ID was ${user._id}.`,
      );
      process.exit(1);
    }
    savedUser.configuredSentenceLists.push(new Types.ObjectId(sentenceListId));
    await savedUser.save();
    channel.ack(message);
  } finally {
    await redisCluster.del(flagName);
  }
}
