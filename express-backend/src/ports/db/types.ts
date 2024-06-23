export interface BaseFilter {
  $and?: BaseFilter[];
  $or?: BaseFilter[];
  [key: string]: any;
}

/**
 * Etaling uses a custom data format called Object which is a subset of
 * JSON. Object is a JS object where the values are of type ValueType.
 *
 * ValueType is usually a JS primitive, an Array, or an object. However,
 * it can also be a `Special Object Type`. SOTs are used to represent
 * richer concepts such as IDs and dates. ObjectID and ObjectDate below
 * are SOTs.
 */
export type ObjectID = { _id: string };
export type ObjectDate = { _date: string };
export type ValueType =
  | string
  | number
  | object
  | Array<ValueType>
  | boolean
  | null
  | ObjectID
  | ObjectDate;

export class ObjectHelpers {
  private static isSpecialObjectType(value: object, type: string) {
    const entries = Object.entries(value);
    if (entries.length !== 1) {
      return false;
    }

    return entries[0][0] === type;
  }

  static isObjectID(value: object): value is ObjectID {
    return ObjectHelpers.isSpecialObjectType(value, '_id');
  }

  static isObjectDate(value: object): value is ObjectDate {
    return ObjectHelpers.isSpecialObjectType(value, '_date');
  }
}
