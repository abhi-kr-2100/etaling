import 'dotenv/config';
import mongoose from 'mongoose';

import { beforeAll, afterAll, beforeEach } from '@jest/globals';

import Sentence from '../sentence';
import SentenceList from '../sentence-list';
import Word from '../word/word';
import WordScore from '../word/wordScore';
import SentenceScore from '../sentence/sentenceScore';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoDB: MongoMemoryServer;

beforeAll(async () => {
  mongoDB = await MongoMemoryServer.create();
  const uri = mongoDB.getUri();
  await mongoose.connect(uri);

  await Promise.all([
    Sentence.deleteMany({}),
    SentenceList.deleteMany({}),
    Word.deleteMany({}),
    WordScore.deleteMany({}),
    SentenceScore.deleteMany({}),
  ]);
});

afterAll(async () => {
  await Promise.all([
    Sentence.deleteMany({}),
    SentenceList.deleteMany({}),
    Word.deleteMany({}),
    WordScore.deleteMany({}),
    SentenceScore.deleteMany({}),
  ]);

  await mongoose.disconnect();
  await mongoDB.stop();
});
