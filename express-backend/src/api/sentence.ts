import { NextFunction, Request, Response, Router } from 'express';
import SentenceScore from '../sentence/sentenceScore';
import getUpdatedWordScore, { GradeType } from '../word/scoringAlgorithm';

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

  const updatedScore = getUpdatedWordScore(
    grade as GradeType,
    sentenceScore.score,
  );
  sentenceScore.score = updatedScore;
  await sentenceScore.save();

  res.status(200).json({ message: 'Score updated.' });
}

const router = Router();
router.post('/:id/updateScore', updateScore);

export default router;
