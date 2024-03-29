import { Request, Response, NextFunction } from 'express';

import { Types } from 'mongoose';

import Sentence, { SentenceType } from '../sentence';
import SentenceScore from '../sentence/sentenceScore';
import Word from '../word/word';
import WordScore from '../word/wordScore';
import { UserProfile } from '../user-profile';

import { getLanguageModel } from '../language-models';

export default async function createUserSpecificScores(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth?.payload.sub || !req.params?.id) {
    return next();
  }

  const user = await UserProfile.findOne({ userId: req.auth.payload.sub });
  if (
    user.configuredSentenceLists.includes(new Types.ObjectId(req.params.id))
  ) {
    return next();
  }

  user.configuredSentenceLists.push(new Types.ObjectId(req.params.id));
  const updateUserPromise = user.save();

  const sentences = await Sentence.find({
    'sentenceList._id': req.params.id,
  });
  const createSentenceScoresPromise = SentenceScore.insertMany(
    sentences.map((sentence) => ({
      sentence,
      owner: user,
      level: 0,
      score: {},
    })),
    {
      ordered: false,
    },
  );

  const words = await getUniqueWordsFromSentences(sentences);

  const createWordScorePromise = WordScore.insertMany(
    words.map((word) => ({
      owner: user,
      score: {},
      word,
    })),
    {
      ordered: false,
    },
  );

  await Promise.all([
    updateUserPromise,
    createSentenceScoresPromise,
    createWordScorePromise,
  ]);

  return next();
}

async function getUniqueWordsFromSentences(sentences: SentenceType[]) {
  const uniqueWordSchemas = [
    ...new Set(
      sentences
        .map((sentence) => {
          const lm = getLanguageModel(sentence.textLanguageCode);
          const wordTexts = lm.getWords(sentence.text);
          return wordTexts.map((wordText) => ({
            wordText,
            languageCode: sentence.textLanguageCode,
          }));
        })
        .flat()
        .map((wordSchema) => JSON.stringify(wordSchema)),
    ),
  ];

  return Promise.all(
    uniqueWordSchemas.map((wordSchemaStr) => {
      const wordSchema = JSON.parse(wordSchemaStr);
      return Word.findOne({
        wordText: wordSchema.wordText,
        languageCode: wordSchema.languageCode,
      });
    }),
  );
}
