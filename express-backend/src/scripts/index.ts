import 'dotenv/config';
import '../db/mongo';

import TatoebaSentenceListCreator from './SentenceListCreator/TatoebaSentenceListCreator';
import FileSentenceListCreator from './SentenceListCreator/FileSentenceListCreator';

import { UserProfile } from '../user-profile';

import { LanguageCode } from '../../../shared/languages';
import SentenceList from '../sentence-list';
import Sentence from '../sentence';
import { Types } from 'mongoose';
import { getLanguageModel } from '../language-models';
import SentenceScore from '../sentence/sentenceScore';

if (process.argv.length < 3) {
  process.exit();
}

switch (process.argv[2]) {
  case 'tatoeba': {
    if (process.argv.length !== 6) {
      process.exit(1);
    }

    const user = await UserProfile.findById(process.argv[4]);
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
  default:
    console.error('Unknown operation');
}

console.info('Done!');
