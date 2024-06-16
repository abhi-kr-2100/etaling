import 'dotenv/config';
import '../db/mongo';

import TatoebaSentenceListCreator from './SentenceListCreator/TatoebaSentenceListCreator';
import FileSentenceListCreator from './SentenceListCreator/FileSentenceListCreator';

import { UserProfile } from '../user-profile';

import type { LanguageCode } from '../../../shared/languages';
import SentenceList from '../sentence-list';
import Sentence from '../sentence';
import { Types } from 'mongoose';
import { getLanguageModel } from '../language-models';
import SentenceScore from '../sentence/sentenceScore';
import WordScore from '../word/wordScore';

if (process.argv.length < 3) {
  process.exit();
}

switch (process.argv[2]) {
  case 'tatoeba': {
    if (process.argv.length !== 6) {
      process.exit(1);
    }

    const user = await UserProfile.findById(process.argv[4]);
    if (user === null) {
      console.error(`User profile with ID ${process.argv[4]} not found.`);
      process.exit(1);
    }

    const sentenceListCreator = new TatoebaSentenceListCreator(
      process.argv[3],
      user,
      true,
      {
        fromLanguage: process.argv[5] as LanguageCode,
        toLanguages: ['en'],
      },
    );

    await sentenceListCreator.execute();
    break;
  }
  case 'file': {
    if (process.argv.length !== 9) {
      process.exit(1);
    }

    const user = await UserProfile.findById(process.argv[4]);
    if (user === null) {
      console.error(`User profile with ID ${process.argv[4]} not found.`);
      process.exit(1);
    }

    const sentenceListCreator = new FileSentenceListCreator(
      process.argv[3],
      user,
      true,
      {
        fromLanguage: process.argv[5] as LanguageCode,
        toLanguage: process.argv[6] as LanguageCode,
        fromLanguageFile: process.argv[7],
        toLanguageFile: process.argv[8],
      },
    );

    await sentenceListCreator.execute();
    break;
  }
  case 'breakup': {
    if (process.argv.length < 4) {
      process.exit(1);
    }

    const [sentenceList, sentences] = await Promise.all([
      SentenceList.findById(process.argv[3]),
      Sentence.find({
        'sentenceList._id': new Types.ObjectId(process.argv[3]),
      }),
    ]);

    if (sentenceList === null) {
      console.error(`SentenceList with ID ${process.argv[3]} not found.`);
      process.exit(1);
    }

    const wordLengths = process.argv
      .slice(4)
      .toSorted()
      .map((wlen) => Number.parseInt(wlen));
    const newSentenceLists = await Promise.all(
      wordLengths.map((wlen) =>
        SentenceList.create({
          isPublic: sentenceList.isPublic,
          owner: sentenceList.owner,
          title: `${sentenceList.title} - ${wlen} words or less`,
        }),
      ),
    );

    await Promise.all(
      sentences
        .map((sentence) => {
          const lm = getLanguageModel(sentence.textLanguageCode);
          const words = lm.getWords(sentence.text);

          const idx = wordLengths.findIndex((wlen) => wlen >= words.length);
          if (idx === -1) {
            return;
          }

          const score = SentenceScore.findOne({
            'sentence._id': sentence._id,
          });

          return Promise.all([
            score.updateOne({
              $set: { 'sentence.sentenceList': newSentenceLists[idx] },
            }),
            sentence.updateOne({
              $set: { sentenceList: newSentenceLists[idx] },
            }),
          ]);
        })
        .filter((x) => x !== undefined),
    );

    break;
  }
  case 'normalizeSentenceScores': {
    if (process.argv.length !== 5) {
      console.error(`Missing parameters: userId sentenceListId`);
      process.exit(1);
    }

    const userId = new Types.ObjectId(process.argv[3]);
    const sentenceListId = new Types.ObjectId(process.argv[4]);

    const sentenceScores = await SentenceScore.find({
      'sentence.sentenceList._id': sentenceListId,
      'owner._id': userId,
    });
    await Promise.all(
      sentenceScores.map(async (sentenceScore) => {
        const lm = getLanguageModel(sentenceScore.sentence.textLanguageCode);
        const words = lm.getWords(sentenceScore.sentence.text);
        const wordScores = await WordScore.find({
          'word.languageCode': sentenceScore.sentence.textLanguageCode,
          'word.wordText': { $in: words },
          'owner._id': userId,
        });
        const lowestScoredWord = wordScores.reduce((prev, curr) => {
          return prev.score.easinessFactor < curr.score.easinessFactor
            ? prev
            : curr;
        });

        sentenceScore.score = lowestScoredWord.score;
        await sentenceScore.save();
      }),
    );

    break;
  }
  default:
    console.error('Unknown operation');
}

console.info('Done!');
