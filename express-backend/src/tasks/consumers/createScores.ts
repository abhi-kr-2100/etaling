import { Channel, ConsumeMessage } from 'amqplib';
import Client from 'ioredis';
import { createSomeScoresForUser } from '../../middlewares/helpers';
import { UserProfile, UserProfileType } from '../../user-profile';
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

  const lockName = `lock:${user._id.toString()}:${sentenceListId}`;
  const acquired = await redisCluster.setnx(lockName, 'acquired');

  if (acquired === 0) {
    // Task is already being processed. This is a duplicate and can be ignored.
    return;
  }

  try {
    await createSomeScoresForUser(user, sentenceListId);
    const savedUser = await UserProfile.findById(user._id);
    savedUser.configuredSentenceLists.push(new Types.ObjectId(sentenceListId));
    await savedUser.save();
    channel.ack(message);
  } finally {
    await redisCluster.del(lockName);
  }
}
