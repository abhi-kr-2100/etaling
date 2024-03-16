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
        translations: { $elemMatch: { $eq: sentence._id } },
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
router.get('/:id', getPlaylistForSentenceList);

export default router;
