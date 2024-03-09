import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import { jest } from '@jest/globals';

import { RequestOptions, createRequest, createResponse } from 'node-mocks-http';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import SentenceList from '../../sentence-list';
import createUserProfile from '../../middlewares/createUserProfile';
import { getSentenceLists } from '../../api/sentenceLists';
import { UserProfile } from '../../user-profile';

describe('GET sentence list', () => {
  let mongoDB: MongoMemoryServer;

  const aliceReqOpts = {
    method: 'GET',
    url: '/api',
    auth: {
      payload: {
        iss: 'https://dev-zn47gq4ofr7kn50q.us.auth0.com/',
        sub: 'google-oauth2|113671952727045600873',
        iat: 1709835540,
        exp: 1709921940,
        azp: 'Hr3TuSKc8h2rkY0sxGAfXTbAQkEODFa5',
        scope: 'openid profile email',
      },
    },
  } as RequestOptions;

  const bobReqOpts = {
    method: 'GET',
    url: '/api',
    auth: {
      payload: {
        iss: 'https://dev-zn47gq4ofr7kn50q.us.auth0.com/',
        sub: 'google-oauth2|113671952727045647800',
        iat: 1709835540,
        exp: 1709921940,
        azp: 'Hr3TuSKc8h2rkY0sxGAfXTbAQkEODFa5',
        scope: 'openid profile email',
      },
    },
  } as RequestOptions;

  beforeAll(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    const aliceReq = createRequest(aliceReqOpts);
    const aliceRes = createResponse();
    const aliceNext = jest.fn();
    await createUserProfile(aliceReq, aliceRes, aliceNext);

    const bobReq = createRequest(bobReqOpts);
    const bobRes = createResponse();
    const bobNext = jest.fn();
    await createUserProfile(bobReq, bobRes, bobNext);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  afterEach(async () => {
    await SentenceList.deleteMany();
  });

  it('should return empty array if there are not lists', async () => {
    const req = createRequest(aliceReqOpts);
    const res = createResponse();

    await getSentenceLists(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(0);
  });

  it('should return empty array if all lists are private and not owned by the user', async () => {
    const bob = await UserProfile.findOne({
      userId: bobReqOpts.auth.payload.sub,
    });
    await SentenceList.create({
      title: 'Test List',
      isPublic: false,
      owner: bob,
    });

    const req = createRequest(aliceReqOpts);
    const res = createResponse();

    await getSentenceLists(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(0);
  });

  it("should return publicly available lists even if user doesn't own any list", async () => {
    const bob = await UserProfile.findOne({
      userId: bobReqOpts.auth.payload.sub,
    });
    const list = await SentenceList.create({
      title: 'Test List',
      owner: bob,
    });

    const req = createRequest(aliceReqOpts);
    const res = createResponse();

    await getSentenceLists(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(1);
    expect({
      _id: data[0]._id,
      title: data[0].title,
    }).toEqual({
      _id: list._id.toString(),
      title: list.title,
    });
  });

  it('should return user owned lists only when there are no publicly available lists', async () => {
    const bob = await UserProfile.findOne({
      userId: bobReqOpts.auth.payload.sub,
    });
    await SentenceList.create({
      title: "Bob's Private List",
      isPublic: false,
      owner: bob,
    });

    const alice = await UserProfile.findOne({
      userId: aliceReqOpts.auth.payload.sub,
    });
    const list = await SentenceList.create({
      title: "Alice's List",
      owner: alice,
    });

    const req = createRequest(aliceReqOpts);
    const res = createResponse();

    await getSentenceLists(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(1);
    expect({
      _id: data[0]._id,
      title: data[0].title,
    }).toEqual({
      _id: list._id.toString(),
      title: list.title,
    });
  });

  it('should return user owned lists as well as publicly available lists', async () => {
    const alice = await UserProfile.findOne({
      userId: aliceReqOpts.auth.payload.sub,
    });
    const aList = await SentenceList.create({
      title: "Alice's List",
      isPublic: false,
      owner: alice,
    });

    const bob = await UserProfile.findOne({
      userId: bobReqOpts.auth.payload.sub,
    });
    const bList = await SentenceList.create({
      title: "Bob's Public List",
      owner: bob._id,
    });

    const req = createRequest(aliceReqOpts);
    const res = createResponse();

    await getSentenceLists(req, res);
    const data = res._getJSONData();

    expect(data.length).toBe(2);
    expect(
      data.map((list) => ({
        _id: list._id,
        title: list.title,
      })),
    ).toContainEqual({
      _id: aList._id.toString(),
      title: aList.title,
    });
    expect(
      data.map((list) => ({
        _id: list._id,
        title: list.title,
      })),
    ).toContainEqual({
      _id: bList._id.toString(),
      title: bList.title,
    });
  });
});
