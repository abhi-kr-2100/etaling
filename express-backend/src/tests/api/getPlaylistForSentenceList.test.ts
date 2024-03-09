import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';

import { createRequest, createResponse } from 'node-mocks-http';

import { SentenceType } from '../../sentence';
import { WordScoreType } from '../../word/wordScore';
import { WordType } from '../../word/word';
import { SentenceListType } from '../../sentence-list';

import { UserProfile } from '../../user-profile';
import Sentence from '../../sentence';
import SentenceList from '../../sentence-list';
import Word from '../../word/word';
import WordScore from '../../word/wordScore';

import { getPlaylistForSentenceList } from '../../api/sentenceLists';
import SentenceScore from '../../sentence/sentenceScore';

describe('GET playlist for a sentence list', () => {
  let mongoDB: MongoMemoryServer;

  let sentence1: Document<unknown, {}, SentenceType> &
      SentenceType & {
        _id: Types.ObjectId;
      },
    sentence2: Document<unknown, {}, SentenceType> &
      SentenceType & {
        _id: Types.ObjectId;
      };

  let words = [] as (Document<unknown, {}, WordType> & WordType)[];
  let wordScores = [] as (Document<unknown, {}, WordScoreType> &
    WordScoreType)[];

  let testSentenceList: Document<unknown, {}, SentenceListType> &
    SentenceListType;

  let reqTemplate;

  beforeAll(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    const alice = await UserProfile.create({
      userId: 'google-oauth2|113671952727045600873',
    });

    testSentenceList = await SentenceList.create({
      title: "Alice's Test List",
      owner: alice._id,
      sentences: [], // sentences will be added as per test requirements
    });

    reqTemplate = {
      url: `/${testSentenceList._id}`,
      params: {
        id: testSentenceList._id,
      },
      auth: {
        payload: {
          iss: 'https://dev-zn47gq4ofr7kn50q.us.auth0.com/',
          sub: 'google-oauth2|113671952727045600873',
          iat: 1709835540,
          exp: 1709921940,
          azp: 'Hr3TuSKc8h2rkY0sxGAfXTbAQkEODFa5',
          scope: 'openid profile email',
        },
      },
    };

    sentence1 = await Sentence.create({
      text: 'Hello, world!',
      textLanguageCode: 'en',
    });

    await SentenceScore.create({
      sentence: sentence1,
      user: alice._id,
      score: {
        repetitionNumber: 2,
        easinessFactor: 2.508,
        interRepetitionIntervalInDays: 6,
        lastReviewDate: new Date(),
      },
      level: Math.max(
        0,
        6, // interRepetitionIntervalInDays - (today - lastReviewDate)
      ),
    });

    words.push(
      await Word.create({
        wordText: 'hello',
        languageCode: 'en',
      }),
    );
    wordScores.push(
      await WordScore.create({
        word: words[0],
        user: alice._id,
      }),
    );

    words.push(
      await Word.create({
        wordText: 'world',
        languageCode: 'en',
      }),
    );
    wordScores.push(
      await WordScore.create({
        word: words[1],
        user: alice._id,
      }),
    );

    sentence2 = await Sentence.create({
      text: 'Goodbye, universe!',
      textLanguageCode: 'en',
    });

    await SentenceScore.create({
      sentence: sentence2,
      user: alice._id,
      level: 0,
    });

    words.push(
      await Word.create({
        wordText: 'goodbye',
        languageCode: 'en',
      }),
    );
    wordScores.push(
      await WordScore.create({
        word: words[2],
        user: alice._id,
      }),
    );

    words.push(
      await Word.create({
        wordText: 'universe',
        languageCode: 'en',
      }),
    );
    wordScores.push(
      await WordScore.create({
        word: words[3],
        user: alice._id,
      }),
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  afterEach(async () => {
    testSentenceList.sentences = [];
    await testSentenceList.save();
  });

  it('should return an empty array if sentence list has no sentences', async () => {
    const req = createRequest(reqTemplate);
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(0);
  });

  it('should return sentences all sentences when limit is not given', async () => {
    testSentenceList.sentences = [sentence1._id, sentence2._id];
    await testSentenceList.save();

    const req = createRequest(reqTemplate);
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(2);
  });

  it('should return a limited number of sentences when limit is given', async () => {
    testSentenceList.sentences = [sentence1._id, sentence2._id];
    await testSentenceList.save();

    const req = createRequest({
      ...reqTemplate,
      query: { limit: 1 },
    });
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(1);
  });

  it('should return word scores', async () => {
    testSentenceList.sentences = [sentence1._id, sentence2._id];
    await testSentenceList.save();

    const req = createRequest(reqTemplate);
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    const wordScores1 = data[0].words;
    expect(wordScores1.length).not.toBe(0);

    const wordScores2 = data[1].words;
    expect(wordScores2.length).not.toBe(0);
  });

  it('should return sentences sorted by their necessity to be reviewed', async () => {
    testSentenceList.sentences = [sentence1._id, sentence2._id];
    await testSentenceList.save();

    const req = createRequest(reqTemplate);
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(2);
    expect(data[0].sentence._id.toString()).toBe(sentence2._id.toString());
    expect(data[1].sentence._id.toString()).toBe(sentence1._id.toString());
  });
});
