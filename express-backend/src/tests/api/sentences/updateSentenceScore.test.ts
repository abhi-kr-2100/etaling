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
import Sentence, { SentenceType } from '../../../sentence';
import SentenceScore, {
  SentenceScoreType,
} from '../../../sentence/sentenceScore';
import { UserProfile, UserProfileType } from '../../../user-profile';
import { updateScore } from '../../../api/sentences';

describe('Update sentence score', () => {
  let mongoDB: MongoMemoryServer;

  let alice: UserProfileType;
  let sampleSentence: SentenceType;
  let sampleSentenceScore: Document<Types.ObjectId, {}, SentenceScoreType> &
    SentenceScoreType;

  beforeAll(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    alice = await UserProfile.create({
      userId: 'abc',
    });
    sampleSentence = await Sentence.create({
      text: 'Dummy!',
      textLanguageCode: 'en',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  beforeEach(async () => {
    sampleSentenceScore = await SentenceScore.create({
      sentence: sampleSentence,
      owner: alice,
      score: {},
      level: 1,
    });
  });

  afterEach(async () => {
    sampleSentenceScore.score = {
      easinessFactor: 2.5,
      repetitionNumber: 0,
      interRepetitionIntervalInDays: 1,
      lastReviewDate: undefined,
    };
    sampleSentenceScore.level = 1;
    await sampleSentenceScore.save();
  });

  it('should update the score of a sentence', async () => {
    const req = createRequest({
      params: {
        id: sampleSentenceScore._id,
      },
      query: {
        grade: 5,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await updateScore(req, res, next);
    const updatedSentenceScore = await SentenceScore.findById(
      sampleSentenceScore._id,
    );

    expect(res.statusCode).toBe(200);
    expect(updatedSentenceScore.score.repetitionNumber).toBe(1);
    expect(updatedSentenceScore.score.lastReviewDate.toDateString()).toBe(
      new Date().toDateString(),
    );
  });

  it('should give an error if grade is invalid', async () => {
    const req = createRequest({
      params: {
        id: sampleSentenceScore._id,
      },
      query: {
        grade: -5,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await updateScore(req, res, next);

    expect(res.statusCode).toBe(400);
  });

  it("should give an error if sentence score doesn't exist", async () => {
    const req = createRequest({
      params: {
        id: sampleSentenceScore._id.toString().replace('a', 'b'),
      },
      query: {
        grade: 3,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await updateScore(req, res, next);

    expect(res.statusCode).toBe(404);
  });
});
