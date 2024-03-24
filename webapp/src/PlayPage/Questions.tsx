import { useEffect, useMemo, useState } from 'react';
import { SentenceData } from './Play';
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

  const [userEnteredSolution, setUserEnteredSolution] = useState('');
  const [userEnteredSolutionStatus, setUserEnteredSolutionStatus] = useState<
    'unchecked' | 'correct' | 'incorrect'
  >('unchecked');
  // Status of user's input before they submit the solution for checking. If
  // user input is a valid prefix of the complete solution, the user input is
  // considered a correct partial solution. Since, the user input at the very
  // beginning is the empty string — which is a valid prefix of all string — the
  // initial value is partially correct.
  const [
    userEnteredPartialSolutionStatus,
    setUserEnteredPartialSolutionStatus,
  ] = useState<'partially_correct' | 'fully_correct' | 'incorrect'>(
    'partially_correct',
  );

  const lm = useMemo(
    () =>
      getLanguageModel(questions[currQuestionIdx].sentence.textLanguageCode!),
    [questions, currQuestionIdx],
  );

  useEffect(() => {
    setUserEnteredSolution('');
    setUserEnteredSolutionStatus('unchecked');
  }, [currQuestionIdx]);

  useEffect(() => {
    const isValidPrefix = lm.startsWith(maskedWord, userEnteredSolution);
    const isComplete = lm.areEqual(maskedWord, userEnteredSolution);

    setUserEnteredPartialSolutionStatus(
      isComplete
        ? 'fully_correct'
        : isValidPrefix
          ? 'partially_correct'
          : 'incorrect',
    );
  }, [userEnteredSolution]);

  const checkUserEnteredSolution = () => {
    const isCorrect = lm.areEqual(maskedWord, userEnteredSolution);
    setUserEnteredSolutionStatus(isCorrect ? 'correct' : 'incorrect');
    setUserEnteredSolution(maskedWord);
    afterCheck(isCorrect, currQuestionIdx, maskedWordId);
  };

  const goToNextQuestion = () => setCurrQuestionIdx((prev) => prev + 1);

  const currAction: 'Check' | 'Finish' | 'Next' =
    userEnteredSolutionStatus === 'unchecked'
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

  const { textBefore, maskedWord, textAfter, maskedWordId } = useMemo(
    () => getFillInTheBlanksQuestion(questions[currQuestionIdx], lm),
    [questions, currQuestionIdx, lm],
  );

  const statusColor = useMemo(
    () =>
      userEnteredSolutionStatus === 'correct' ||
      userEnteredPartialSolutionStatus === 'fully_correct'
        ? theme.palette.success.main
        : userEnteredSolutionStatus === 'incorrect' ||
            userEnteredPartialSolutionStatus === 'incorrect'
          ? theme.palette.error.main
          : undefined,
    [userEnteredSolutionStatus, userEnteredPartialSolutionStatus],
  );

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
          value: userEnteredSolution,
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

function getFillInTheBlanksQuestion(question: SentenceData, lm: LanguageModel) {
  const weights = question.words.map((word) => {
    const lastReviewDate = word.score!.lastReviewDate
      ? DateTime.fromISO(word.score!.lastReviewDate)
      : DateTime.now();
    const daysSinceLastReview = Math.round(
      -lastReviewDate.diffNow('days').days,
    );
    const level = Math.max(
      0,
      word.score!.interRepetitionIntervalInDays! - daysSinceLastReview,
    );

    return level === 0 ? 1.0 : 1.0 / level;
  });

  console.log(weights);

  const wordToMask = chance.weighted(question.words, weights);
  const occurrences = lm.findWord(
    question.sentence.text!,
    wordToMask.word!.wordText!,
  );
  const occurrenceToMask = sample(occurrences)!;

  const textBefore = question.sentence.text!.slice(0, occurrenceToMask[0]);
  const textAfter = question.sentence.text!.slice(occurrenceToMask[1]);

  return {
    textBefore,
    maskedWord: wordToMask.word!.wordText!,
    textAfter,
    maskedWordId: wordToMask._id,
  };
}
