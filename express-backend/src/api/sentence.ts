import { Request, Response, Router } from 'express';
import SentenceScore from '../sentence/sentenceScore';
import getUpdatedWordScore, { GradeType } from '../word/scoringAlgorithm';

export async function updateScore(req: Request, res: Response) {
  const grade = Number.parseInt(req.query.grade as string);

  if (grade < 0 || grade > 5) {
    return res.status(400).json({
      error: 'Score must be between 0 and 5 inclusive.',
    });
  }

  const sentenceScoreId = req.params.id;
  const sentenceScore = await SentenceScore.findById(sentenceScoreId);
  if (sentenceScore === null) {
    return res.status(404).json({
      error: 'Sentence score was not found.',
    });
  }

  const updatedScore = getUpdatedWordScore(
    grade as GradeType,
    sentenceScore.score,
  );
  sentenceScore.score = updatedScore;
  await sentenceScore.save();

  return res.status(200);
}

const router = Router();
router.post('/:id/updateScore');

export default router;
