import { LanguageCode } from '../../../shared/languages';
import EnglishLM from './en';

export default class SpanishLM extends EnglishLM {
  getLanguage(): LanguageCode {
    return 'es';
  }

  getWordSeparatingPunctuations(): string[] {
    const basePuncts = super.getWordSeparatingPunctuations();
    return [...basePuncts, '¡', '¿', '«', '»'];
  }
}
