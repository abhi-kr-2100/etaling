import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { type HydratedDocument } from 'mongoose';
import { createRequest, createResponse } from 'node-mocks-http';
import { UserProfile } from '../../../user-profile';
import { updateEasinessFactor, updateScore } from '../../../api/words';
import Word from '../../../word/word';
import WordScore, { type WordScoreType } from '../../../word/wordScore';

describe("Update word's easiness factor", async () => {
  const alice = await UserProfile.create({
    userId: 'abc',
  });
  const sampleWord = await Word.create({
    wordText: 'Hello',
    languageCode: 'en',
  });

  let sampleWordScore: HydratedDocument<WordScoreType>;

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
        id: sampleWordScore._id
          .toString()
          .replace('a', 'b')
          .replace('c', 'd')
          .replace('e', 'f')
          .replace('0', '1'),
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
