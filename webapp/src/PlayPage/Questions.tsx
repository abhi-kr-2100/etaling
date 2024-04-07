import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorrectedWordScoreType, SentenceData } from './Play';
import FillInTheBlanks from '../components/FillInTheBlanks';
import { Box, Button } from '@mui/material';
import {
  LanguageModel,
  getLanguageModel,
} from '../../../express-backend/src/language-models';

import sample from 'lodash/sample';
import { useTheme } from '@mui/material/styles';
import { DateTime } from 'luxon';
import Chance from 'chance';
const chance = new Chance();

export default function Questions({
  questions,
  afterCheck,
  onFinish,
}: QuestionsProps) {
  const theme = useTheme();

  const [currQuestionIdx, setCurrQuestionIdx] = useState(0);

  const lm = useMemo(
    () =>
      getLanguageModel(questions[currQuestionIdx].sentence.textLanguageCode!),
    [questions, currQuestionIdx],
  );

  const { textBefore, maskedWord, textAfter, maskedWordId } = useMemo(
    () => getFillInTheBlanksQuestion(questions[currQuestionIdx], lm),
    [questions, currQuestionIdx, lm],
  );

  const {
    userEnteredSolution,
    setUserEnteredSolution,
    userEnteredSolutionStatus,
    reset,
  } = useSolution(
    (solution) => lm.startsWith(maskedWord, solution),
    (solution) => lm.areEqual(maskedWord, solution),
  );

  const checkUserEnteredSolution = () => {
    setIsSolutionChecked(true);
    const isCorrect = lm.areEqual(maskedWord, userEnteredSolution);
    afterCheck(isCorrect, currQuestionIdx, maskedWordId);
  };

  const goToNextQuestion = () => setCurrQuestionIdx((prev) => prev + 1);

  const [isSolutionChecked, setIsSolutionChecked] = useState(false);

  const currAction: 'Check' | 'Finish' | 'Next' = !isSolutionChecked
    ? 'Check'
    : currQuestionIdx === questions.length - 1
      ? 'Finish'
      : 'Next';
  const currActionFn =
    currAction === 'Check'
      ? checkUserEnteredSolution
      : currAction === 'Next'
        ? goToNextQuestion
        : onFinish;

  const statusColor = useMemo(
    () =>
      userEnteredSolutionStatus === 'fully_correct'
        ? theme.palette.success.main
        : userEnteredSolutionStatus === 'incorrect'
          ? theme.palette.error.main
          : undefined,
    [userEnteredSolutionStatus, theme],
  );

  useEffect(() => {
    reset();
    setIsSolutionChecked(false);
  }, [currQuestionIdx, reset, setIsSolutionChecked]);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      sx={{
        gap: 1.5,
      }}
    >
      <FillInTheBlanks
        textBeforeBlank={textBefore}
        textAfterBlank={textAfter}
        hint={questions[currQuestionIdx].translations[0].text!}
        BlankInputProps={{
          value: isSolutionChecked ? maskedWord : userEnteredSolution,
          onChange: (e) => setUserEnteredSolution(e.target.value),
          onKeyDown: (e) => (e.key === 'Enter' ? currActionFn() : undefined),
          autoFocus: true,
          autoComplete: 'off',
          InputProps: {
            inputProps: {
              style: {
                textAlign: 'center',
                color: statusColor,
              },
            },
          },
          style: {
            width: `${maskedWord.length + 2.5}ch`,
          },
        }}
      />
      <Button onClick={currActionFn}>{currAction}</Button>
    </Box>
  );
}

export interface QuestionsProps {
  questions: SentenceData[];
  afterCheck: (wasCorrect: boolean, idx: number, wordId: string) => unknown;
  onFinish: () => unknown;
}

function useSolution(
  isValidPrefix: (solution: string) => boolean,
  isComplete: (solution: string) => boolean,
) {
  const [userEnteredSolution, setUserEnteredSolution] = useState('');
  // If `userEnteredSolution` is a valid prefix of the complete solution, the
  // `userEnteredSolutionStatus` is considered to be `partially_correct`. If it
  // is a complete answer, the status is considered to be `fully_correct`.
  // Since, the `userEnteredSolution` starts out as the empty string—which is a
  // valid prefix of all strings—the initial value is `partially_correct`.
  const [userEnteredSolutionStatus, setUserEnteredSolutionStatus] = useState<
    'partially_correct' | 'fully_correct' | 'incorrect'
  >('partially_correct');

  useEffect(() => {
    setUserEnteredSolutionStatus(
      isComplete(userEnteredSolution)
        ? 'fully_correct'
        : isValidPrefix(userEnteredSolution)
          ? 'partially_correct'
          : 'incorrect',
    );
  }, [userEnteredSolution, isValidPrefix, isComplete]);

  const reset = useCallback(() => {
    setUserEnteredSolution('');
    setUserEnteredSolutionStatus('partially_correct');
  }, [setUserEnteredSolution, setUserEnteredSolutionStatus]);

  return {
    userEnteredSolution,
    setUserEnteredSolution,
    userEnteredSolutionStatus,
    reset,
  };
}

function getFillInTheBlanksQuestion(question: SentenceData, lm: LanguageModel) {
  const { wordToMask, intervalToMask } = chooseMaskedWordWeighted(
    question.sentence.text!,
    question.words,
    lm,
  );

  const textBefore = question.sentence.text!.slice(0, intervalToMask[0]);
  const textAfter = question.sentence.text!.slice(intervalToMask[1]);

  return {
    textBefore,
    maskedWord: wordToMask.word!.wordText!,
    textAfter,
    maskedWordId: wordToMask._id,
  };
}

function chooseMaskedWordWeighted(
  text: string,
  wordScores: CorrectedWordScoreType[],
  lm: LanguageModel,
) {
  const weights = wordScores.map((wordScore) => {
    const lastReviewDate = wordScore.score?.lastReviewDate
      ? DateTime.fromISO(wordScore.score.lastReviewDate)
      : DateTime.now();
    const daysSinceLastReview = Math.round(
      -lastReviewDate.diffNow('days').days,
    );
    const level = Math.max(
      1,
      wordScore.score.interRepetitionIntervalInDays! - daysSinceLastReview,
    );
    return 1.0 / (level * wordScore.score.easinessFactor);
  });

  const wordToMask = chance.weighted(wordScores, weights);
  const occurrences = lm.findWord(text, wordToMask.word!.wordText!);
  const occurrenceToMask = sample(occurrences)!;

  return {
    wordToMask,
    intervalToMask: occurrenceToMask,
  };
}
