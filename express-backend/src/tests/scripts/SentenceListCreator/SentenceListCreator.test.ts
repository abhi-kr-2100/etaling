import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import SentenceListCreator from '../../../scripts/SentenceListCreator';
import { UserProfile } from '../../../user-profile';
import SentenceList from '../../../sentence-list';
import Sentence from '../../../sentence';
import Word from '../../../word/word';

describe('SentenceListCreator', async () => {
  let alice = await UserProfile.create({
    userId: 'google-oauth2|113671952727045600873',
  });

  const sentence1 = {
    text: 'Hello, world!',
    textLanguageCode: 'en',
  };
  const translation1 = {
    text: 'Hello world.',
    textLanguageCode: 'en',
  };
  const sentence2 = {
    text: 'Hello!',
    textLanguageCode: 'en',
  };
  const translation2 = {
    text: 'Hi.',
    textLanguageCode: 'en',
  };

  beforeEach(async () => {
    await SentenceList.deleteMany({});
    await Sentence.deleteMany({});
    await Word.deleteMany({});
  });

  it('should create the sentence list', async () => {
    const testListCreator = new SentenceListCreator('Test list', alice);
    await testListCreator.execute();

    const sentenceLists = await SentenceList.find({});
    expect(sentenceLists.length).toBe(1);
    expect(sentenceLists[0].title).toBe('Test list');
    expect(sentenceLists[0].isPublic).toBe(true);
    expect(sentenceLists[0].owner.userId).toBe(alice.userId);
  });

  it('should create sentences and translations', async () => {
    const testListCreator = new SentenceListCreator('Test list', alice);

    testListCreator.push([sentence1, translation1], [sentence2, translation2]);

    await testListCreator.execute();

    const sentences = await Sentence.find({});
    expect(sentences.length).toBe(4);

    const s1 = sentences.find((s) => s.text === sentence1.text);
    const t1 = sentences.find((s) => s.text === translation1.text);
    expect(s1.translations.length).toBe(1);
    expect(s1.translations[0].toString()).toBe(t1._id.toString());

    const s2 = sentences.find((s) => s.text === sentence2.text);
    const t2 = sentences.find((s) => s.text === translation2.text);
    expect(s2.translations.length).toBe(1);
    expect(s2.translations[0].toString()).toBe(t2._id.toString());
  });

  it('should create words', async () => {
    const testListCreator = new SentenceListCreator('Test list', alice);

    testListCreator.push([sentence1, translation1], [sentence2, translation2]);

    await testListCreator.execute();

    const words = await Word.find({});
    expect(words.length).toBe(2);
    expect(words.filter((w) => w.languageCode === 'en').length).toBe(2);

    const wordTexts = words.map((w) => w.wordText);
    expect(wordTexts).toContain('hello');
    expect(wordTexts).toContain('world');
  });

  it("shouldn't allow pushing more sentences after executing", async () => {
    const testListCreator = new SentenceListCreator('Test list', alice);
    await testListCreator.execute();

    expect(testListCreator.push).toThrow();
  });

  it("shouldn't allow executing more than once", async () => {
    const testListCreator = new SentenceListCreator('Test list', alice);
    await testListCreator.execute();

    await expect(testListCreator.execute()).rejects.toThrow();
  });

  it("shouldn't create duplicate words", async () => {
    const testListCreator1 = new SentenceListCreator('Test list 1', alice);
    testListCreator1.push([sentence1, translation1]);

    const testListCreator2 = new SentenceListCreator('Test list 2', alice);
    testListCreator2.push([sentence2, translation2]);

    await testListCreator1.execute();
    await testListCreator2.execute();

    const words = await Word.find({});
    expect(words.length).toBe(2);
    expect(words.filter((w) => w.languageCode === 'en').length).toBe(2);

    const wordTexts = words.map((w) => w.wordText);
    expect(wordTexts).toContain('hello');
    expect(wordTexts).toContain('world');
  });
});
