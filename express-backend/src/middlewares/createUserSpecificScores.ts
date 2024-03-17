import { Request, Response, NextFunction } from 'express';

import { Types } from 'mongoose';

import { UserProfile } from '../user-profile';
import Sentence from '../sentence';
import SentenceScore from '../sentence/sentenceScore';
import { getLanguageModel } from '../language-models';
import Word from '../word/word';
import WordScore from '../word/wordScore';

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
  const createSentenceScoresPromise = Promise.all(
    sentences.map((sentence) =>
      SentenceScore.create({
        sentence,
        owner: user,
        level: 0,
        score: {},
      }),
    ),
  );

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

  const words = await Promise.all(
    uniqueWordSchemas.map((wordSchemaStr) => {
      const wordSchema = JSON.parse(wordSchemaStr);
      return Word.findOne({
        wordText: wordSchema.wordText,
        languageCode: wordSchema.languageCode,
      });
    }),
  );

  const createWordScorePromise = Promise.all(
    words.map((word) =>
      WordScore.create({
        owner: user,
        score: {},
        word,
      }),
    ),
  );

  await Promise.all([
    updateUserPromise,
    createSentenceScoresPromise,
    createWordScorePromise,
  ]);
}