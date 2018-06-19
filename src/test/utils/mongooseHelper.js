/* eslint no-shadow: 0, no-unused-expressions: 0 */
import mongoose from 'mongoose';

import env from '../../../src/config/env';
import mc from '../../../src/config/mongoose';
import log from '../../../src/utils/logger';
import c from '../../../src/config/consts';
import Models from '../../../src/models/Models';
import h from '../../../src/utils/helper';

const mongoUri = env.mongo.uri;
const dbName = `${env.mongo.dbName}${env.unitTestDbSuffix}`;

const clearAllCollections = async () => {
  const models = Models.all;
  await h.asyncForEach(Object.keys(models), async (model) => {
    await models[model].Model.remove();
  });
};

const clearCollections = async (collections = []) => {
  try {
    const models = Models.all;
    const keys = Object.keys(models);

    await h.asyncForEach(collections, async (model) => {
      if (keys.includes(model)) {
        await models[model].Model.remove();
      }
    });
  } catch (e) {
    log.error(e.stack);
  }
};

const open = (cleanDb = false) => {
  mc.setAsTest();
  mc.setDebug(env.debug, cleanDb);

  return new Promise((resolve, reject) => {
    mongoose.connection.once(c.OPEN, async () => {
      try {
        if (cleanDb) {
          // log.silly('clear collections:');
          // await clearCollections();
          // log.silly('collections cleared.');
          log.silly('creating indexes:');
          await mc.createIndexes();
          log.silly('creating indexes done.');
        }
        log.debug('mongoose connection opened');
        resolve();
      } catch (e) {
        log.error(e.stack);
      }
    });

    try {
      mc.connect(mongoUri, dbName);
      log.debug('Mongoose connecting...');
    } catch (e) {
      log.error(e.stack);
      reject(e);
    }
  });
};

const connect = () => {
  mc.setAsTest();

  return new Promise((resolve, reject) => {
    mongoose.connection.once(c.OPEN, async () => {
      try {
        log.debug('mongoose connection opened');
        resolve();
      } catch (e) {
        log.error(e.stack);
      }
    });

    try {
      mc.connect(mongoUri, dbName);
      log.debug('Mongoose connecting...');
    } catch (e) {
      log.error(e.stack);
      reject(e);
    }
  });
};

const createDb = async () => {
  try {
    const cleanDb = true;
    await open(cleanDb);
  } catch (e) {
    log.error(e.stack);
  }
};

const dropDb = async () => {
  const conn = await mc.connect(mongoUri, dbName);
  await mongoose.connection.db.dropDatabase();
  log.silly('dropped database.');
};

const close = () => new Promise((resolve, reject) => {
  try {
    mongoose.connection.on(c.CLOSE, async () => {
      log.debug('mongoose closed.');
      mongoose.connection.removeAllListeners();
      resolve();
    });

    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connection.close();
  } catch (e) {
    reject(e);
  }
});

const checkModelError = async (type = 'save', message, m1, m2) => {
  let errMsg;

  try {
    if (type === c.SAVE) {
      await m1.save();
      if (m2) {
        await m2.save();
      }
    } else {
      await m1.validate();
      if (m2) {
        await m2.validate();
      }
    }
  } catch (err) {
    errMsg = (err.errmsg) ? err.errmsg : err.message;
  }

  expect(errMsg).toMatch(new RegExp(message));
};

const checkModelSaveError = async (message, ...models) => {
  const errMsg = await checkModelError('save', message, ...models);
  return errMsg;
};

const checkModelValidateError = async (message, ...models) => {
  const errMsg = await checkModelError('validate', message, ...models);
  expect(errMsg).toEqual(undefined);
};

const checkUpdatedDocProperty = async (user, model, prop) => {
  let errMsg;
  let doc = {};
  const props = {};
  let value;

  try {
    props[prop] = true;
    await model.findByIdAndUpdate(user._id, props);
    // await model.update({ _id: user._id,})

    props[prop] = 1;
    doc = await model.findOne({ _id: user._id }, props);
    value = doc[prop];

    props[prop] = true;
    props._id = user._id;
  } catch (err) {
    errMsg = (err.errmsg) ? err.errmsg : err.message;
  }

  expect(errMsg).toBeUndefined();
  expect(value).toEqual(true);
};


export default {
  createDb,
  dropDb,
  open,
  connect,
  clearCollections,
  close,
  checkModelSaveError,
  checkModelValidateError,
  checkUpdatedDocProperty,
};
