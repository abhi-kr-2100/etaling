import { useState } from 'react';
import { useAppSelector } from '../redux/hooks';
import Question from './Question';

export default function Questions({ afterCheck, onFinish }: QuestionsProps) {
  const questions = useAppSelector((state) => state.playlist.sentences);

  const [currQuestionIdx, setCurrQuestionIdx] = useState(0);
  const goToNextQuestion = () => setCurrQuestionIdx((prev) => prev + 1);

  if (questions.length === 0) {
    // data hasn't loaded yet
    return;
  }

  return (
    <Question
      question={questions[currQuestionIdx]}
      afterCheck={(wasCorrect, solutionWordId) =>
        afterCheck(wasCorrect, currQuestionIdx, solutionWordId)
      }
      onNext={goToNextQuestion}
      onFinish={onFinish}
      shouldFinish={currQuestionIdx === questions.length - 1}
    />
  );
}

export interface QuestionsProps {
  afterCheck: (wasCorrect: boolean, idx: number, wordId: string) => unknown;
  onFinish: () => unknown;
}
