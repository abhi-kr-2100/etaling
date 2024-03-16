import axios from 'axios';
import SentenceListCreator from '.';
import {
  LANGUAGE_ABBRS,
  LANG_ABBR_TO_CODE,
  LANG_CODE_TO_ABBR,
  LanguageAbbr,
  LanguageCode,
} from '../../../../shared/languages';
import { UserProfileType } from '../../user-profile';

export default class TatoebaSentenceListCreator extends SentenceListCreator {
  private tatoebaSourceLanguage: LanguageAbbr;

  constructor(
    title: string,
    owner: UserProfileType,
    isPublic: boolean = true,
    languageCode: LanguageCode,
  ) {
    super(title, owner, isPublic);
    this.tatoebaSourceLanguage = LANG_CODE_TO_ABBR[
      languageCode
    ] as LanguageAbbr;
  }

  private async fetchSentencesAndTranslations() {
    for (
      let query = `https://api.dev.tatoeba.org/unstable/sentences?lang=${this.tatoebaSourceLanguage}`;
      query !== undefined;

    ) {
      const resp = (await axios.get(query)).data;
      const sentenceData = resp.data;

      const sentencesWithTranslations = sentenceData.map((sd) => {
        const text = sd.text;
        const sentence = {
          text,
          textLanguageCode: LANG_ABBR_TO_CODE[this.tatoebaSourceLanguage],
        };
        const translations = sd.translations
          .flat()
          .filter((t) => LANGUAGE_ABBRS.includes(t.lang))
          .map((t) => ({
            text: t.text,
            textLanguageCode: LANG_ABBR_TO_CODE[t.lang],
          }));

        return [sentence, ...translations];
      });

      this.push(...sentencesWithTranslations);
      query = resp.paging.next;
    }
  }

  async execute() {
    await this.fetchSentencesAndTranslations();
    await super.execute();
  }
}
