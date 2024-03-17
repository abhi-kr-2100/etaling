import { describe, it, expect } from '@jest/globals';
import TurkishLM from '../../language-models/tr';

describe('Turkish language model', () => {
  const lm = new TurkishLM();
  const sentences = [
    [
      "Tom'un geç saatlere kadar çalışmak zorunda olduğundan eminim.",
      [
        "tom'un",
        'geç',
        'saatlere',
        'kadar',
        'çalışmak',
        'zorunda',
        'olduğundan',
        'eminim',
      ],
    ],
    [
      '"Aksu ilçesi hangi ile bağlıdır?" "Isparta."',
      ['aksu', 'ilçesi', 'hangi', 'ile', 'bağlıdır', 'ısparta'],
    ],
    ['Tom para sorunları yaşıyor.', ['tom', 'para', 'sorunları', 'yaşıyor']],
  ];

  it("should report it's language to be Turkish", () => {
    expect(lm.getLanguage()).toBe('tr');
  });

  it('should lower case Turkish strings', () => {
    const s1 = "İstanbul'da yaşıyorum.";
    const lowerCased1 = lm.toLowerCase(s1);
    expect(lowerCased1).toBe("istanbul'da yaşıyorum.");

    const s2 = 'Ali Isparta ekmeği aldı.';
    const lowerCased2 = lm.toLowerCase(s2);
    expect(lowerCased2).toBe('ali ısparta ekmeği aldı.');
  });

  it('should upper case Turkish strings', () => {
    const s1 = 'Ali Isparta ekmeği aldı.';
    const upperCased1 = lm.toUpperCase(s1);
    expect(upperCased1).toBe('ALİ ISPARTA EKMEĞİ ALDI.');

    const s2 = 'Keçiborlu ilçesi hangi ile bağlıdır?';
    const upperCased2 = lm.toUpperCase(s2);
    expect(upperCased2).toBe('KEÇİBORLU İLÇESİ HANGİ İLE BAĞLIDIR?');
  });

  it('should split a sentence into the right number of words', () => {
    sentences.forEach((sentence) => {
      const words = lm.getWords(sentence[0] as string);
      expect(words.length).toBe(sentence[1].length);
    });
  });

  it('should split a sentence into the right words', () => {
    sentences.forEach((sentence) => {
      const words = lm.getWords(sentence[0] as string);
      expect(words).toEqual(sentence[1]);
    });
  });
});
