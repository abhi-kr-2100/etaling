import EnglishLM from './en';
import { LanguageCode } from '../../../shared/languages';

export default class TurkishLM extends EnglishLM {
  getLanguage(): LanguageCode {
    return 'tr';
  }
}
