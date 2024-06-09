import { describe, expect, it } from '@jest/globals';

import { createRequest, createResponse } from 'node-mocks-http';

import SentenceList from '../../../sentence-list';
import Course from '../../../course';
import { UserProfile } from '../../../user-profile';
import { getCourses } from '../../../api/courses';

describe('GET courses', async () => {
  const alice = await UserProfile.create({
    userId: 'abc',
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
