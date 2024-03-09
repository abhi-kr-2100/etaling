import { Request, Response, Router } from 'express';

import SentenceList from '../sentence-list';
import SentenceScore from '../sentence/sentenceScore';
import { getLanguageModel } from '../language-models';
import { LanguageCode } from '../../../shared/languages';
import WordScore from '../word/wordScore';

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

  const sentences = (
    await SentenceScore.find({
      'owner.userId': userId,
      'sentence.sentenceList._id': sentenceListId,
    })
      .limit(Number.parseInt(req.query.limit as string))
      .sort({ level: 1 })
      .select('sentence')
  ).map((s) => s.sentence);

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

      return {
        sentence,
        words: wordScores,
      };
    }),
  );

  res.json(sentencesWithWordScoresAndTranslations);
}

router.get('/', getSentenceLists);
router.get('/:id', getPlaylistForSentenceList);

export default router;
