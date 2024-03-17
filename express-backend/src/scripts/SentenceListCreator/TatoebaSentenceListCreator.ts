import axios from 'axios';
import SentenceListCreator from '.';
import {
  LANG_ABBR_TO_CODE,
  LANG_CODE_TO_ABBR,
  LanguageAbbr,
  LanguageCode,
} from '../../../../shared/languages';
import { UserProfileType } from '../../user-profile';

import scriptLogger from '../logger';

export default class TatoebaSentenceListCreator extends SentenceListCreator {
  private tatoebaSourceLanguage: LanguageAbbr;
  private tatoebaTargetLanguages: LanguageAbbr[];
  private numPages: number;

  constructor(
    title: string,
    owner: UserProfileType,
    isPublic: boolean = true,
    config: TatoebaSentenceListCreatorConfig = defaultConfig,
  ) {
    super(title, owner, isPublic);

    config = {
      ...defaultConfig,
      ...config,
    };
    scriptLogger.debug(config);

    this.tatoebaSourceLanguage = LANG_CODE_TO_ABBR[
      config.fromLanguage
    ] as LanguageAbbr;
    this.tatoebaTargetLanguages = config.toLanguages.map(
      (l) => LANG_CODE_TO_ABBR[l] as LanguageAbbr,
    );
    this.numPages = config.numPages;
  }

  private getQuery(currPageNum: number) {
    const query =
      `https://api.dev.tatoeba.org/unstable/sentences?lang=${this.tatoebaSourceLanguage}&page=${currPageNum}` +
      `${this.tatoebaTargetLanguages.length === 1 ? `&trans=${this.tatoebaTargetLanguages[0]}` : ''}`;
    scriptLogger.debug(query);
    return query;
  }

  private async fetchSentencesAndTranslations() {
    const queries = [];
    for (let page = 1; page <= this.numPages; ++page) {
      const query = this.getQuery(page);
      queries.push(query);
    }
    scriptLogger.debug(queries);

    scriptLogger.info('Fetching pages...');
    const resps = (
      await Promise.all(
        queries.map((q) => {
          scriptLogger.info(`Fetching ${q}...`);
          return axios.get(q);
        }),
      )
    ).map((r) => r.data);
    scriptLogger.debug(resps);

    for (const resp of resps) {
      const sentenceData = resp.data;

      const sentencesWithTranslations = sentenceData.map((sd) => {
        const text = sd.text;
        const sentence = {
          text,
          textLanguageCode: LANG_ABBR_TO_CODE[this.tatoebaSourceLanguage],
        };
        const translations = sd.translations
          .flat()
          .filter((t) => this.tatoebaTargetLanguages.includes(t.lang))
          .map((t) => ({
            text: t.text,
            textLanguageCode: LANG_ABBR_TO_CODE[t.lang],
          }));

        return [sentence, ...translations];
      });

      this.push(...sentencesWithTranslations);
    }

    scriptLogger.info('Done!');
  }

  async execute() {
    await this.fetchSentencesAndTranslations();
    await super.execute();
  }
}

export interface TatoebaSentenceListCreatorConfig {
  fromLanguage?: LanguageCode;
  toLanguages?: LanguageCode[];
  numPages?: number;
}

const defaultConfig = {
  fromLanguage: 'en',
  toLanguages: [],
  numPages: 100,
} as TatoebaSentenceListCreatorConfig;
