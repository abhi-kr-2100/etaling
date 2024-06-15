import type { ScoreType, WordScoreType } from './wordScore';

export type GradeType = 0 | 1 | 2 | 3 | 4 | 5;

// Reference: https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
export default function getUpdatedWordScore(
  grade: GradeType,
  oldScore: ScoreType,
): ScoreType {
  let updatedScore = oldScore;

  if (grade >= 3) {
    if (oldScore.repetitionNumber === 0) {
      updatedScore.interRepetitionIntervalInDays = 1;
    } else if (oldScore.repetitionNumber === 1) {
      updatedScore.interRepetitionIntervalInDays = 6;
    } else {
      updatedScore.interRepetitionIntervalInDays = Math.round(
        oldScore.interRepetitionIntervalInDays * oldScore.easinessFactor,
      );
    }

    updatedScore.repetitionNumber = oldScore.repetitionNumber + 1;
  } else {
    updatedScore.repetitionNumber = 0;
    updatedScore.interRepetitionIntervalInDays = 1;
  }

  const easinessFactor =
    oldScore.easinessFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  updatedScore.easinessFactor = Math.max(1.3, easinessFactor);

  updatedScore.lastReviewDate = new Date();

  return updatedScore;
}

export function getUpdatedSentenceScore(
  grade: GradeType,
  oldScore: ScoreType,
  wordScores: WordScoreType[],
) {
  const updatedScore = getUpdatedWordScore(grade, oldScore);
  const lowestWordScore = wordScores.reduce((prev, curr) =>
    prev.score.easinessFactor < curr.score.easinessFactor ? prev : curr,
  );

  return {
    ...updatedScore,
    easinessFactor: lowestWordScore.score.easinessFactor,
    interRepetitionIntervalInDays:
      lowestWordScore.score.interRepetitionIntervalInDays,
  };
}
