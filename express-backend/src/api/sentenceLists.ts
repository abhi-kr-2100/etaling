import { Request, Response, Router } from 'express';

import { UserProfile } from '../user-profile';
import SentenceList from '../sentence-list';
import SentenceScore from '../sentence/sentenceScore';
import { getLanguageModel } from '../language-models';
import { LanguageCode } from '../../../shared/languages';
import WordScore from '../word/wordScore';

const router = Router();

export async function getSentenceLists(req: Request, res: Response) {
  const userId = req.auth.payload.sub;
  const userProfile = await UserProfile.findOne({
    userId,
  });

  const sentenceLists = await SentenceList.find({
    $or: [{ owner: userProfile._id }, { isPublic: true }],
  });

  res.json(
    sentenceLists.map((sl) => ({
      _id: sl._id,
      title: sl.title,
      sentences: sl.sentences,
    })),
  );
}

export async function getPlaylistForSentenceList(req: Request, res: Response) {
  const userProfile = await UserProfile.findOne({
    userId: req.auth.payload.sub,
  });

  const sentenceList = await SentenceList.findOne({
    _id: req.params.id,
  });

  // const sentences = await Sentence.find({
  //   _id: { $in: sentenceList.sentences },
  // }).limit(Number.parseInt(req.query.limit as string));

  const sentences = (
    await SentenceScore.find({
      user: userProfile._id,
      'sentence._id': { $in: sentenceList.sentences },
    })
      .limit(Number.parseInt(req.query.limit as string))
      .sort({ level: 1 })
      .select('sentence')
  ).map((s) => s.sentence);

  let sentencesWithWordScores = await Promise.all(
    sentences.map(async (sentence) => {
      const lm = getLanguageModel(
        sentence.textLanguageCode as unknown as LanguageCode,
      );
      const wordTexts = lm.getWords(sentence.text as string);

      const wordScores = await WordScore.find({
        user: userProfile._id,
        'word.wordText': { $in: wordTexts },
      });

      return {
        sentence,
        words: wordScores,
      };
    }),
  );

  res.json(sentencesWithWordScores);
}

router.get('/', getSentenceLists);
router.get('/:id', getPlaylistForSentenceList);

export default router;
