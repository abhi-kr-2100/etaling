import { describe, it, expect } from '@jest/globals';
import EnglishLM from '../../language-models/en';

describe('English language model', () => {
  const lm = new EnglishLM();
  const sentences = [
    [
      'The wind used to blow all day.',
      ['the', 'wind', 'used', 'to', 'blow', 'all', 'day'],
    ],
    ["How's it feeling outside?", ["how's", 'it', 'feeling', 'outside']],
    [
      "Tom says you're a librarian, is that true?",
      ['tom', 'says', "you're", 'a', 'librarian', 'is', 'that', 'true'],
    ],
    [
      "Juno's wiles did not go unnoticed by her brother (Neptune).",
      [
        "juno's",
        'wiles',
        'did',
        'not',
        'go',
        'unnoticed',
        'by',
        'her',
        'brother',
        'neptune',
      ],
    ],
    [`"I'm Tom", he said.`, ["i'm", 'tom', 'he', 'said']],
  ];

  it("should report it's language to be English", () => {
    expect(lm.getLanguage()).toBe('en');
  });

  it('should lower case English strings', () => {
    const s = 'Into the sun.';
    const lowerCased = lm.toLowerCase(s);
    expect(lowerCased).toBe('into the sun.');
  });

  it('should upper case English strings', () => {
    const s = 'I live in a palace!';
    const upperCased = lm.toUpperCase(s);
    expect(upperCased).toBe('I LIVE IN A PALACE!');
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

  it('should find all occurrences of word', () => {
    const s1 = 'Into the void I go.';
    const matches1 = lm.findWord(s1, 'i');
    expect(matches1.length).toBe(1);
    expect(matches1[0].length).toBe(2);
    expect(matches1[0][0]).toBe(s1.indexOf(' I ') + 1);
    expect(matches1[0][1]).toBe(s1.indexOf(' I ') + 2);

    const s2 =
      'El is a substring of level, a substring of ello, but el is not a substring of car.';
    const matches2 = lm.findWord(s2, 'EL');
    expect(matches2.length).toBe(2);
    expect(matches2[0][0]).toBe(0);
    expect(matches2[0][1]).toBe(2);
    expect(matches2[1][0]).toBe(s2.indexOf(' el ') + 1);
    expect(matches2[1][1]).toBe(s2.indexOf(' el ') + 3);

    const s3 = 'This is a test of this.';
    const matches3 = lm.findWord(s3, 'this');
    expect(matches3.length).toBe(2);
    expect(matches3[0][0]).toBe(0);
    expect(matches3[0][1]).toBe('this'.length);
    expect(matches3[1][0]).toBe(s3.indexOf('this'));
    expect(matches3[1][1]).toBe(s3.indexOf('.'));
  });
});
