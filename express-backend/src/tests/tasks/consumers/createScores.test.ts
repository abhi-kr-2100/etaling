import {
  afterEach,
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
} from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';
import { createRequest, createResponse } from 'node-mocks-http';
import { UserProfile, UserProfileType } from '../../../user-profile';
import SentenceList, { SentenceListType } from '../../../sentence-list';
import WordScore from '../../../word/wordScore';
import createUserSpecificScores from '../../../middlewares/createUserSpecificScores';
import Sentence, { SentenceType } from '../../../sentence';
import Word, { WordType } from '../../../word/word';
import SentenceScore from '../../../sentence/sentenceScore';
import { createScores } from '../../../tasks/consumers/createScores';
import { redisCluster } from '../../../db/redis';
import { ConsumeMessageFields, MessageProperties } from 'amqplib';

describe('create user specific scores consumer', () => {
  let mongoDB: MongoMemoryServer;
  let req: Request, res: Response, next: NextFunction;

  let testUser: Document<Types.ObjectId, {}, UserProfileType> & UserProfileType,
    testSentenceList1: Document<Types.ObjectId, {}, SentenceListType> &
      SentenceListType,
    testSentenceList2: Document<Types.ObjectId, {}, SentenceListType> &
      SentenceListType,
    testSentences1: (Document<Types.ObjectId, {}, SentenceType> &
      SentenceType)[],
    testSentences2: (Document<Types.ObjectId, {}, SentenceType> &
      SentenceType)[],
    testWords: (Document<Types.ObjectId, {}, WordType> & WordType)[];

  let lockKey1: string;

  beforeAll(async () => {
    await mongoose.disconnect();
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    testUser = await UserProfile.create({
      userId: 'google-oauth2|113671952727045600873',
    });

    [testSentenceList1, testSentenceList2] = await Promise.all([
      SentenceList.create({
        title: 'Test Sentence List',
        owner: testUser,
      }),
      SentenceList.create({
        title: 'Test Sentence List 2',
        owner: testUser,
      }),
    ]);

    lockKey1 = `lock:${testUser._id.toString()}${testSentenceList1._id.toString()}`;

    [testSentences1, testSentences2, testWords] = await Promise.all([
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
  });

  afterEach(async () => {
    await WordScore.deleteMany({});
    await SentenceScore.deleteMany({});

    testUser.configuredSentenceLists = [];
    await testUser.save();

    await redisCluster.del(lockKey1);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  it('should do nothing if another create scores task is already underway for the given user and sentence list', async () => {
    await redisCluster.set(
      `lock:${testUser._id.toString()}:${testSentenceList1._id.toString()}`,
      'acquired',
    );
    await createScores({
      content: Buffer.from(
        JSON.stringify({
          user: testUser,
          sentenceListId: testSentenceList1._id.toString(),
        }),
      ),
      fields: {} as unknown as ConsumeMessageFields,
      properties: {} as unknown as MessageProperties,
    });

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);
    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });

  it('should create sentence scores and word scores', async () => {
    await createScores({
      content: Buffer.from(
        JSON.stringify({
          user: testUser,
          sentenceListId: testSentenceList1._id.toString(),
        }),
      ),
      fields: {} as unknown as ConsumeMessageFields,
      properties: {} as unknown as MessageProperties,
    });

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
    await Promise.all([
      createScores({
        content: Buffer.from(
          JSON.stringify({
            user: testUser,
            sentenceListId: testSentenceList1._id.toString(),
          }),
        ),
        fields: {} as unknown as ConsumeMessageFields,
        properties: {} as unknown as MessageProperties,
      }),
      createScores({
        content: Buffer.from(
          JSON.stringify({
            user: testUser,
            sentenceListId: testSentenceList1._id.toString(),
          }),
        ),
        fields: {} as unknown as ConsumeMessageFields,
        properties: {} as unknown as MessageProperties,
      }),
    ]);

    const [sentenceScores, wordScores, user] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
      UserProfile.findOne({}),
    ]);

    expect(sentenceScores.length).toBe(testSentences1.length);
    expect(wordScores.length).toBe(testWords.length);
    expect(user.configuredSentenceLists.length).toBe(2);
    expect(user.configuredSentenceLists.map((sl) => sl.toString())).toContain(
      testSentenceList1._id.toString(),
    );
    expect(user.configuredSentenceLists.map((sl) => sl.toString())).toContain(
      testSentenceList2._id.toString(),
    );
  });
});
