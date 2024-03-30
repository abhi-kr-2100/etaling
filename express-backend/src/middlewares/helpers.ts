import {
  getUniqueWordsFromSentences,
  isANewWordForUser,
} from '../scripts/ScoreCreator';
import Sentence, { SentenceType } from '../sentence';
import SentenceScore from '../sentence/sentenceScore';
import { UserProfileType } from '../user-profile';
import WordScore from '../word/wordScore';

export async function createSomeScoresForUser(
  user: UserProfileType,
  sentenceListId: string,
  limit: number,
) {
  const sentences = await Sentence.find({
    'sentenceList._id': sentenceListId,
  }).limit(limit);

  const isSentenceNew = await Promise.all(
    sentences.map((s) => isSentenceNewForUser(s, user._id.toString())),
  );
  const newSentences = sentences.filter((_, idx) => isSentenceNew[idx]);

  const createNewSentenceScoresPromise = SentenceScore.insertMany(
    newSentences.map((sentence) => ({
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
    words.map((w) => isANewWordForUser(w, user._id.toString())),
  );
  const newWords = words.filter((w, idx) => isWordNew[idx]);

  const createNewWordScoresPromise = WordScore.insertMany(
    newWords.map((word) => ({
      owner: user,
      score: {},
      word,
    })),
    {
      ordered: false,
    },
  );

  await Promise.all([
    createNewSentenceScoresPromise,
    createNewWordScoresPromise,
  ]);
}

export async function isSentenceNewForUser(
  sentence: SentenceType,
  userId: string,
) {
  const foundSentenceScores = await SentenceScore.find({
    'sentence.text': sentence.text,
    'sentence.textLanguageCode': sentence.textLanguageCode,
    'owner._id': userId,
  });

  return foundSentenceScores.length === 0;
}
