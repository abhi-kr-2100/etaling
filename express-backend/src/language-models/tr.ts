import { LanguageCode } from '../../../shared/languages';
import EnglishLM from './en';

export default class TurkishLM extends EnglishLM {
  getLanguage(): LanguageCode {
    return 'tr';
  }
}
