import type { ObjectId } from 'mongodb';

export type MongoValueType =
  | string
  | number
  | object
  | Array<MongoValueType>
  | boolean
  | null
  | ObjectId;
