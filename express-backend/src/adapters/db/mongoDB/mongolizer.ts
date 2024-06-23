import { ObjectId, type Document, type Filter } from 'mongodb';

import { ObjectHelpers } from '../../../ports/db/types';
import { InvalidFilterError } from '../../../ports/db/exceptions';
import { type ValueType, type BaseFilter } from '../../../ports/db/types';

import type { MongoValueType } from './types';

export default class Mongolizer {
  private static isObjectIDKey(key: string) {
    return key.endsWith('.id') || key === 'id';
  }

  private static getMongolizedKey(key: string) {
    return Mongolizer.isObjectIDKey(key)
      ? key.slice(0, key.length - 2) + '_id'
      : key;
  }

  private static getMongolizedValue(value: ValueType): MongoValueType {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return value;
    }

    if (value instanceof Array) {
      return value.map(this.getMongolizedValue);
    }

    if (ObjectHelpers.isObjectID(value)) {
      return new ObjectId(value._id);
    }

    if (ObjectHelpers.isObjectDate(value)) {
      return new Date(value._date);
    }

    return Mongolizer.getMongolizedObject(value);
  }

  private static getMongolizedEntries(obj: object) {
    return Object.entries(obj).map(([key, value]) => [
      Mongolizer.getMongolizedKey(key),
      Mongolizer.getMongolizedValue(value),
    ]);
  }

  static getMongolizedObject(obj: object): Document {
    const mongolizedEntries = Mongolizer.getMongolizedEntries(obj);
    return Object.fromEntries(mongolizedEntries);
  }

  static getMongolizedFilter(filter: BaseFilter): Filter<{}> {
    const { $and, $or, ...rest } = filter;
    if ($and?.length === 0 || $or?.length === 0) {
      throw new InvalidFilterError("$and/$or can't be empty arrays.");
    }

    const mongolizedFilter = {
      ...Mongolizer.getMongolizedObject(rest),
      ...($and !== undefined
        ? { $and: $and.map((cond) => Mongolizer.getMongolizedFilter(cond)) }
        : {}),
      ...($or !== undefined
        ? { $or: $or.map((cond) => Mongolizer.getMongolizedFilter(cond)) }
        : {}),
    };

    return mongolizedFilter;
  }
}
