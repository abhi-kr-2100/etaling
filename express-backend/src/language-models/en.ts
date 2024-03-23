import { CaseSensitiveLM, LanguageModel, WordSeparatedLM } from '.';
import { LanguageCode } from '../../../shared/languages';

export default class EnglishLM
  implements LanguageModel, WordSeparatedLM, CaseSensitiveLM
{
  getLanguage(): LanguageCode {
    return 'en';
  }

  toLowerCase(s: string): string {
    return s.toLocaleLowerCase(this.getLanguage());
  }

  toUpperCase(s: string): string {
    return s.toLocaleUpperCase(this.getLanguage());
  }

  // Punctuations that separate words without exception;
  // . does but ' does not since we consider "I'm" to be a single word
  getWordSeparatingPunctuations(): string[] {
    return '!(){}[];,.?:"'.split('');
  }

  // Symbols that are not always punctuations, such as "'" in "I'm".
  getSpecialPunctuations(): string[] {
    return "'".split('');
  }

  getSeparatorRegex(): RegExp {
    const spaceRE = new RegExp(/\s+/);

    const normalPuncts = this.getWordSeparatingPunctuations();
    const normalPunctsRE = new RegExp(
      normalPuncts
        .map((p) => new RegExp(`\\${p}`))
        .map((re) => re.source)
        .join('|'),
    );

    // Some punctuations such as "'", don't always separate a word.
    // For example, we consider "I'm" to be a single word. Here "'" is part
    // of the word. We want to split on these special symbols only if
    // they are *not* surrounded by words, i.e., they *are* surrounded by
    // spaces and punctuations.
    const specialPuncts = this.getSpecialPunctuations();
    const specialPunctsRE = new RegExp(
      specialPuncts
        .map((p) => {
          const fix1 = new RegExp(/(^|\s+)/);
          const fix2 = normalPunctsRE;

          const fix = new RegExp(fix1.source + '|' + fix2.source);
          return new RegExp(`(${fix})\\${p}(${fix})`);
        })
        .map((re) => re.source)
        .join('|'),
    );

    const regex = new RegExp(
      [spaceRE, normalPunctsRE, specialPunctsRE]
        .map((re) => re.source)
        .join('|'),
    );

    return regex;
  }

  getWords(sentence: string): string[] {
    const words = sentence
      .split(this.getSeparatorRegex())
      .filter((word) => word !== undefined && word.length > 0)
      .map((word) => this.toLowerCase(word));
    return words;
  }

  findWord(sentence: string, word: string): [number, number][] {
    const wordSeparatorRE = this.getSeparatorRegex();
    const wordRE = new RegExp(
      `(^|${wordSeparatorRE.source})${this.toLowerCase(word)}(${wordSeparatorRE.source}|$)`,
    );

    const matches = [
      ...this.toLowerCase(sentence).matchAll(new RegExp(wordRE, 'g')),
    ];

    // Matches start with all the matched characters including space and punctuations.
    // We want matches to begin only with the first letter of the given word.
    // We're making the following assumption here: the punctuations are different
    // from letters in this language
    const wordMatches = matches.map((m) => {
      const matchedString = this.toLowerCase(m[0]);
      const extraPrefixLen = matchedString.indexOf(this.toLowerCase(word[0]));

      return [
        m.index + extraPrefixLen,
        m.index + extraPrefixLen + word.length,
      ] as [number, number];
    });

    return wordMatches;
  }
}
