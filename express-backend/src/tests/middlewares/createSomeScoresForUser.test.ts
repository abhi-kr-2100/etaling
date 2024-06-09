import { afterEach, describe, it, expect } from '@jest/globals';
import { UserProfile } from '../../user-profile';
import SentenceList from '../../sentence-list';
import WordScore from '../../word/wordScore';
import { createSomeScoresForUser } from '../../middlewares/helpers';
import Sentence from '../../sentence';
import Word from '../../word/word';
import SentenceScore from '../../sentence/sentenceScore';

describe('create some scores for user', async () => {
  const testUser = await UserProfile.create({
    userId: 'google-oauth2|113671952727045600873',
  });
  const [testSentenceList1, testSentenceList2] = await Promise.all([
    SentenceList.create({
      title: 'Test Sentence List',
      owner: testUser,
    }),
    SentenceList.create({
      title: 'Test Sentence List 2',
      owner: testUser,
    }),
  ]);
  const testSentences1 = await Promise.all(
    Array.from({ length: 100 }).map((_, idx) =>
      Sentence.create({
        text: `test${idx}`,
        sentenceList: testSentenceList1,
        textLanguageCode: 'en',
      }),
    ),
  );

  await Promise.all(
    Array.from({ length: 100 }).map((_, idx) =>
      Word.create({
        wordText: `test${idx}`,
        languageCode: 'en',
      }),
    ),
  );

  afterEach(async () => {
    await WordScore.deleteMany({});
    await SentenceScore.deleteMany({});

    testUser.configuredSentenceLists = [];
    await testUser.save();
  });

  it('should create a limited number of sentence scores and word scores for the user', async () => {
    const limit = 10;

    await createSomeScoresForUser(
      testUser,
      testSentenceList1._id.toString(),
      limit,
    );

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    expect(sentenceScores.length).toBe(limit);

    // Each sentence consits of only 1 word.
    expect(wordScores.length).toBe(limit);
  });

  it('should not create duplicate sentence scores or word scores', async () => {
    await createSomeScoresForUser(testUser, testSentenceList1._id.toString());
    await createSomeScoresForUser(testUser, testSentenceList2._id.toString());

    const [sentenceScores, wordScores] = await Promise.all([
      SentenceScore.find({}),
      WordScore.find({}),
    ]);

    // testSentenceList1 and testSentenceList2 contain textually the same sentences
    expect(sentenceScores.length).toBe(testSentences1.length);
    expect(wordScores.length).toBe(testSentences1.length);
  });
});
