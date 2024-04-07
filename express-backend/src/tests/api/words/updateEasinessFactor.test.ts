import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';
import { createRequest, createResponse } from 'node-mocks-http';
import { UserProfile, UserProfileType } from '../../../user-profile';
import { updateEasinessFactor, updateScore } from '../../../api/words';
import Word, { WordType } from '../../../word/word';
import WordScore, { WordScoreType } from '../../../word/wordScore';

describe("Update word's easiness factor", () => {
  let mongoDB: MongoMemoryServer;

  let alice: UserProfileType;
  let sampleWord: WordType;
  let sampleWordScore: Document<Types.ObjectId, {}, WordScoreType> &
    WordScoreType;

  beforeAll(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    alice = await UserProfile.create({
      userId: 'abc',
    });
    sampleWord = await Word.create({
      wordText: 'Hello',
      languageCode: 'en',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  beforeEach(async () => {
    sampleWordScore = await WordScore.create({
      word: sampleWord,
      owner: alice,
      score: {},
    });
  });

  afterEach(async () => {
    sampleWordScore.score = {
      easinessFactor: 2.5,
      repetitionNumber: 0,
      interRepetitionIntervalInDays: 1,
      lastReviewDate: undefined,
    };
    await sampleWordScore.save();
  });

  it('should update the easiness factor of a word', async () => {
    const req = createRequest({
      params: {
        id: sampleWordScore._id,
      },
      query: {
        ef: 3,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await updateEasinessFactor(req, res, next);
    const updatedWordScore = await WordScore.findById(sampleWordScore._id);

    expect(res.statusCode).toBe(200);
    expect(updatedWordScore.score.easinessFactor).toBe(3);
  });

  it('should give an error if ef is invalid', async () => {
    const req = createRequest({
      params: {
        id: sampleWordScore._id,
      },
      query: {
        ef: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await updateEasinessFactor(req, res, next);

    expect(res.statusCode).toBe(400);
  });

  it("should give an error if word score doesn't exist", async () => {
    const req = createRequest({
      params: {
        id: sampleWordScore._id.toString().replace('a', 'b'),
      },
      query: {
        ef: 2.5,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await updateScore(req, res, next);

    expect(res.statusCode).toBe(404);
  });
});
