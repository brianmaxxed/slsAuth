import env from '../../../src/config/env';

const mongoose = require('../../../src/config/mongoose');

const mongoUri = env.mongo.uri;
const dbName = `${env.mongo.dbName}${env.unitTestDbSuffix}`;

let connection;

function connect() {
  return mongoose.connect(mongoUri, dbName);
}

export default {
  mongoose,
  connect,
  connection,
  mongoUri,
  dbName,
};
