import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from '@jest/globals';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';

import { createRequest, createResponse } from 'node-mocks-http';

import { SentenceType } from '../../sentence';
import { WordScoreType } from '../../word/wordScore';
import { WordType } from '../../word/word';
import { SentenceListType } from '../../sentence-list';

import { UserProfile, UserProfileType } from '../../user-profile';
import Sentence from '../../sentence';
import SentenceList from '../../sentence-list';
import Word from '../../word/word';
import WordScore from '../../word/wordScore';

import { getPlaylistForSentenceList } from '../../api/sentenceLists';
import SentenceScore, { SentenceScoreType } from '../../sentence/sentenceScore';

describe('GET playlist for a sentence list', () => {
  let mongoDB: MongoMemoryServer;

  let alice: Document<unknown, {}, UserProfileType> & UserProfileType;

  let sentence1: Document<unknown, {}, SentenceType> &
      SentenceType & {
        _id: Types.ObjectId;
      },
    sentence2: Document<unknown, {}, SentenceType> &
      SentenceType & {
        _id: Types.ObjectId;
      };

  let sentenceScore1: Document<unknown, {}, SentenceScoreType> &
    SentenceScoreType;
  let sentenceScore2: Document<unknown, {}, SentenceScoreType> &
    SentenceScoreType;

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

    alice = await UserProfile.create({
      userId: 'google-oauth2|113671952727045600873',
    });

    testSentenceList = await SentenceList.create({
      title: "Alice's Test List",
      owner: alice,
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
      sentenceList: testSentenceList,
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
        owner: alice,
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
        owner: alice,
      }),
    );

    sentence2 = await Sentence.create({
      text: 'Goodbye, universe!',
      textLanguageCode: 'en',
      sentenceList: testSentenceList,
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
        owner: alice,
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
        owner: alice,
      }),
    );

    sentenceScore1 = await SentenceScore.create({
      sentence: sentence1,
      owner: alice,
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

    sentenceScore2 = await SentenceScore.create({
      sentence: sentence2,
      owner: alice,
      level: 0,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  beforeEach(async () => {
    sentence1.sentenceList = testSentenceList;
    await sentence1.save();

    sentenceScore1.sentence = sentence1;
    await sentenceScore1.save();

    sentence2.sentenceList = testSentenceList;
    await sentence2.save();

    sentenceScore2.sentence = sentence2;
    await sentenceScore2.save();
  });

  afterEach(async () => {
    sentence1.sentenceList = undefined;
    await sentence1.save();

    sentenceScore1.sentence = sentence1;
    await sentenceScore1.save();

    sentence2.sentenceList = undefined;
    await sentence2.save();

    sentenceScore2.sentence = sentence2;
    await sentenceScore2.save();
  });

  it('should return an empty array if sentence list has no sentences', async () => {
    const emptySentenceList = await SentenceList.create({
      title: 'Empty Sentence List',
      owner: alice,
    });

    const req = createRequest({
      ...reqTemplate,
      params: { id: emptySentenceList._id },
    });
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(0);
  });

  it('should return sentences all sentences when limit is not given', async () => {
    const req = createRequest(reqTemplate);
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(2);
  });

  it('should return a limited number of sentences when limit is given', async () => {
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
    const req = createRequest(reqTemplate);
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(2);
    expect(data[0].sentence._id.toString()).toBe(sentence2._id.toString());
    expect(data[1].sentence._id.toString()).toBe(sentence1._id.toString());
  });
});
