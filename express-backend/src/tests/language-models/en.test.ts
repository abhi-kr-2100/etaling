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
});
