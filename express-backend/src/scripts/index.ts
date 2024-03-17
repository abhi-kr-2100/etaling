import 'dotenv/config';
import '../db';

import TatoebaSentenceListCreator from './SentenceListCreator/TatoebaSentenceListCreator';

import { UserProfile } from '../user-profile';
import { LanguageCode } from '../../../shared/languages';

if (process.argv.length < 3) {
  process.exit();
}

switch (process.argv[2]) {
  case 'tatoeba': {
    if (process.argv.length !== 6) {
      console.error('Missing required params: title, user._id, language');
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
  default:
    console.error('Unknown operation');
}
