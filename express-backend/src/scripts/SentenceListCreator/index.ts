import { UserProfileType } from '../../user-profile';
import Sentence, { SentenceType } from '../../sentence';
import SentenceList from '../../sentence-list';
import { getLanguageModel } from '../../language-models';
import Word from '../../word/word';

export default class SentenceListCreator {
  private title: string;
  private owner: UserProfileType;
  private isPublic: boolean;

  private sentencesAndTranslations: any[][];

  private status: 'ready' | 'failed' | 'completed';

  constructor(title: string, owner: UserProfileType, isPublic: boolean = true) {
    this.title = title;
    this.owner = owner;
    this.isPublic = isPublic;
    this.status = 'ready';
    this.sentencesAndTranslations = [];
  }

  push(...sentencesAndTranslationsToCreate: any[][]) {
    if (this.status !== 'ready') {
      throw new Error(
        'Cannot push sentences into an executed SentenceListCreator.',
      );
    }
    this.sentencesAndTranslations.push(...sentencesAndTranslationsToCreate);
  }

  async execute() {
    if (this.status !== 'ready') {
      throw new Error('This sentence list creator has already been executed.');
    }

    try {
      const createSentenceListPromise = SentenceList.create({
        title: this.title,
        isPublic: this.isPublic,
        owner: this.owner,
      });

      const createTranslationsPromise = Promise.all(
        this.sentencesAndTranslations.map((st) => {
          const translations = st.slice(1);
          return Promise.all(translations.map((t) => Sentence.create(t)));
        }),
      );

      const [sentenceList, createdTranslations] = await Promise.all([
        createSentenceListPromise,
        createTranslationsPromise,
      ]);

      const createSentencesPromise = Promise.all(
        this.sentencesAndTranslations.map((st, idx) => {
          const sentence = st[0];
          const translations = createdTranslations[idx];
          return Sentence.create({
            ...sentence,
            sentenceList,
            translations: translations.map((t) => t._id),
          });
        }),
      );

      const words = [
        ...new Set(
          this.sentencesAndTranslations
            .map((st) => {
              const sentence = st[0];
              const lm = getLanguageModel(sentence.textLanguageCode);
              const words = lm.getWords(sentence.text);

              return words.map((wordText) =>
                JSON.stringify({
                  wordText,
                  languageCode: sentence.textLanguageCode,
                }),
              );
            })
            .flat(),
        ),
      ];

      const createWordsPromise = Promise.all(
        words.map((wstr) => {
          const word = JSON.parse(wstr);
          return Word.create({
            ...word,
          });
        }),
      );

      await Promise.all([createSentencesPromise, createWordsPromise]);

      this.status = 'completed';
    } catch (ex) {
      this.status = 'failed';
      throw ex;
    }
  }
}
