import EnglishLM from './en';
import type { LanguageCode } from '../../../shared/languages';

export default class SpanishLM extends EnglishLM {
  getLanguage(): LanguageCode {
    return 'es';
  }

  getWordSeparatingPunctuations(): string[] {
    const basePuncts = super.getWordSeparatingPunctuations();
    return [...basePuncts, '¡', '¿', '«', '»'];
  }
}
