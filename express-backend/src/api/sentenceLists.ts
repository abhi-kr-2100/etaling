import { Request, Response, Router } from 'express';

import SentenceList from '../sentence-list';
import SentenceScore from '../sentence/sentenceScore';
import { getLanguageModel } from '../language-models';
import { LanguageCode } from '../../../shared/languages';
import WordScore from '../word/wordScore';
import Sentence, { SentenceType } from '../sentence';
import { ObjectId } from 'mongoose';

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
    await SentenceScore.find({
      'owner.userId': userId,
      'sentence.sentenceList._id': sentenceListId,
    })
      .limit(limit)
      .sort({ level: 1 })
      .select('sentence')
  ).map((s) => s.sentence as SentenceType & { _id: ObjectId });

  let sentencesWithWordScoresAndTranslations = await Promise.all(
    sentences.map(async (sentence) => {
      const lm = getLanguageModel(
        sentence.textLanguageCode as unknown as LanguageCode,
      );
      const wordTexts = lm.getWords(sentence.text as string);

      const wordScores = await WordScore.find({
        'owner.userId': userId,
        'word.wordText': { $in: wordTexts },
      });

      const translations = await Sentence.find({
        textLanguageCode: { $in: translationLanguages },
        translations: { $elemMatch: { $eq: sentence._id } },
      });

      return {
        sentence,
        words: wordScores,
        translations,
      };
    }),
  );

  res.json(sentencesWithWordScoresAndTranslations);
}

router.get('/', getSentenceLists);
router.get('/:id', getPlaylistForSentenceList);

export default router;
