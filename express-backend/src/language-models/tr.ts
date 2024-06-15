import EnglishLM from './en';
import type { LanguageCode } from '../../../shared/languages';

export default class TurkishLM extends EnglishLM {
  getLanguage(): LanguageCode {
    return 'tr';
  }
}
