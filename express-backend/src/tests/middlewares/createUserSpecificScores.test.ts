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

describe('create user specific scores middleware', () => {
  let mongoDB: MongoMemoryServer;
  let req: Request, res: Response, next: NextFunction;

  let testUser: Document<Types.ObjectId, {}, UserProfileType> & UserProfileType,
    testSentenceList: Document<Types.ObjectId, {}, SentenceListType> &
      SentenceListType,
    testSentence: Document<Types.ObjectId, {}, SentenceType> & SentenceType,
    testWords = [] as (Document<Types.ObjectId, {}, WordType> & WordType)[];

  beforeAll(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    testUser = await UserProfile.create({
      userId: 'google-oauth2|113671952727045600873',
    });

    testSentenceList = await SentenceList.create({
      title: 'Test Sentence List',
      owner: testUser,
    });

    testSentence = await Sentence.create({
      sentenceList: testSentenceList,
      text: 'Test',
      textLanguageCode: 'en',
    });

    testWords.push(
      await Word.create({
        wordText: 'test',
        languageCode: 'en',
      }),
    );
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
        id: testSentenceList._id,
      },
    });
    res = createResponse();
    next = jest.fn();
  });

  afterEach(async () => {
    await WordScore.deleteMany({});
    await SentenceScore.deleteMany({});

    testUser.configuredSentenceLists = [];
    await testUser.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  it("should create sentence and word scores for a user if they don't exist", async () => {
    await createUserSpecificScores(req, res, next);

    testUser = await UserProfile.findById(testUser._id);

    expect(next).toBeCalled();

    expect(testUser.configuredSentenceLists.length).toBe(1);
    expect(testUser.configuredSentenceLists[0].toString()).toBe(
      testSentenceList._id.toString(),
    );

    const sentenceScores = await SentenceScore.find({});
    expect(sentenceScores.length).toBe(1);
    expect(sentenceScores[0].sentence.text).toBe(testSentence.text);
    expect(sentenceScores[0].owner.userId).toBe(testUser.userId);
    expect(sentenceScores[0].score.easinessFactor).toBe(2.5);
    expect(sentenceScores[0].score.interRepetitionIntervalInDays).toBe(1);
    expect(sentenceScores[0].score.repetitionNumber).toBe(0);
    expect(sentenceScores[0].level).toBe(0);

    const wordScores = await WordScore.find({});
    expect(wordScores.length).toBe(1);
    expect(wordScores[0].word.wordText).toBe(testWords[0].wordText);
    expect(wordScores[0].owner.userId).toBe(testUser.userId);
    expect(wordScores[0].score.easinessFactor).toBe(2.5);
    expect(wordScores[0].score.interRepetitionIntervalInDays).toBe(1);
    expect(wordScores[0].score.repetitionNumber).toBe(0);
  });

  it('should not create sentence or word scores for a user if they already exist', async () => {
    testUser.configuredSentenceLists.push(testSentenceList._id);
    await testUser.save();

    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();

    const sentenceScores = await SentenceScore.find({});
    const wordScores = await WordScore.find({});

    expect(testUser.configuredSentenceLists.length).toBe(1);
    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });

  it("should ignore requests that don't involve a sentence list", async () => {
    const req = createRequest();
    await createUserSpecificScores(req, res, next);

    expect(next).toBeCalled();

    const sentenceScores = await SentenceScore.find({});
    const wordScores = await WordScore.find({});

    expect(testUser.configuredSentenceLists.length).toBe(0);
    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });
});
