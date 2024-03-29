import fs from 'node:fs/promises';

import SentenceListCreator from '.';
import { UserProfileType } from '../../user-profile';

import { LanguageCode } from '../../../../shared/languages';

export default class FileSentenceListCreator extends SentenceListCreator {
  private fromLanguage: string;
  private fromLanguageFile: string;

  private toLanguage?: string;
  private toLanguageFile?: string;

  constructor(
    title: string,
    owner: UserProfileType,
    isPublic: boolean = true,
    config: FileSentenceListCreatorConfig = defaultConfig,
  ) {
    super(title, owner, isPublic);

    config = {
      ...defaultConfig,
      ...config,
    };

    this.fromLanguage = config.fromLanguage;
    this.fromLanguageFile = config.fromLanguageFile;
    this.toLanguage = config.toLanguage;
    this.toLanguageFile = config.toLanguageFile;
  }

  private async fetchSentencesAndTranslations() {
    const sentencesPromise = fs.readFile(this.fromLanguageFile);
    const translationsPromise: Promise<Buffer | null> = this.toLanguageFile
      ? fs.readFile(this.toLanguageFile)
      : Promise.resolve(null);

    const [sentencesContent, translationsContent] = await Promise.all([
      sentencesPromise,
      translationsPromise,
    ]);

    const sentences = sentencesContent
      .toString()
      .split('\n')
      .filter((text) => text.trim().length > 0)
      .map((s) => ({
        text: s,
        textLanguageCode: this.fromLanguage,
      }));
    const translations = translationsContent
      ?.toString()
      .split('\n')
      .filter((text) => text.trim().length > 0)
      .map((t) => ({
        text: t,
        textLanguageCode: this.toLanguage,
      }));

    if (translations && sentences.length !== translations.length) {
      throw new Error(
        'The number of sentences and the number of translations must be the same.',
      );
    }

    const sentencesWithTranslations = translations
      ? sentences.map((s, idx) => [s, translations[idx]])
      : sentences.map((s) => [s]);

    this.push(...sentencesWithTranslations);
  }

  async execute() {
    await this.fetchSentencesAndTranslations();
    await super.execute();
  }
}

export interface FileSentenceListCreatorConfig {
  fromLanguage?: LanguageCode;
  toLanguage?: LanguageCode;
  fromLanguageFile?: string;
  toLanguageFile?: string;
}

const defaultConfig = {
  fromLanguage: 'en',
  fromLanguageFile: 'sentences.txt',
} as FileSentenceListCreatorConfig;
