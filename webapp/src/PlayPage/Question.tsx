import { Box, Button, useTheme } from '@mui/material';
import {
  LanguageModel,
  getLanguageModel,
} from '../../../express-backend/src/language-models';
import { CorrectedWordScoreType, SentenceData } from './Play';
import FillInTheBlanks from '../components/FillInTheBlanks';
import Word from './Word';
import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export default function Question({
  question,
  afterCheck,
  onNext,
  onFinish,
  shouldFinish = false,
}: QuestionProps) {
  const theme = useTheme();
  const lm = getLanguageModel(question.sentence.textLanguageCode!);

  const {
    wordComponentsBefore,
    wordComponentsAfter,
    maskedWordComponent,
    maskedWord,
    maskedWordId,
  } = getFillInTheBlanksQuestion(question, lm);

  const [isSolutionChecked, setIsSolutionChecked] = useState(false);
  const checkUserEnteredSolution = () => {
    setIsSolutionChecked(true);
    const isCorrect = lm.areEqual(maskedWord, userEnteredSolution);
    afterCheck(isCorrect, maskedWordId);
  };

  const {
    userEnteredSolution,
    setUserEnteredSolution,
    userEnteredSolutionStatus,
    reset,
  } = useSolution(
    (solution) => lm.startsWith(maskedWord, solution),
    (solution) => lm.areEqual(maskedWord, solution),
  );

  const currAction: 'Check' | 'Finish' | 'Next' = !isSolutionChecked
    ? 'Check'
    : shouldFinish
      ? 'Finish'
      : 'Next';
  const currActionFn =
    currAction === 'Check'
      ? checkUserEnteredSolution
      : () => {
          setIsSolutionChecked(false);
          reset();
          (currAction === 'Next' ? onNext : onFinish)();
        };

  const statusColor =
    userEnteredSolutionStatus === 'fully_correct'
      ? theme.palette.success.main
      : // A `partially_correct` solution should be considered wrong if user
        // submits it for checking
        userEnteredSolutionStatus === 'incorrect' || isSolutionChecked
        ? theme.palette.error.main
        : undefined;

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
        componentsBeforeBlank={wordComponentsBefore}
        componentsAfterBlank={wordComponentsAfter}
        hint={question.translations[0].text!}
        solved={isSolutionChecked}
        solution={[maskedWordComponent]}
        BlankInputProps={{
          value: isSolutionChecked ? maskedWord : userEnteredSolution,
          onChange: (e) =>
            !isSolutionChecked
              ? setUserEnteredSolution(e.target.value)
              : undefined,
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

export interface QuestionProps {
  question: SentenceData;
  afterCheck: (wasCorrect: boolean, wordId: string) => unknown;
  onNext: () => unknown;
  onFinish: () => unknown;
  shouldFinish: boolean;
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

  const reset = () => {
    setUserEnteredSolution('');
    setUserEnteredSolutionStatus('partially_correct');
  };

  return {
    userEnteredSolution,
    setUserEnteredSolution,
    userEnteredSolutionStatus,
    reset,
  };
}

function getFillInTheBlanksQuestion(question: SentenceData, lm: LanguageModel) {
  const questionText = question.sentence.text!;

  const { wordToMask, intervalToMask } = chooseMaskedWordWeighted(
    questionText,
    question.words,
    lm,
  );
  const maskedWordComponent = (
    <Word
      wordScore={wordToMask}
      wordText={questionText.slice(intervalToMask[0], intervalToMask[1])}
    />
  );

  const textBefore = questionText.slice(0, intervalToMask[0]);
  const wordScoresBefore = lm
    .getWords(textBefore)
    .map(
      (word) =>
        question.words.find((wordScore) => wordScore.word!.wordText === word)!,
    );
  const wordComponentsBefore = getWordComponents(
    textBefore,
    wordScoresBefore,
    lm,
  );

  const textAfter = questionText.slice(intervalToMask[1]);
  const wordScoresAfter = lm
    .getWords(textAfter)
    .map(
      (word) =>
        question.words.find((wordScore) => wordScore.word!.wordText === word)!,
    );
  const wordComponentsAfter = getWordComponents(textAfter, wordScoresAfter, lm);

  return {
    wordComponentsBefore,
    wordComponentsAfter,
    maskedWordComponent,
    maskedWord: wordToMask.word!.wordText!,
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

  // const wordToMask = chance.weighted(wordScores, weights);
  const { maxIdx } = maxWithIdx(weights)!;
  const wordToMask = wordScores[maxIdx];
  const occurrences = lm.findWord(text, wordToMask.word!.wordText!);
  // const occurrenceToMask = sample(occurrences)!;
  const occurrenceToMask = occurrences[0];

  return {
    wordToMask,
    intervalToMask: occurrenceToMask,
  };
}

function maxWithIdx(items: number[]) {
  if (items.length === 0) {
    return;
  }

  let max = items[0];
  let maxIdx = 0;
  for (let i = 1; i < items.length; ++i) {
    if (max < items[i]) {
      max = items[i];
      maxIdx = i;
    }
  }

  return {
    max,
    maxIdx,
  };
}

function getWordComponents(
  text: string,
  wordScores: CorrectedWordScoreType[],
  lm: LanguageModel,
) {
  const wordToIntervalIdx = new Map<string, number>();

  const components = [];
  let previousInterval: [number, number] | undefined;
  for (const wordScore of wordScores) {
    const wordText = wordScore.word!.wordText!;

    if (!wordToIntervalIdx.has(wordText)) {
      wordToIntervalIdx.set(wordText, 0);
    }

    const currentIntervalIdx = wordToIntervalIdx.get(wordText)!;
    const currentInterval = lm.findWord(text, wordText)[currentIntervalIdx];
    wordToIntervalIdx.set(wordText, currentIntervalIdx + 1);

    const originalWordText = text.slice(currentInterval[0], currentInterval[1]);
    const currentComponent = (
      <Word wordText={originalWordText} wordScore={wordScore} />
    );

    const previousText = previousInterval
      ? text.slice(previousInterval[1], currentInterval[0])
      : text.slice(0, currentInterval[0]);
    const previousComponent = <span>{previousText}</span>;

    components.push(previousComponent, currentComponent);

    previousInterval = currentInterval;
  }

  if (previousInterval) {
    components.push(<span>{text.slice(previousInterval[1])}</span>);
  }

  return components;
}
