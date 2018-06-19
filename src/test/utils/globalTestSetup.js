// this only happens once in jest

import env from '../../config/env';
import log from '../../utils/logger';
import mh from '../utils/mongooseHelper';

module.exports = async () => {
  log.info('');
  log.info('env.environment', env.environment);
  log.info('debug', env.debug);
  log.info('mongo.dbName', env.mongo.dbName);
  log.info('mongo.uri', env.mongo.uri);
  log.info(`redis.host:port: ${env.redis.host}:${env.redis.port}`);

  const db = await mh.createDb();

  console.log('GLOBAL JEST SETUP.');
};


/*
  import c from '../../../src/config/consts';
  import sc from '../../../src/config/statusCodes';
  import mc from './mongooseHelper';
  import d from '../data';
*/
