import type { BaseFilter } from './types';

export default interface DBPort {
  getSentenceLists(filters?: BaseFilter): Promise<unknown[]>;
  addSentenceLists(objects: unknown[]): Promise<unknown[]>;
  updateSentenceList(id: string, updatedObject: unknown): Promise<unknown>;

  getSentences(filters?: BaseFilter): Promise<unknown[]>;
  addSentences(objects: unknown[]): Promise<unknown[]>;
  updateSentence(id: string, updatedObject: unknown): Promise<unknown>;

  getSentenceScores(filters?: BaseFilter): Promise<unknown[]>;
  addSentenceScores(objects: unknown[]): Promise<unknown[]>;
  updateSentenceScore(id: string, updatedObject: unknown): Promise<unknown>;

  getWords(filters?: BaseFilter): Promise<unknown[]>;
  addWords(objects: unknown[]): Promise<unknown[]>;
  updateWord(id: string, updatedObject: unknown): Promise<unknown>;

  getWordScores(filters?: BaseFilter): Promise<unknown[]>;
  addWordScores(objects: unknown[]): Promise<unknown[]>;
  updateWordScore(id: string, updatedObject: unknown): Promise<unknown>;

  getUserProfiles(filters?: BaseFilter): Promise<unknown[]>;
  addUserProfiles(objects: unknown[]): Promise<unknown[]>;
  updateUserProfile(id: string, updatedObject: unknown): Promise<unknown>;
}
