import { describe, it, expect } from '@jest/globals';
import SpanishLM from '../../language-models/es';

describe('Spanish language model', () => {
  const lm = new SpanishLM();
  const sentences = [
    ['¡Felicidades!', ['felicidades']],
    ["How's it feeling outside?", ["how's", 'it', 'feeling', 'outside']],
    ['Sígueme.', ['sígueme']],
    ['¡Muérete!', ['muérete']],
    [
      '¿Por qué me estás preguntando "¿Por qué?"?',
      ['por', 'qué', 'me', 'estás', 'preguntando', 'por', 'qué'],
    ],
    ['¿Quieres que yo te ayude?', ['quieres', 'que', 'yo', 'te', 'ayude']],
    [
      '¿Cruzar el río a nado? ¡Tú estás como una cabra!',
      [
        'cruzar',
        'el',
        'río',
        'a',
        'nado',
        'tú',
        'estás',
        'como',
        'una',
        'cabra',
      ],
    ],
  ];

  it("should report it's language to be Spanish", () => {
    expect(lm.getLanguage()).toBe('es');
  });

  it('should lower case Spanish strings', () => {
    const s = '¿Qué mote crees que le pega más a Keiko Tanaka, de 25 años?';
    const lowerCased = lm.toLowerCase(s);
    expect(lowerCased).toBe(
      '¿qué mote crees que le pega más a keiko tanaka, de 25 años?',
    );
  });

  it('should upper case Spanish strings', () => {
    const s = '"¿Cómo viniste?" "A pie."';
    const upperCased = lm.toUpperCase(s);
    expect(upperCased).toBe('"¿CÓMO VINISTE?" "A PIE."');
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
