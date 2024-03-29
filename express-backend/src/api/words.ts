import { NextFunction, Request, Response, Router } from 'express';

import WordScore from '../word/wordScore';

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

  const wordScoreId = req.params.id;
  const wordScore = await WordScore.findById(wordScoreId);
  if (wordScore === null) {
    res.status(404);
    return next('Word score was not found.');
  }

  const updatedScore = getUpdatedWordScore(grade as GradeType, wordScore.score);
  wordScore.score = updatedScore;
  await wordScore.save();

  res.status(200).json({ message: 'Score updated.' });
}

const router = Router();
router.post('/:id/updateScore', updateScore);

export default router;
