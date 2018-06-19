// THIS IS THE MONGODB NATIVE CONNECTION CAN DELETE LATER

import env from './env';
import log from '../utils/logger';

const MC = require('mongodb').MongoClient;

const state = {
  db: null,
};

const connect = async (url) => {
  if (state.db) {
    return state.db;
  }

  try {
    const db = await MC.connect(url);
    state.db = db;
    log.debug(db);
    return db;
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }
};

const get = () => state.db;

const collection = name => get().collection(name);

const close = async () => {
  try {
    if (state.db) {
      await state.db.close();
      state.db = null;
      state.mode = null;
    }
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }

  return null;
};

export default {
  close,
  collection,
  connect,
  get,
};
