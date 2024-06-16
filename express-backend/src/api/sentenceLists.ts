import { type Request, type Response, Router } from 'express';
import { type ObjectId, Types } from 'mongoose';

import createUserSpecificScores from '../middlewares/createUserSpecificScores';

import SentenceList from '../sentence-list';
import SentenceScore from '../sentence/sentenceScore';
import WordScore from '../word/wordScore';
import Sentence, { type SentenceType } from '../sentence';

import { getLanguageModel } from '../language-models';
import type { LanguageCode } from '../../../shared/languages';
import { HttpStatusCode } from 'axios';

const router = Router();

export async function getSentenceLists(req: Request, res: Response) {
  const userId = req.auth?.payload.sub;

  const sentenceLists = await SentenceList.find({
    $or: [{ 'owner.userId': userId }, { isPublic: true }],
  });

  res.json(sentenceLists);
}

export async function getPlaylistForSentenceList(req: Request, res: Response) {
  const userId = req.auth?.payload.sub;
  const sentenceListId = req.params.id;

  if (userId === undefined) {
    res.status(HttpStatusCode.Forbidden);
    return;
  }

  const limit = Number.parseInt(req.query.limit as string);
  const translationLanguages = [req.query.translationLang];

  const sentences = (
    await getSentencesSortedBySentenceScoreLevel(userId, sentenceListId, limit)
  ).map(
    (s) =>
      ({ ...s.sentence, sentenceScoreId: s._id }) as SentenceType & {
        _id: ObjectId;
        sentenceScoreId: ObjectId;
      },
  );

  const [wordScores, translations] = await Promise.all([
    getWordScoresForSentences(userId, sentences),
    getTranslationsForSentences(
      sentences,
      translationLanguages as LanguageCode[],
    ),
  ]);

  const sentencesWithWordScoresAndTranslations = sentences.map(
    (sentence, idx) => ({
      sentence,
      words: wordScores[idx],
      translations: translations[idx],
    }),
  );

  res.json(sentencesWithWordScoresAndTranslations);
}

router.get('/', getSentenceLists);
router.get('/:id', createUserSpecificScores, getPlaylistForSentenceList);

async function getSentencesSortedBySentenceScoreLevel(
  userId: string,
  sentenceListId: string,
  limit: number,
) {
  return SentenceScore.aggregate([
    {
      $match: {
        'owner.userId': userId,
        'sentence.sentenceList._id': new Types.ObjectId(sentenceListId),
      },
    },
    {
      $set: {
        level: {
          $max: [
            {
              $subtract: [
                '$score.interRepetitionIntervalInDays',
                {
                  $dateDiff: {
                    startDate: '$score.lastReviewDate',
                    unit: 'day',
                    endDate: new Date(),
                  },
                },
              ],
            },
            1,
          ],
        },
      },
    },
    {
      $sort: { 'score.easinessFactor': 1, level: 1 },
    },
    ...(isNaN(limit) ? [] : [{ $limit: limit }]),
    {
      $project: {
        sentence: true,
        _id: true,
      },
    },
  ]);
}

async function getWordScoresForSentences(
  userId: string,
  sentences: SentenceType[],
) {
  return Promise.all(
    sentences.map((sentence) => {
      const lm = getLanguageModel(sentence.textLanguageCode);
      const wordTexts = lm.getWords(sentence.text);

      return WordScore.find({
        'owner.userId': userId,
        'word.wordText': { $in: wordTexts },
      });
    }),
  );
}

async function getTranslationsForSentences(
  sentences: SentenceType[],
  translationLanguages: LanguageCode[],
) {
  return Promise.all(
    sentences.map((sentence) =>
      Sentence.find({
        textLanguageCode: { $in: translationLanguages },
        _id: { $in: sentence.translations },
      }),
    ),
  );
}

export default router;
