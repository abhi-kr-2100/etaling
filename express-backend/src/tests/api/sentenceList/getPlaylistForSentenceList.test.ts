import { describe, it, expect, afterEach, beforeEach } from '@jest/globals';

import { createRequest, createResponse } from 'node-mocks-http';

import { UserProfile } from '../../../user-profile';
import Sentence from '../../../sentence';
import SentenceList from '../../../sentence-list';
import Word from '../../../word/word';
import WordScore from '../../../word/wordScore';

import { getPlaylistForSentenceList } from '../../../api/sentenceLists';
import SentenceScore from '../../../sentence/sentenceScore';
import { HttpStatusCode } from 'axios';

describe('GET playlist for a sentence list', async () => {
  const alice = await UserProfile.create({
    userId: 'google-oauth2|113671952727045600873',
  });

  const testSentenceList = await SentenceList.create({
    title: "Alice's Test List",
    owner: alice,
  });

  const [sentence1, sentence2, translation1, translation2, translation1_1] =
    await Promise.all([
      Sentence.create({
        text: 'Hello, world!',
        textLanguageCode: 'en',
        sentenceList: testSentenceList,
      }),
      Sentence.create({
        text: 'Goodbye, universe!',
        textLanguageCode: 'en',
        sentenceList: testSentenceList,
      }),
      Sentence.create({
        text: 'Merhaba, dünya!',
        textLanguageCode: 'tr',
      }),
      Sentence.create({
        text: 'Hoşça kal, evren!',
        textLanguageCode: 'tr',
      }),
      Sentence.create({
        text: 'Hallo, welt!',
        textLanguageCode: 'de',
      }),
    ]);

  sentence1.translations.push(translation1._id);
  sentence1.translations.push(translation1_1._id);
  sentence2.translations.push(translation2._id);
  await Promise.all([sentence2.save(), sentence1.save()]);

  const [sentenceScore1, sentenceScore2] = await Promise.all([
    SentenceScore.create({
      sentence: sentence1,
      owner: alice,
      score: {
        repetitionNumber: 2,
        easinessFactor: 2.508,
        interRepetitionIntervalInDays: 6,
        lastReviewDate: new Date(),
      },
    }),
    SentenceScore.create({
      sentence: sentence2,
      owner: alice,
      score: {},
    }),
  ]);

  const words = await Promise.all([
    Word.create({
      wordText: 'hello',
      languageCode: 'en',
    }),
    Word.create({
      wordText: 'world',
      languageCode: 'en',
    }),
    Word.create({
      wordText: 'goodbye',
      languageCode: 'en',
    }),
    Word.create({
      wordText: 'universe',
      languageCode: 'en',
    }),
  ]);

  const wordScores = await Promise.all(
    words.map((word) =>
      WordScore.create({
        word,
        owner: alice,
        score: {},
      }),
    ),
  );

  const reqTemplate = {
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

  it('should return translations in the specified language (tr)', async () => {
    const req = createRequest({
      ...reqTemplate,
      query: {
        translationLang: 'tr',
      },
    });
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data[0].translations.length).toBe(1);
    expect(data[0].translations[0]._id).toBe(translation2._id.toString());

    expect(data[1].translations.length).toBe(1);
    expect(data[1].translations[0]._id).toBe(translation1._id.toString());
  });

  it('should return translations in the specified language (de)', async () => {
    const req = createRequest({
      ...reqTemplate,
      query: {
        translationLang: 'de',
      },
    });
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    const data = res._getJSONData();

    expect(data[0].translations.length).toBe(0);

    expect(data[1].translations.length).toBe(1);
    expect(data[1].translations[0]._id).toBe(translation1_1._id.toString());
  });

  it('should return forbidden status code if auth is not present in request', async () => {
    const req = createRequest({
      url: `/${testSentenceList._id}`,
      params: {
        id: testSentenceList._id,
      },
    });
    const res = createResponse();

    await getPlaylistForSentenceList(req, res);
    expect(res.statusCode).toBe(HttpStatusCode.Forbidden);
  });
});
