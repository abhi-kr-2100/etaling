import { afterEach, describe, it, expect } from '@jest/globals';

import createScoresForUser from '../../../scripts/ScoreCreator';

import { UserProfile } from '../../../user-profile';
import SentenceList from '../../../sentence-list';
import WordScore from '../../../word/wordScore';
import Sentence from '../../../sentence';
import Word from '../../../word/word';
import SentenceScore from '../../../sentence/sentenceScore';

describe('create user specific scores middleware', async () => {
  let testUser = await UserProfile.create({
    userId: 'google-oauth2|113671952727045600873',
  });
  const testSentenceList = await SentenceList.create({
    title: 'Test Sentence List',
    owner: testUser,
  });

  const testSentenceList2 = await SentenceList.create({
    title: 'Test Sentence List 2',
    owner: testUser,
  });

  const testSentence = await Sentence.create({
    sentenceList: testSentenceList,
    text: 'Test',
    textLanguageCode: 'en',
  });

  const testWords = [
    await Word.create({
      wordText: 'test',
      languageCode: 'en',
    }),
  ];

  afterEach(async () => {
    await WordScore.deleteMany({});
    await SentenceScore.deleteMany({});

    testUser.configuredSentenceLists = [];
    await testUser.save();
  });

  it("should create sentence and word scores for a user if they don't exist", async () => {
    await createScoresForUser(testUser._id, testSentenceList._id);

    testUser = await UserProfile.findById(testUser._id);

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

    await createScoresForUser(testUser._id, testSentenceList._id);

    const sentenceScores = await SentenceScore.find({});
    const wordScores = await WordScore.find({});

    expect(testUser.configuredSentenceLists.length).toBe(1);
    expect(sentenceScores.length).toBe(0);
    expect(wordScores.length).toBe(0);
  });

  it('should not create duplicate word scores', async () => {
    await createScoresForUser(testUser._id, testSentenceList._id);
    await createScoresForUser(testUser._id, testSentenceList2._id);

    testUser = await UserProfile.findById(testUser._id);

    expect(testUser.configuredSentenceLists.length).toBe(2);
    expect(
      testUser.configuredSentenceLists.map((sl) => sl.toString()),
    ).toContain(testSentenceList._id.toString());
    expect(
      testUser.configuredSentenceLists.map((sl) => sl.toString()),
    ).toContain(testSentenceList2._id.toString());

    const sentenceScores = await SentenceScore.find({});
    expect(sentenceScores.length).toBe(1);

    const wordScores = await WordScore.find({});
    expect(wordScores.length).toBe(1);
    expect(wordScores[0].word.wordText).toBe(testWords[0].wordText);
    expect(wordScores[0].owner.userId).toBe(testUser.userId);
    expect(wordScores[0].score.easinessFactor).toBe(2.5);
    expect(wordScores[0].score.interRepetitionIntervalInDays).toBe(1);
    expect(wordScores[0].score.repetitionNumber).toBe(0);
  });
});
