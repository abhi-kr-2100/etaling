import 'dotenv/config';

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { jest } from '@jest/globals';

import { createRequest, createResponse } from 'node-mocks-http';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { UserProfile } from '../../user-profile';
import jwtCheck from '../../middlewares/jwt-check';
import createUserProfile from '../../middlewares/createUserProfile';
import { NextFunction, Request, Response } from 'express';

describe('create user profile middleware', () => {
  const mockJWTToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFUNTF4TjRZRGhIRU11WkRmRW9WRyJ9.eyJpc3MiOiJodHRwczovL2Rldi16bjQ3Z3E0b2ZyN2tuNTBxLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMzY3MTk1MjcyNzA0NTYwMDg3MyIsImF1ZCI6WyJodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpIiwiaHR0cHM6Ly9kZXYtem40N2dxNG9mcjdrbjUwcS51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzA5ODM1NTQwLCJleHAiOjE3MDk5MjE5NDAsImF6cCI6IkhyM1R1U0tjOGgycmtZMHN4R0FmWFRiQVFrRU9ERmE1Iiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.h0KJf4xLHGh5Dpza2xETbe_NkYqfOw2TYeAizs4Vf76Eh95JAfsmydzqL2Vxe_U_lIhYakwcLZBgUcdApk_5FE415DT5IshbBeRJzfgcby_Jujx8CHXJtaIvIya9wNuxn9iAQnu88zbfcG7l-84zc9ISOaVtETN-BB0Rst-Qmlx4-vzmYFdlDJ7KI6HJkIjsIdZCBR4gNT6rjlxx4tvK1ktfDbRaPwt4HSiYjgNfdTznqVKEgXE5FyF-s2uxePL8GYLlThEPBYNwvZuWEtksGwfjtBKq0rJnFZlkKV9ZW4m-biSquLtk3Re4beqRuQW8Go7CEzRu2xb1vNV0IaM8OA';

  let mongoDB: MongoMemoryServer;

  let req: Request, resp: Response, next: NextFunction;

  beforeEach(async () => {
    mongoDB = await MongoMemoryServer.create();
    const uri = mongoDB.getUri();
    await mongoose.connect(uri);

    req = createRequest({
      method: 'GET',
      url: '/api',
      headers: {
        authorization: `Bearer ${mockJWTToken}`,
      },
    });
    resp = createResponse();
    next = jest.fn();
    jwtCheck(req, resp, next);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoDB.stop();
  });

  it('should create a user profile on first login', async () => {
    await createUserProfile(req, resp, next);

    const user = await UserProfile.findOne();
    expect(user).not.toBeNull();
    expect(user?.userId).toBe(req.auth?.payload.sub);
  });

  it('should not create a user profile if one already exists', async () => {
    const user = await UserProfile.create({ userId: req.auth?.payload.sub });

    await createUserProfile(req, resp, next);
    const allUsers = await UserProfile.find();
    expect(allUsers.length).toBe(1);
    expect(allUsers[0].id).toBe(user.id);
  });
});
