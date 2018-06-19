/* eslint import/first:0, eslint-disable, eslint global-require:0, no-shadow:0 */
import _ from 'lodash';
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csurf'; // https://github.com/expressjs/csurf
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import responseTime from 'response-time';
import methodOverride from 'method-override';

import log from './utils/logger';
import c from './config/consts';
import mongo from './config/mongoose';
import redisClient from './config/redisClient';
import env from './config/env';
import controllers from './controllers';

require('dotenv-safe').config();

// global variables for this file:
let httpServer = null;
const app = express();

// startup services: http server, mongoose, redis, etc.
const startup = async (overridePort) => {
  try {
    const port = overridePort || app.get(c.PORT);
    // connect to redis client.
    if (env.redisEnabled) {
      await redisClient.connect();
      log.debug('Connected to Redis client.');
    }

    // connect to mongo through mongoose.
    mongo.setDebug(env.debug);
    await mongo.connect();

    // create http server wrapper around express app.
    httpServer = http.createServer(app);
    httpServer.listen(port);

    log.debug('%s listening at http://%s:%d', env.server, env.host, port);
    log.debug(`Mode: ${env.server}`);
  } catch (e) {
    log.error('Error: ', e.stack);
  }

  return httpServer;
};

// gracefully shutdown services: http server, redis, mongoose, etc.
const shutdown = async (canExit = true) => {
  log.debug(`app '${env.appName}' terminating.`);
  log.debug('closing server...');

  try {
    await httpServer.close();
    log.debug('express server close.');

    if (env.redisEnabled) {
      redisClient.getClient().on('end', (e) => {
        log.debug('redis client ended.', e);
      });
      redisClient.quit();

      log.debug('redis client disconnected.');
    }

    await mongoose.connection.close();
    log.debug('Mongoose default connection disconnected.');

    // imperative to remove all event listeners.
    mongoose.connection.removeAllListeners();
  } catch (e) {
    log.debug('Uncaught Shutdown Error:', e.stack);
  }

  log.debug('Finally exiting.');
  if (canExit) {
    process.exit(1);
  }

  return null;
};


app.use(helmet());

app.disable('x-powered-by');


app.use(responseTime());
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding'],
}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  bodyParser.json({
    verify(req, res, buf, encoding) {
      req.rawBody = buf.toString();
    },
  })(req, res, (err) => {
    if (err) {
      const msg = err.message.indexOf('JSON') !== -1 ? err.message : 'internal error';
      res.status(500).send({
        error: {
          status: 500,
          msg,
        },
      });

      log.error(c.ERROR, {
        status: err.status || 500,
        message: err.msg,
        error: err,
      });
    } else {
      next();
    }
  });
});

app.use(cookieParser());

app.set('trust proxy', true);
app.set(c.PORT, env.port);

// TODO: need to review best practice for morgan and fix loger.stream console issue.
if (env.debug && env.debugExpress) {
  log.debug("Overriding 'Express' logger");
  app.use(morgan('combined', { stream: log.stream }));
}

app.use(controllers);

module.exports = {
  app,
  httpServer,
  startup,
  shutdown,
  redisClient,
};
