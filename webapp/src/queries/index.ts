import {
  DefaultError,
  QueryClient,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import axios from 'axios';

import { SentenceListType } from '../../../express-backend/src/sentence-list';
import { GradeType } from '../../../express-backend/src/word/scoringAlgorithm';
import { useAuth0 } from '@auth0/auth0-react';
import { LanguageCode } from '../../../shared/languages';

export const queryClient = new QueryClient();

export function getSentenceLists(token: string) {
  return axios
    .get<SentenceListType[]>(`${import.meta.env.VITE_API_URI}/sentenceLists`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => res.data);
}

export function getPlaylist(
  token: string,
  id: string,
  limit?: number,
  translationLang?: LanguageCode,
) {
  const queryParams = new URLSearchParams({
    ...(limit ? { limit: limit.toString() } : {}),
    ...(translationLang ? { translationLang } : {}),
  });

  return axios
    .get(
      `${import.meta.env.VITE_API_URI}/sentenceLists/${id}?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    .then((res) => res.data);
}

export function updateSentenceScore(
  token: string,
  sentenceScoreId: string,
  grade: GradeType,
) {
  const queryParams = new URLSearchParams({
    grade: (grade as number).toString(),
  });

  return axios.post(
    `${import.meta.env.VITE_API_URI}/sentences/${sentenceScoreId}/updateScore?${queryParams.toString()}`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function updateWordScore(
  token: string,
  wordScoreId: string,
  grade: GradeType,
) {
  const queryParams = new URLSearchParams({
    grade: (grade as number).toString(),
  });

  return axios.post(
    `${import.meta.env.VITE_API_URI}/words/${wordScoreId}/updateScore?${queryParams.toString()}`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function updateWordEasinessFactor(
  token: string,
  wordScoreId: string,
  ef: number,
) {
  const queryParams = new URLSearchParams({
    ef: ef.toString(),
  });

  return axios.post(
    `${import.meta.env.VITE_API_URI}/words/${wordScoreId}/updateEF?${queryParams.toString()}`,
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function useAuthenticatedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(options: any, ...args): UseQueryResult<TData, TError> {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery({
    ...options,
    queryFn: async () => {
      const token = await getAccessTokenSilently();
      return options.queryFn(token, ...args);
    },
  });
}
