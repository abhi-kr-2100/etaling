import {
  beforeEach,
  afterEach,
  describe,
  it,
  jest,
  beforeAll,
  afterAll,
  expect,
} from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';
import { createRequest, createResponse } from 'node-mocks-http';
import { UserProfile, UserProfileType } from '../../user-profile';
import SentenceList, { SentenceListType } from '../../sentence-list';
import WordScore from '../../word/wordScore';
import createUserSpecificScores from '../../middlewares/createUserSpecificScores';
import Sentence, { SentenceType } from '../../sentence';
import Word, { WordType } from '../../word/word';
import SentenceScore from '../../sentence/sentenceScore';
import { redisCluster } from '../../db/redis';

describe('create user specific scores middleware', () => {
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

    lockKey1 = `lock:${testUser._id.toString()}:${testSentenceList1._id.toString()}`;

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

  beforeEach(async () => {
    req = createRequest({
      method: 'GET',
      url: '/api/sentenceLists/abc',
      auth: {
        payload: {
          iss: 'https://dev-zn47gq4ofr7kn50q.us.auth0.com/',
          sub: testUser.userId,
          iat: 1709835540,
          exp: 1709921940,
          azp: 'Hr3TuSKc8h2rkY0sxGAfXTbAQkEODFa5',
          scope: 'openid profile email',
        },
      },
      params: {
        id: testSentenceList1._id.toString(),
      },
      query: {
        limit: '10',
      },
    });
    res = createResponse();
    next = jest.fn();
  });

  afterEach(async () => {
    await redisCluster.del(lockKey1);

    await WordScore.deleteMany({});
    await SentenceScore.deleteMany({});

    testUser.configuredSentenceLists = [];
    await testUser.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  it('should create some sentence scores and word scores immediately', async () => {
    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    expect(sentenceScores.length).toBe(parseInt(req.query.limit as string));
    expect(wordScores.length).toBe(parseInt(req.query.limit as string));
  });

  it('should not create sentence or word scores for a user if they already exist', async () => {
    testUser.configuredSentenceLists.push(testSentenceList1._id);
    await testUser.save();

    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();
    expect(testUser.configuredSentenceLists.length).toBe(1);

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });

  it("should ignore requests that don't involve a sentence list", async () => {
    const req = createRequest();
    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    expect(testUser.configuredSentenceLists.length).toBe(0);
    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });

  it('should not create duplicate word scores', async () => {
    req.query.limit = undefined;

    await createUserSpecificScores(req, res, next);

    req.params.id = testSentenceList2._id.toString();
    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    expect(sentenceScores.length).toBe(testSentences1.length);
    expect(wordScores.length).toBe(testWords.length);
  });

  it('should do nothing if the list is being processed already', async () => {
    await redisCluster.set(lockKey1, 'acquired');
    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });
});
