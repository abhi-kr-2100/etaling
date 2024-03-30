import { NextFunction, Request, Response, Router } from 'express';

import SentenceScore from '../sentence/sentenceScore';
import WordScore from '../word/wordScore';

import { SentenceType } from '../sentence';
import { GradeType, getUpdatedSentenceScore } from '../word/scoringAlgorithm';
import { getLanguageModel } from '../language-models';

export async function updateScore(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const grade = Number.parseInt(req.query.grade as string);

  if (grade < 0 || grade > 5) {
    res.status(400);
    return next('Score must be between 0 and 5 inclusive.');
  }

  const sentenceScoreId = req.params.id;
  const sentenceScore = await SentenceScore.findById(sentenceScoreId);
  if (sentenceScore === null) {
    res.status(404);
    return next('Sentence score was not found.');
  }

  const wordScores = await getWordScoresFromSentence(
    sentenceScore.sentence,
    sentenceScore.owner._id.toString(),
  );
  const updatedScore = getUpdatedSentenceScore(
    grade as GradeType,
    sentenceScore.score,
    wordScores,
  );
  sentenceScore.score = updatedScore;
  await sentenceScore.save();

  res.status(200).json({ message: 'Score updated.' });
}

const router = Router();
router.post('/:id/updateScore', updateScore);

async function getWordScoresFromSentence(
  sentence: SentenceType,
  ownerId: string,
) {
  const lm = getLanguageModel(sentence.textLanguageCode);
  const words = lm.getWords(sentence.text);

  const storedWordScores = await WordScore.find({
    'word.wordText': { $in: words },
    'owner._id': ownerId,
  });
  return storedWordScores;
}

export default router;
