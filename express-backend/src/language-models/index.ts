import { LanguageCode } from '../../../shared/languages';

export interface LanguageModel {
  getLanguage(): LanguageCode;
  getWords(sentence: string): string[];
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
