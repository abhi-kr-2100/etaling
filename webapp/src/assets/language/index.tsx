import { ReactNode } from 'react';
import { t } from 'i18next';

import { LanguageCode } from '../../../../shared/languages';

import EsFlag from '../../../../shared/languages/flags/es.svg?react';
import JaFlag from '../../../../shared/languages/flags/ja.svg?react';
import RuFlag from '../../../../shared/languages/flags/ru.svg?react';
import TrFlag from '../../../../shared/languages/flags/tr.svg?react';

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
] as Language[];

export interface Language {
  id: LanguageCode;
  flag: ReactNode;
  name: string;
}

function tLanguages(key: string) {
  return t(key, { ns: 'Languages' });
}
