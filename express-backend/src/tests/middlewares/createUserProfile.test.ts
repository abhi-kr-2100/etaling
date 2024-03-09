import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { jest } from '@jest/globals';

import { createRequest, createResponse } from 'node-mocks-http';
import { NextFunction, Request, Response } from 'express';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { UserProfile } from '../../user-profile';
import createUserProfile from '../../middlewares/createUserProfile';

describe('create user profile middleware', () => {
  let mongoDB: MongoMemoryServer;
  let req: Request, resp: Response, next: NextFunction;

  beforeEach(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    req = createRequest({
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
    });
    resp = createResponse();
    next = jest.fn();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  it('should create a user profile on first login', async () => {
    await createUserProfile(req, resp, next);

    const user = await UserProfile.findOne();
    expect(user).not.toBeNull();
    expect(user?.userId).toBe(req.auth.payload.sub);
  });

  it('should not create a user profile if one already exists', async () => {
    const user = await UserProfile.create({ userId: req.auth.payload.sub });

    await createUserProfile(req, resp, next);
    const allUsers = await UserProfile.find();
    expect(allUsers.length).toBe(1);
    expect(allUsers[0].id).toBe(user.id);
  });

  it("should not create a user profile if request doesn't contain auth", async () => {
    const req = createRequest({
      method: 'GET',
    });

    await createUserProfile(req, resp, next);
    const users = await UserProfile.find();

    expect(users.length).toBe(0);
  });
});
