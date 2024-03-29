import SentenceList from '../../sentence-list';
import Sentence, { SentenceType } from '../../sentence';
import Word, { WordType } from '../../word/word';
import { UserProfileType } from '../../user-profile';

import { getLanguageModel } from '../../language-models';

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
          return Sentence.insertMany(translations);
        }),
      );

      const [sentenceList, createdTranslations] = await Promise.all([
        createSentenceListPromise,
        createTranslationsPromise,
      ]);

      const createSentencesPromise = Sentence.insertMany(
        this.sentencesAndTranslations.map((st, idx) => {
          const sentence = st[0];
          const translations = createdTranslations[idx];
          return {
            ...sentence,
            sentenceList,
            translations: translations.map((t) => t._id),
          };
        }),
        {
          ordered: false,
        },
      );

      const words = getUniqueWordsFromSentences(
        this.sentencesAndTranslations.map((st) => st[0]),
      );
      const isWordNew = await Promise.all(words.map(isNewWord));
      const newWords = words.filter((_, idx) => isWordNew[idx]);

      const createWordsPromise = Word.insertMany(newWords, {
        ordered: false,
      });

      await Promise.all([createSentencesPromise, createWordsPromise]);

      this.status = 'completed';
    } catch (ex) {
      this.status = 'failed';
      throw ex;
    }
  }
}

function getUniqueWordsFromSentences(sentences: SentenceType[]) {
  return [
    ...new Set(
      sentences
        .map((sentence) => {
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
  ].map((wstr) => JSON.parse(wstr) as WordType);
}

async function isNewWord(word: WordType) {
  const foundWords = await Word.find({
    wordText: word.wordText,
    languageCode: word.languageCode,
  });

  return foundWords.length === 0;
}
