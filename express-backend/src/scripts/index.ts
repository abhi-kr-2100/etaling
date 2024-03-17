import 'dotenv/config';
import '../db';

import scriptLogger from './logger';

import TatoebaSentenceListCreator from './SentenceListCreator/TatoebaSentenceListCreator';

import { UserProfile } from '../user-profile';
import { LanguageCode } from '../../../shared/languages';

scriptLogger.debug(process.argv);

if (process.argv.length < 3) {
  scriptLogger.error('No operation specified.');
  process.exit();
}

switch (process.argv[2]) {
  case 'tatoeba': {
    if (process.argv.length !== 6) {
      scriptLogger.error('Missing required params: title, user._id, language');
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

    scriptLogger.info('Executing...');
    await sentenceListCreator.execute();
    break;
  }
  default:
    console.error('Unknown operation');
}
