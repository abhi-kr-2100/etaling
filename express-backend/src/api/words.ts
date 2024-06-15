import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';

import WordScore from '../word/wordScore';

import getUpdatedWordScore, { type GradeType } from '../word/scoringAlgorithm';

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

  const updatedScore = getUpdatedWordScore(
    grade as GradeType,
    wordScore.score!,
  );
  wordScore.score = updatedScore;
  await wordScore.save();

  res.status(200).json({ message: 'Score updated.' });
}

export async function updateEasinessFactor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ef = Number.parseFloat(req.query.ef as string);

  if (ef < 1.3) {
    res.status(400);
    return next('Easiness factor must not be less than 1.3.');
  }

  const wordScoreId = req.params.id;
  const wordScore = await WordScore.findById(wordScoreId);
  if (wordScore === null) {
    res.status(404);
    return next('Word score was not found.');
  }

  wordScore.score!.easinessFactor = ef;
  await wordScore.save();

  res.status(200).json({ message: 'Easiness factor updated.' });
}

const router = Router();
router.post('/:id/updateScore', updateScore);
router.post('/:id/updateEF', updateEasinessFactor);

export default router;
