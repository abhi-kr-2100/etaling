import { Request, Response, Router } from 'express';

import SentenceList from '../sentence-list';
import SentenceScore from '../sentence/sentenceScore';
import { getLanguageModel } from '../language-models';
import { LanguageCode } from '../../../shared/languages';
import WordScore from '../word/wordScore';
import Sentence, { SentenceType } from '../sentence';
import { ObjectId, Types } from 'mongoose';
import createUserSpecificScores from '../middlewares/createUserSpecificScores';

const router = Router();

export async function getSentenceLists(req: Request, res: Response) {
  const userId = req.auth.payload.sub;

  const sentenceLists = await SentenceList.find({
    $or: [{ 'owner.userId': userId }, { isPublic: true }],
  });

  res.json(sentenceLists);
}

export async function getPlaylistForSentenceList(req: Request, res: Response) {
  const userId = req.auth.payload.sub;
  const sentenceListId = req.params.id;

  const limit = Number.parseInt(req.query.limit as string);
  const translationLanguages = [req.query.translationLang];

  const sentences = (
    await SentenceScore.aggregate([
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
              0,
            ],
          },
        },
      },
      {
        $sort: { level: 1 },
      },
      ...(isNaN(limit) ? [] : [{ $limit: limit }]),
      {
        $project: {
          sentence: true,
          _id: true,
        },
      },
    ])
  ).map(
    (s) =>
      ({ ...s.sentence, sentenceScoreId: s._id }) as SentenceType & {
        _id: ObjectId;
        sentenceScoreId: ObjectId;
      },
  );

  const wordScoresPromise = Promise.all(
    sentences.map((sentence) => {
      const lm = getLanguageModel(sentence.textLanguageCode);
      const wordTexts = lm.getWords(sentence.text);

      return WordScore.find({
        'owner.userId': userId,
        'word.wordText': { $in: wordTexts },
      });
    }),
  );

  const translationsPromise = Promise.all(
    sentences.map((sentence) =>
      Sentence.find({
        textLanguageCode: { $in: translationLanguages },
        _id: { $in: sentence.translations },
      }),
    ),
  );

  const [wordScores, translations] = await Promise.all([
    wordScoresPromise,
    translationsPromise,
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

export default router;
