import axios from 'axios';
import SentenceListCreator from '.';
import {
  TATOEBA_ABBR_TO_LANGUAGE_CODE,
  LANG_CODE_TO_TATOEBA_ABBR,
  TatoebaAbbr,
  LanguageCode,
} from '../../../../shared/languages';
import { UserProfileType } from '../../user-profile';

export default class TatoebaSentenceListCreator extends SentenceListCreator {
  private tatoebaSourceLanguage: TatoebaAbbr;
  private tatoebaTargetLanguages: TatoebaAbbr[];
  private startPage: number;
  private endPage: number;

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

    this.tatoebaSourceLanguage = LANG_CODE_TO_TATOEBA_ABBR[
      config.fromLanguage
    ] as TatoebaAbbr;

    this.tatoebaTargetLanguages = config.toLanguages.map(
      (l) => LANG_CODE_TO_TATOEBA_ABBR[l] as TatoebaAbbr,
    );

    this.startPage = config.startPage;
    this.endPage = config.endPage;
  }

  private getQuery(currPageNum: number) {
    const query =
      `https://api.dev.tatoeba.org/unstable/sentences?lang=${this.tatoebaSourceLanguage}&page=${currPageNum}` +
      `${this.tatoebaTargetLanguages.length === 1 ? `&trans=${this.tatoebaTargetLanguages[0]}` : ''}`;
    return query;
  }

  private async fetchSentencesAndTranslations() {
    const queries = [];
    for (let page = this.startPage; page <= this.endPage; ++page) {
      const query = this.getQuery(page);
      queries.push(query);
    }

    const resps = (
      await Promise.all(
        queries.map((q) => {
          return axios.get(q);
        }),
      )
    ).map((r) => r.data);

    for (const resp of resps) {
      const sentenceData = resp.data;

      const sentencesWithTranslations = sentenceData.map((sd) => {
        const text = sd.text;
        const sentence = {
          text,
          textLanguageCode:
            TATOEBA_ABBR_TO_LANGUAGE_CODE[this.tatoebaSourceLanguage],
        };
        const translations = sd.translations
          .flat()
          .filter((t) => this.tatoebaTargetLanguages.includes(t.lang))
          .map((t) => ({
            text: t.text,
            textLanguageCode: TATOEBA_ABBR_TO_LANGUAGE_CODE[t.lang],
          }));

        return [sentence, ...translations];
      });

      this.push(...sentencesWithTranslations);
    }
  }

  async execute() {
    await this.fetchSentencesAndTranslations();
    await super.execute();
  }
}

export interface TatoebaSentenceListCreatorConfig {
  fromLanguage?: LanguageCode;
  toLanguages?: LanguageCode[];
  startPage?: number;
  endPage?: number;
}

const defaultConfig = {
  fromLanguage: 'en',
  toLanguages: [],
  startPage: 1,
  endPage: 100,
} as TatoebaSentenceListCreatorConfig;
