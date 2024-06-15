import { Types } from 'mongoose';

import Sentence, { type SentenceType } from '../../sentence';
import SentenceScore from '../../sentence/sentenceScore';
import Word, { type WordType } from '../../word/word';
import WordScore from '../../word/wordScore';
import { UserProfile } from '../../user-profile';

import { getLanguageModel } from '../../language-models';

export default async function createScoresForUser(
  userProfileId: Types.ObjectId,
  sentenceListId: Types.ObjectId,
) {
  const user = await UserProfile.findById(userProfileId);
  if (user === null) {
    throw new Error(`User profile with ID ${userProfileId} couldn't be found.`);
  }
  if (user.configuredSentenceLists.includes(sentenceListId)) {
    return;
  }

  const sentences = await Sentence.find({
    'sentenceList._id': sentenceListId,
  });
  const createSentenceScoresPromise = SentenceScore.insertMany(
    sentences.map((sentence) => ({
      sentence,
      owner: user,
      level: 0,
      score: {},
    })),
    {
      ordered: false,
    },
  );

  const words = await getUniqueWordsFromSentences(sentences);
  const isWordNew = await Promise.all(
    words.map((w) => isANewWordForUser(w!, user._id.toString())),
  );
  const newWords = words.filter((w, idx) => isWordNew[idx]);

  const createWordScorePromise = WordScore.insertMany(
    newWords.map((word) => ({
      owner: user,
      score: {},
      word,
    })),
    {
      ordered: false,
    },
  );

  await Promise.all([createSentenceScoresPromise, createWordScorePromise]);

  user.configuredSentenceLists.push(sentenceListId);
  await user.save();
}

export async function getUniqueWordsFromSentences(sentences: SentenceType[]) {
  const uniqueWords = [
    ...new Set(
      sentences
        .map((sentence) => {
          const lm = getLanguageModel(sentence.textLanguageCode);
          const wordTexts = lm.getWords(sentence.text);
          return wordTexts.map((wordText) => ({
            wordText,
            languageCode: sentence.textLanguageCode,
          }));
        })
        .flat()
        .map((wordSchema) => JSON.stringify(wordSchema)),
    ),
  ].map((serialized) => JSON.parse(serialized) as WordType);

  return Promise.all(
    uniqueWords.map((word) => {
      return Word.findOne({
        wordText: word.wordText,
        languageCode: word.languageCode,
      });
    }),
  );
}

export async function isANewWordForUser(word: WordType, userId: string) {
  const foundWords = await WordScore.find({
    'word.wordText': word.wordText,
    'word.languageCode': word.languageCode,
    'owner._id': userId,
  });

  return foundWords.length == 0;
}
