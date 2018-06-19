import mongoose from 'mongoose';

import Models from '../models/Models';
import log from '../utils/logger';
import env from './env';
import c from '../config/consts';
import h from '../utils/helper';

const state = {
  db: null,
  test: false,
};

const get = () => state.db;

const setAsTest = () => {
  state.test = true;
};

const createIndexes = async () => {
  try {
    const models = Models.all;
    await h.asyncForEach(Object.keys(models), async (model) => {
      if (models[model] && models[model].Model) {
        if (models[model].Model.collection) {
          await models[model].Model.collection.getIndexes();
          await models[model].Model.collection.dropIndexes();
        }
        await models[model].Model.createIndexes();
      }
    });
  } catch (e) {
    log.error(e);
    return h.unhandledErrorObject(e);
  }
};


// print mongoose logs in dev env
const setDebug = (debug) => {
  if (env.debugDb) {
    // TODO make this an environment variable.
    mongoose.connection.removeAllListeners();
    mongoose.set(c.DEBUG, true);
    if (env.debug) {
      log.debug(`starting in debug mode; env=${env.environment}`);
    }[
      c.CONNECTING,
      c.CONNECTED,
      c.OPEN,
      c.DISCONNECTING,
      c.DISCONNECTED,
      c.CLOSE,
      c.RECONNECTED,
      c.ERROR,
      // c.FULLSETUP,
      c.ALL,
      c.INDEX,
    ].forEach((event) => {
      mongoose.connection.on(event, () => {
        log.debug(`Mongoose event ${event}`);
      });
    });
  }
};

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */
const connect = async (uri, db) => {
  const mongoUri = uri || `${env.mongo.uri}`;
  const dbName = db || `${env.mongo.dbName}`;

  const opts = {
    dbName: dbName || env.mongo.dbName,
    reconnectTries: 5,
    reconnectInterval: 500, // Reconnect every 500ms
    keepAlive: true,
    config: {
      autoIndex: false,
      background: false,
    },
  };

  if (env.debug) {
    log.debug(`mongo Uri: ${mongoUri}`);
    log.debug(`mongo Db: ${dbName}`);
  }

  try {
    const conn = await mongoose.connect(mongoUri, opts);
    state.db = conn;
    // log.debug(state.db.model(models.blacklist, BlacklistSchema));
    return state.db;
  } catch (e) {
    log.error('Error: ', e.stack);
    return null;
  }
};

export default {
  get,
  setAsTest,
  setDebug,
  connect,
  createIndexes,
};
