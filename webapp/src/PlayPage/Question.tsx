import { Box, Button, useTheme } from '@mui/material';
import {
  LanguageModel,
  getLanguageModel,
} from '../../../express-backend/src/language-models';
import { SerializedWordScoreType, SentenceData } from './Play';
import FillInTheBlanks from '../components/FillInTheBlanks';
import Word from './Word';
import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import sample from 'lodash/sample';
import Chance from 'chance';
const chance = new Chance();

export default function Question({
  question,
  afterCheck,
  onNext,
  onFinish,
  shouldFinish = false,
}: QuestionProps) {
  const theme = useTheme();
  const lm = useMemo(
    () => getLanguageModel(question.sentence.textLanguageCode),
    [question.sentence.textLanguageCode],
  );

  const { textBefore, maskedText, textAfter, maskedWordId } =
    useFillInTheBlanksQuestion(question, lm);

  const { wordComponentsBefore, wordComponentsUnderMask, wordComponentsAfter } =
    useMemo(
      () =>
        getWordComponentsForFillInTheBlanks(
          {
            textBefore,
            maskedText,
            textAfter,
          },
          question.words,
          lm,
        ),
      [textBefore, maskedText, textAfter, question.words, lm],
    );

  const [isSolutionChecked, setIsSolutionChecked] = useState(false);
  const checkUserEnteredSolution = () => {
    setIsSolutionChecked(true);
    const isCorrect = lm.areEqual(maskedText, userEnteredSolution);
    afterCheck(isCorrect, maskedWordId);
  };

  const {
    userEnteredSolution,
    setUserEnteredSolution,
    userEnteredSolutionStatus,
    reset,
  } = useSolution(
    (solution) => lm.startsWith(maskedText, solution),
    (solution) => lm.areEqual(maskedText, solution),
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
        hint={question.translations[0].text}
        solved={isSolutionChecked}
        solution={wordComponentsUnderMask}
        BlankInputProps={{
          value: isSolutionChecked ? maskedText : userEnteredSolution,
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
            width: `${maskedText.length + 2.5}ch`,
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

function chooseMaskedWordWeighted(
  text: string,
  wordScores: SerializedWordScoreType[],
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
      wordScore.score.interRepetitionIntervalInDays - daysSinceLastReview,
    );
    return 1.0 / (level * wordScore.score.easinessFactor);
  });

  const amplifiedWeights = amplifyMax(weights);
  const wordToMask = chance.weighted(wordScores, amplifiedWeights);
  const occurrences = lm.findWord(text, wordToMask.word.wordText);
  const occurrenceToMask = sample(occurrences)!;

  return {
    wordToMask,
    intervalToMask: occurrenceToMask,
  };
}

function amplifyMax(numbers: number[], factor = 2.0) {
  const max = Math.max(...numbers);
  const maxIdx = numbers.findIndex((x) => x === max);
  return [
    ...numbers.slice(0, maxIdx),
    numbers[maxIdx] * factor,
    ...numbers.slice(maxIdx + 1),
  ];
}

function getWordComponentsFromWordScores(
  text: string,
  wordScores: SerializedWordScoreType[],
  lm: LanguageModel,
) {
  const wordToIntervalIdx = new Map<string, number>();

  const components = [];
  let previousInterval: [number, number] | undefined;
  for (const wordScore of wordScores) {
    const wordText = wordScore.word.wordText;

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

function useFillInTheBlanksQuestion(question: SentenceData, lm: LanguageModel) {
  // We always want to use the initial question that was supplied.
  // Since the masked word is chosen based on the word scores, and
  // interacting with the question changes word scores, we don't
  // want to rechoose the masked word for the same question.
  const [initialQuestion, setInitialQuestion] = useState(question);
  useEffect(() => {
    if (
      initialQuestion.sentence.sentenceScoreId ===
      question.sentence.sentenceScoreId
    ) {
      return;
    }

    setInitialQuestion(question);
  }, [initialQuestion.sentence.sentenceScoreId, question]);

  const questionText = initialQuestion.sentence.text;

  const { wordToMask, intervalToMask } = useMemo(
    () => chooseMaskedWordWeighted(questionText, initialQuestion.words, lm),
    [questionText, initialQuestion.words, lm],
  );

  const textBefore = questionText.slice(0, intervalToMask[0]);
  const maskedText = questionText.slice(intervalToMask[0], intervalToMask[1]);
  const textAfter = questionText.slice(intervalToMask[1]);

  return {
    textBefore,
    maskedText,
    textAfter,
    maskedWordId: wordToMask._id,
  };
}

function getWordComponentsFromText(
  text: string,
  wordScores: SerializedWordScoreType[],
  lm: LanguageModel,
) {
  const wordTexts = lm.getWords(text);
  const matchedWordScores = wordTexts.map(
    (wordText) =>
      wordScores.find((wordScore) => wordScore.word.wordText === wordText)!,
  );

  if (matchedWordScores.some((ws) => ws === undefined)) {
    // Mismatch between wordScores supplied and the text given. This happens
    // when up-to-date data is not passed. Will be correct in the next render.
    return [];
  }

  return getWordComponentsFromWordScores(text, matchedWordScores, lm);
}

function getWordComponentsForFillInTheBlanks(
  texts: { textBefore: string; maskedText: string; textAfter: string },
  wordScores: SerializedWordScoreType[],
  lm: LanguageModel,
) {
  const wordComponentsBefore = getWordComponentsFromText(
    texts.textBefore,
    wordScores,
    lm,
  );

  const wordComponentsUnderMask = getWordComponentsFromText(
    texts.maskedText,
    wordScores,
    lm,
  );

  const wordComponentsAfter = getWordComponentsFromText(
    texts.textAfter,
    wordScores,
    lm,
  );

  return {
    wordComponentsBefore,
    wordComponentsUnderMask,
    wordComponentsAfter,
  };
}
