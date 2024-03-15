import {
  DefaultError,
  QueryClient,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import axios from 'axios';

import { SentenceListType } from '../../../express-backend/src/sentence-list';
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
