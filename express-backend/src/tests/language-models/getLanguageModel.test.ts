import { describe, it, expect } from '@jest/globals';
import { getLanguageModel } from '../../language-models';
import { LanguageCode } from '../../../../shared/languages';

describe('getLanguageModel', () => {
  it('should return the English language model', () => {
    const lm = getLanguageModel('en');
    expect(lm.getLanguage()).toBe('en');
  });

  it('should throw for unknown languages', () => {
    expect(() => getLanguageModel('xyz' as LanguageCode)).toThrow();
  });
});
