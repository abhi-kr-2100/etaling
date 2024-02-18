import { ReactNode } from 'react';
import { t } from 'i18next';

import EsFlag from './flags/es.svg?react';
import JaFlag from './flags/ja.svg?react';
import RuFlag from './flags/ru.svg?react';
import TrFlag from './flags/tr.svg?react';

export default [
  {
    id: 'es',
    flag: <EsFlag />,
    name: tLanguages('Spanish'),
  },
  {
    id: 'ja',
    flag: <JaFlag />,
    name: tLanguages('Japanese'),
  },
  {
    id: 'ru',
    flag: <RuFlag />,
    name: tLanguages('Russian'),
  },
  {
    id: 'tr',
    flag: <TrFlag />,
    name: tLanguages('Turkish'),
  },
] as Langauge[];

export interface Langauge {
  id: LanguageCode;
  flag: ReactNode;
  name: string;
}

// ISO 639-1 codes: https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
export type LanguageCode = 'es' | 'ja' | 'ru' | 'tr';

function tLanguages(key: string) {
  return t(key, { ns: 'Languages' });
}
