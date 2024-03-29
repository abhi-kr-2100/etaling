import fs from 'node:fs/promises';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';
import { UserProfile, UserProfileType } from '../../../user-profile';
import FileSentenceListCreator from '../../../scripts/SentenceListCreator/FileSentenceListCreator';
import Sentence from '../../../sentence';
import SentenceList from '../../../sentence-list';
import Word from '../../../word/word';

describe('File Sentence List Creator', () => {
  let mongoDB: MongoMemoryServer;
  let alice: Document<Types.ObjectId, {}, UserProfileType> & UserProfileType;

  beforeAll(async () => {
    await Promise.all([
      fs.writeFile(
        'sentences.txt',
        'The sun also rises.\nTo infinity and beyond!\n',
      ),
      fs.writeFile(
        'en.txt',
        "The wind used to blow all day.\nHow's it feeling outside?\nTom says you're a librarian, is that true?\n",
      ),
      fs.writeFile(
        'tr.txt',
        'Rüzgâr bütün gün esiyordu.\nDışarıda hava nasıl?\nTom senin bir kütüphaneci olduğunu söylüyor, bu doğru mu?\n',
      ),
      fs.writeFile('tr_malformed.txt', 'Ben de iyiyim.\nSen nasılsın?\n'),
    ]);

    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    alice = await UserProfile.create({
      userId: 'google-oauth2|113671952727045600873',
    });
  });

  afterEach(async () => {
    await SentenceList.deleteMany({});
    await Sentence.deleteMany({});
    await Word.deleteMany({});
  });

  afterAll(async () => {
    await Promise.all([
      fs.unlink('sentences.txt'),
      fs.unlink('en.txt'),
      fs.unlink('tr.txt'),
      fs.unlink('tr_malformed.txt'),
    ]);
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  it('should fetch from a default sentences.txt file if no files are provided', async () => {
    const sentenceCreator = new FileSentenceListCreator('Test list', alice);
    await sentenceCreator.execute();

    const sentences = await Sentence.find({});
    expect(sentences.length).toBe(2);
    expect(sentences.map((s) => s.text)).toContain('The sun also rises.');
    expect(sentences.map((s) => s.text)).toContain('To infinity and beyond!');
  });

  it('should fetch sentences from given files', async () => {
    const sentenceCreator = new FileSentenceListCreator(
      'Test list',
      alice,
      true,
      {
        fromLanguage: 'tr',
        fromLanguageFile: 'tr.txt',
        toLanguage: 'en',
        toLanguageFile: 'en.txt',
      },
    );

    await sentenceCreator.execute();

    const [enSentences, trSentences] = await Promise.all([
      Sentence.find({ textLanguageCode: 'en' }),
      await Sentence.find({ textLanguageCode: 'tr' }),
    ]);

    expect(enSentences.length).toBe(3);
    expect(trSentences.length).toBe(3);

    expect(trSentences[0].translations.length).toBe(1);
    expect(trSentences[1].translations.length).toBe(1);
    expect(trSentences[2].translations.length).toBe(1);
  });

  it('should throw an error if from and to files are incompatible', async () => {
    const sentenceCreator = new FileSentenceListCreator(
      'Test list',
      alice,
      true,
      {
        fromLanguage: 'tr',
        fromLanguageFile: 'tr_malformed.txt',
        toLanguage: 'en',
        toLanguageFile: 'en.txt',
      },
    );

    await expect(sentenceCreator.execute()).rejects.toThrow();
  });
});
