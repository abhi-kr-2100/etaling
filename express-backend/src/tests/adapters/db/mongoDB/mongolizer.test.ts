import { describe, it, expect } from '@jest/globals';
import { ObjectId } from 'mongodb';

import type { BaseFilter } from '../../../../ports/db/types';

import Mongolizer from '../../../../adapters/db/mongoDB/mongolizer';

describe('Mongolizer', () => {
  describe('getMongolizedObject', () => {
    const baseObj = {
      key: 'value',
      number: 42,
      isBoolean: true,
      missingValue: null,
    };

    it('should not convert string, number, boolean, and null', () => {
      const sourceObject = {
        ...baseObj,
      };

      const mongolized = Mongolizer.getMongolizedObject(sourceObject);
      expect(mongolized).toStrictEqual(sourceObject);
    });

    it('should convert string IDs to ObjectIds', () => {
      const sourceObject = {
        ...baseObj,
        id: { _id: '6592008029c8c3e4dc76256c' },
      };

      const expected = {
        ...baseObj,
        _id: new ObjectId(sourceObject.id._id),
      };

      const mongolized = Mongolizer.getMongolizedObject(sourceObject);
      expect(mongolized).toStrictEqual(expected);
    });

    it('should convert string Dates to Dates', () => {
      const today = new Date();

      const sourceObject = {
        ...baseObj,
        lastReviewDate: { _date: today.toISOString() },
      };

      const expected = {
        ...baseObj,
        lastReviewDate: today,
      };

      const result = Mongolizer.getMongolizedObject(sourceObject);
      expect(result).toStrictEqual(expected);
    });

    it('should convert the elements of an array as appropriate', () => {
      const now = new Date();

      const sourceObject = {
        ...baseObj,
        values: [
          1,
          'titanic',
          false,
          null,
          true,
          { _id: '507f191e810c19729de860ea' },
          { _date: now.toISOString() },
        ],
      };

      const expected = {
        ...baseObj,
        values: [
          1,
          'titanic',
          false,
          null,
          true,
          new ObjectId('507f191e810c19729de860ea'),
          now,
        ],
      };

      const result = Mongolizer.getMongolizedObject(sourceObject);
      expect(result).toStrictEqual(expected);
    });

    it('should convert subobjects recursively', () => {
      const today = new Date();

      const sourceObject = {
        ...baseObj,
        id: { _id: '507f191e810c19729de860ea' },
        metadata: {
          id: { _id: '6592008029c8c3e4dc76256c' },
          createdAt: { _date: today.toISOString() },
          updatedAt: { _date: today.toISOString() },
          viewedBy: [
            { _id: '507f191e810c10810ed951ab' },
            { _id: '6592008029c8c3e4dc76256d' },
          ],
        },
      };

      const expected = {
        ...baseObj,
        _id: new ObjectId('507f191e810c19729de860ea'),
        metadata: {
          _id: new ObjectId('6592008029c8c3e4dc76256c'),
          createdAt: today,
          updatedAt: today,
          viewedBy: [
            new ObjectId('507f191e810c10810ed951ab'),
            new ObjectId('6592008029c8c3e4dc76256d'),
          ],
        },
      };

      const result = Mongolizer.getMongolizedObject(sourceObject);
      expect(result).toStrictEqual(expected);
    });
  });

  describe('getMongolizedFilter', () => {
    const baseFilter = {
      str: 'my string',
      favoriteNum: 10,
      isTrue: false,
      missing: null,
    } as BaseFilter;

    it('should not convert string, number, boolean, and null', () => {
      const objectFilter = {
        ...baseFilter,
      } as BaseFilter;

      const result = Mongolizer.getMongolizedFilter(objectFilter);
      expect(result).toStrictEqual(objectFilter);
    });

    it('should convert IDs to ObjectIds', () => {
      const objectFilter = {
        ...baseFilter,
        id: { _id: '6592008029c8c3e4dc76256d' },
      };

      const expectedFilter = {
        ...baseFilter,
        _id: new ObjectId(objectFilter.id._id),
      };

      const result = Mongolizer.getMongolizedFilter(objectFilter);
      expect(result).toStrictEqual(expectedFilter);
    });

    it('should convert string Dates to Dates', () => {
      const today = new Date();

      const objectFilter = {
        ...baseFilter,
        lastReviewDate: { _date: today.toISOString() },
      };

      const expected = {
        ...baseFilter,
        lastReviewDate: today,
      };

      const result = Mongolizer.getMongolizedFilter(objectFilter);
      expect(result).toStrictEqual(expected);
    });

    it('should convert the elements of an array as appropriate', () => {
      const now = new Date();

      const objectFilter = {
        ...baseFilter,
        values: [
          1,
          'titanic',
          false,
          null,
          true,
          { _id: '507f191e810c19729de860ea' },
          { _date: now.toISOString() },
        ],
      };

      const expected = {
        ...baseFilter,
        values: [
          1,
          'titanic',
          false,
          null,
          true,
          new ObjectId('507f191e810c19729de860ea'),
          now,
        ],
      };

      const result = Mongolizer.getMongolizedFilter(objectFilter);
      expect(result).toStrictEqual(expected);
    });

    it('should convert subobjects recursively', () => {
      const today = new Date();

      const sourceObject = {
        ...baseFilter,
        id: { _id: '507f191e810c19729de860ea' },
        metadata: {
          id: { _id: '6592008029c8c3e4dc76256c' },
          createdAt: { _date: today.toISOString() },
          updatedAt: { _date: today.toISOString() },
          viewedBy: [
            { _id: '507f191e810c10810ed951ab' },
            { _id: '6592008029c8c3e4dc76256d' },
          ],
        },
      };

      const expected = {
        ...baseFilter,
        _id: new ObjectId('507f191e810c19729de860ea'),
        metadata: {
          _id: new ObjectId('6592008029c8c3e4dc76256c'),
          createdAt: today,
          updatedAt: today,
          viewedBy: [
            new ObjectId('507f191e810c10810ed951ab'),
            new ObjectId('6592008029c8c3e4dc76256d'),
          ],
        },
      };

      const result = Mongolizer.getMongolizedFilter(sourceObject);
      expect(result).toStrictEqual(expected);
    });

    it('should throw an error on empty AND/OR', () => {
      const objectFilter = {
        ...baseFilter,
        $and: [],
      } as BaseFilter;

      expect(() => Mongolizer.getMongolizedFilter(objectFilter)).toThrow();
    });

    it("should convert object $and/$or to MongoDB's $and/$or", () => {
      const today = new Date();

      const objectFilter = {
        ...baseFilter,
        $or: [
          { id: { _id: '6592008029c8c3e4dc76256d' } },
          { createdAt: { _date: today.toISOString() } },
        ],
      };

      const expectedFilter = {
        ...baseFilter,
        $or: [
          { _id: new ObjectId(objectFilter.$or[0].id?._id) },
          { createdAt: today },
        ],
      };

      const result = Mongolizer.getMongolizedFilter(objectFilter);
      expect(result).toStrictEqual(expectedFilter);
    });
  });
});
