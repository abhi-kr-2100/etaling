import { LanguageCode } from '../../../shared/languages';
import EnglishLM from './en';
import SpanishLM from './es';
import TurkishLM from './tr';

export interface LanguageModel {
  getLanguage(): LanguageCode;
  getWords(sentence: string): string[];
  findWord(sentence: string, word: string): [number, number][];
  areEqual(s1: string, s2: string): boolean;
}

/**
 * An LM where a sentence can be split into words simply by spliting them
 * across word separators.
 *
 * For example, in English, words are separated by whitespace and some
 * punctuations.
 */
export interface WordSeparatedLM extends LanguageModel {
  getSeparatorRegex(): RegExp;
}

export interface CaseSensitiveLM extends LanguageModel {
  toLowerCase(s: string): string;
  toUpperCase(s: string): string;
}

export function getLanguageModel(languageCode: LanguageCode) {
  switch (languageCode) {
    case 'en':
      return new EnglishLM();
    case 'es':
      return new SpanishLM();
    case 'tr':
      return new TurkishLM();
    default:
      throw new Error(
        `No suitable language model for language: ${languageCode}`,
      );
  }
}
