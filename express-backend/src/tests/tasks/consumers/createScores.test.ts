import { afterEach, describe, it, expect } from '@jest/globals';
import { UserProfile } from '../../../user-profile';
import SentenceList from '../../../sentence-list';
import WordScore from '../../../word/wordScore';
import Sentence from '../../../sentence';
import Word from '../../../word/word';
import SentenceScore from '../../../sentence/sentenceScore';
import { createScores } from '../../../tasks/consumers/createScores';
import { redisCluster } from '../../../db/redis';
import { ConsumeMessageFields, MessageProperties } from 'amqplib';
import { createScoresChannel } from '../../../tasks/queues';

describe('create user specific scores consumer', async () => {
  const testUser = await UserProfile.create({
    userId: 'google-oauth2|113671952727045600873',
  });
  const [testSentenceList1, testSentenceList2] = await Promise.all([
    SentenceList.create({
      title: 'Test Sentence List',
      owner: testUser,
    }),
    SentenceList.create({
      title: 'Test Sentence List 2',
      owner: testUser,
    }),
  ]);

  const [testSentences1, testSentences2, testWords] = await Promise.all([
    Sentence.insertMany(
      Array.from({ length: 100 }).map((_, idx) => ({
        text: `test${idx}`,
        textLanguageCode: 'en',
        sentenceList: testSentenceList1,
      })),
    ),
    Sentence.insertMany(
      Array.from({ length: 100 }).map((_, idx) => ({
        text: `test${idx}`,
        textLanguageCode: 'en',
        sentenceList: testSentenceList2,
      })),
    ),
    Word.insertMany(
      Array.from({ length: 100 }).map((_, idx) => ({
        wordText: `test${idx}`,
        languageCode: 'en',
      })),
    ),
  ]);

  const lockKey1 = `lock:${testUser._id.toString()}:${testSentenceList1._id.toString()}`;

  afterEach(async () => {
    await WordScore.deleteMany({});
    await SentenceScore.deleteMany({});

    testUser.configuredSentenceLists = [];
    await testUser.save();

    await redisCluster.del(lockKey1);
  });

  it('should do nothing if another create scores task is already underway for the given user and sentence list', async () => {
    await redisCluster.set(lockKey1, 'acquired');
    await createScores(
      {
        content: Buffer.from(
          JSON.stringify({
            user: testUser,
            sentenceListId: testSentenceList1._id.toString(),
          }),
        ),
        fields: {} as unknown as ConsumeMessageFields,
        properties: {} as unknown as MessageProperties,
      },
      createScoresChannel,
      redisCluster,
    );

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);
    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });

  it('should create sentence scores and word scores', async () => {
    await createScores(
      {
        content: Buffer.from(
          JSON.stringify({
            user: testUser,
            sentenceListId: testSentenceList1._id.toString(),
          }),
        ),
        fields: {} as unknown as ConsumeMessageFields,
        properties: {} as unknown as MessageProperties,
      },
      createScoresChannel,
      redisCluster,
    );

    const [sentenceScores, wordScores, user] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
      UserProfile.findOne({}),
    ]);

    expect(sentenceScores.length).toBe(testSentences1.length);
    expect(wordScores.length).toBe(testWords.length);
    expect(user.configuredSentenceLists.length).toBe(1);
    expect(user.configuredSentenceLists.map((sl) => sl.toString())).toContain(
      testSentenceList1._id.toString(),
    );
  });

  it('should not create duplicate scores', async () => {
    await redisCluster.del(lockKey1);
    await Promise.all([
      createScores(
        {
          content: Buffer.from(
            JSON.stringify({
              user: testUser,
              sentenceListId: testSentenceList1._id.toString(),
            }),
          ),
          fields: {} as unknown as ConsumeMessageFields,
          properties: {} as unknown as MessageProperties,
        },
        createScoresChannel,
        redisCluster,
      ),
      createScores(
        {
          content: Buffer.from(
            JSON.stringify({
              user: testUser,
              sentenceListId: testSentenceList1._id.toString(),
            }),
          ),
          fields: {} as unknown as ConsumeMessageFields,
          properties: {} as unknown as MessageProperties,
        },
        createScoresChannel,
        redisCluster,
      ),
    ]);

    const [sentenceScores, wordScores, user] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
      UserProfile.findOne({}),
    ]);

    expect(sentenceScores.length).toBe(testSentences1.length);
    expect(wordScores.length).toBe(testWords.length);
    expect(user.configuredSentenceLists.length).toBe(1);
    expect(user.configuredSentenceLists.map((sl) => sl.toString())).toContain(
      testSentenceList1._id.toString(),
    );
  });
});
