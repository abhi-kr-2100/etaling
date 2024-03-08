import { ScoreType } from './wordScore';

export type GradeType = 0 | 1 | 2 | 3 | 4 | 5;

// Reference: https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
export default function getUpdatedWordScore(
  grade: GradeType,
  score: ScoreType,
): ScoreType {
  let updatedScore = score;

  if (grade >= 3) {
    if (score.repetitionNumber === 0) {
      updatedScore.interRepetitionIntervalInDays = 1;
    } else if (score.repetitionNumber === 1) {
      updatedScore.interRepetitionIntervalInDays = 6;
    } else {
      updatedScore.interRepetitionIntervalInDays = Math.round(
        score.interRepetitionIntervalInDays * score.easinessFactor,
      );
    }

    updatedScore.repetitionNumber = score.repetitionNumber + 1;
  } else {
    updatedScore.repetitionNumber = 0;
    updatedScore.interRepetitionIntervalInDays = 1;
  }

  const easinessFactor =
    score.easinessFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  updatedScore.easinessFactor = Math.max(1.3, easinessFactor);

  updatedScore.lastReviewDate = new Date();

  return updatedScore;
}
