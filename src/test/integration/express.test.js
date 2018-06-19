/* eslint import/no-extraneous-dependencies:0, no-unused-expressions:0  */
import express from 'express';
import request from 'supertest';
import portfinder from 'portfinder';

import server from '../../../src/express';
import c from '../../../src/config/consts';
import sc from '../../../src/config/statusCodes';
import { processResults } from '../../../src/utils/helper';

describe('User Routes', () => {
  describe('login', () => {
    test('logs in', async () => {
      // create a verified user, then check if can login.
      await request(server.app)
        .get('/login')
        .expect('Content-Type', /json/)
        // .expect('Content-Length', '15')
        .expect(404);
    });
  });

  beforeAll(async () => {
    const port = await portfinder.getPortPromise();
    console.log('port:', port);
    await server.startup(port);
  });

  afterAll(async () => {
    await server.shutdown(false);
  });
});
