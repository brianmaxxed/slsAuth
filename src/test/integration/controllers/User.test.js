/* eslint import/no-extraneous-dependencies:0, no-unused-expressions:0  */
import express from 'express';
import request from 'supertest';
import portfinder from 'portfinder';

import server from '../../../../src/express';
import c from '../../../../src/config/consts';
import sc from '../../../../src/config/statusCodes';
import { processResults } from '../../../../src/utils/helper';

let httpServer;

describe('User Routes', () => {
  describe('unassigned routes', () => {
    test('expects a 404 status for an unassigned get route', async () => {
      await request(server.app)
        .get('/login')
        .expect('Content-Type', /json/)
        // .expect('Content-Length', '15')
        .expect(404);

      await request(server.app)
        .get('/signup')
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
