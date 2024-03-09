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

  getSeparatorRegex(): RegExp {
    const space = new RegExp(/\s+/);
    const puncts = new RegExp(/\!|\(|\)|\{|\}|\[|\]|\;|\,|\.|\?/);

    // for example, ' is only a separator if it's at the end or begining of a
    // word: "I'm from 'Norway.'" The first ' (in I'm) is not a word separator
    const specialCases = new RegExp(/(^|\s+)\'|\'($|\s+)|(^|\s+)\"|\"($|\s+)/);

    const regex = new RegExp(
      [space, puncts, specialCases].map((re) => re.source).join('|'),
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
}
