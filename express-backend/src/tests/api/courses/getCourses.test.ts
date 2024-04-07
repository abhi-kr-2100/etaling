import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';

import { createRequest, createResponse } from 'node-mocks-http';

import mongoose, { HydratedDocument } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import SentenceList from '../../../sentence-list';
import { UserProfile, UserProfileType } from '../../../user-profile';
import { getCourses } from '../../../api/courses';
import Course from '../../../course';

describe('GET courses', () => {
  let mongoDB: MongoMemoryServer;
  let alice: HydratedDocument<UserProfileType>;

  beforeAll(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    alice = await UserProfile.create({
      userId: 'abc',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  afterEach(async () => {
    await Promise.all([SentenceList.deleteMany(), Course.deleteMany()]);
  });

  it('should return empty array if there are not courses', async () => {
    const req = createRequest();
    const res = createResponse();

    await getCourses(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(0);
  });

  it('should return all courses along with all lists', async () => {
    const testLists = await SentenceList.insertMany([
      {
        title: 'Korean 1',
        owner: alice,
      },
      {
        title: 'Korean 2',
        owner: alice,
      },
    ]);

    const testCourse = await Course.create({
      title: 'Korean',
      sentenceLists: testLists,
    });

    const req = createRequest();
    const res = createResponse();

    await getCourses(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(1);
    expect(data[0].title).toBe(testCourse.title);
    expect(data[0].sentenceLists.length).toBe(2);
  });
});
