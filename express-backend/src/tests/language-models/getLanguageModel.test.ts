import { describe, it, expect } from '@jest/globals';
import { getLanguageModel } from '../../language-models';
import { LanguageCode } from '../../../../shared/languages';

describe('getLanguageModel', () => {
  it('should return the English language model', () => {
    const lm = getLanguageModel('en');
    expect(lm.getLanguage()).toBe('en');
  });

  it('should return the Spanish language model', () => {
    const lm = getLanguageModel('es');
    expect(lm.getLanguage()).toBe('es');
  });

  it('should return the Turkish language model', () => {
    const lm = getLanguageModel('tr');
    expect(lm.getLanguage()).toBe('tr');
  });

  it('should throw for unknown languages', () => {
    expect(() => getLanguageModel('xyz' as LanguageCode)).toThrow();
  });
});
