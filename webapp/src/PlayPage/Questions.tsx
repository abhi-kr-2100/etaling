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

export default function Questions({
  questions,
  afterCheck,
  onFinish,
}: QuestionsProps) {
  const [currQuestionIdx, setCurrQuestionIdx] = useState(0);

  const [userEnteredSolution, setUserEnteredSolution] = useState('');
  const [userEnteredSolutionStatus, setUserEnteredSolutionStatus] = useState<
    'unchecked' | 'correct' | 'incorrect'
  >('unchecked');

  const lm = useMemo(
    () =>
      getLanguageModel(questions[currQuestionIdx].sentence.textLanguageCode!),
    [questions, currQuestionIdx],
  );

  const currAction: 'Check' | 'Finish' | 'Next' =
    userEnteredSolutionStatus === 'unchecked'
      ? 'Check'
      : currQuestionIdx === questions.length - 1
        ? 'Finish'
        : 'Next';

  useEffect(() => {
    setUserEnteredSolution('');
    setUserEnteredSolutionStatus('unchecked');
  }, [currQuestionIdx]);

  const checkUserEnteredSolution = () => {
    const isCorrect = lm.areEqual(maskedWord, userEnteredSolution);
    setUserEnteredSolutionStatus(isCorrect ? 'correct' : 'incorrect');
    setUserEnteredSolution(maskedWord);
    afterCheck(isCorrect, currQuestionIdx);
  };

  const goToNextQuestion = () => setCurrQuestionIdx((prev) => prev + 1);

  const { textBefore, maskedWord, textAfter } = useMemo(
    () => getFillInTheBlanksQuestion(questions[currQuestionIdx], lm),
    [questions, currQuestionIdx, lm],
  );

  const theme = useTheme();

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
          autoFocus: true,
          InputProps: {
            style: {
              color:
                userEnteredSolutionStatus === 'correct'
                  ? theme.palette.success.main
                  : userEnteredSolutionStatus === 'incorrect'
                    ? theme.palette.error.main
                    : undefined,
            },
          },
          style: {
            width: `${maskedWord.length + 2.5}ch`,
          },
        }}
      />
      <Button
        onClick={
          currAction == 'Check'
            ? checkUserEnteredSolution
            : currAction == 'Next'
              ? goToNextQuestion
              : onFinish
        }
      >
        {currAction}
      </Button>
    </Box>
  );
}

export interface QuestionsProps {
  questions: SentenceData[];
  afterCheck: (wasCorrect: boolean, idx: number) => unknown;
  onFinish: () => unknown;
}

function getFillInTheBlanksQuestion(question: SentenceData, lm: LanguageModel) {
  const wordToMask = sample(question.words)!;
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
  };
}