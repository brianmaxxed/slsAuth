import path from 'path';

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

const env = {
  user: process.env.USER,
  appName: process.env.APP_NAME,
  serverless: process.env.SERVERLESS,
  redisEnabled: process.env.REDIS_ENABLED === 'true',
  debug: process.env.DEBUG === 'true',
  debugLevel: process.env.DEBUG_LEVEL,
  debugDb: process.env.DEBUG_DB === 'true',
  debugExpress: process.env.DEBUG_EXPRESS === 'true',
  debugUnitTests: process.env.DEBUG_UNIT_TESTS === 'true',
  stackTraceUnhandledErrors: process.env.STACKTRACE_UNHANDLED_ERRORS === 'true',
  unitTestDbSuffix: `${process.env.UNIT_TEST_DB_SUFFIX}_${process.env.USER}`,
  logDir: process.env.LOG_DIR,
  enableDevFileLogging: process.env.ENABLE_DEV_FILE_LOGGING === 'true',
  server: process.env.SERVER,
  host: process.env.HOST,
  domain: process.env.DOMAIN,
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  serverSecret: process.env.SERVER_SECRET,
  serverSaltSuffix: process.env.SERVER_SALT_SUFFIX,
  saltRounds: process.env.SALT_ROUNDS,
  jwtAuthSecret: process.env.JWT_AUTH_SECRET, // move to redis/mongo
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET, // move to redis/mongo
  jwtAuthTokenTtl: process.env.JWT_AUTH_TOKEN_TTL,
  jwtRefreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL,
  passport: {
    facebookId: process.env.FACEBOOK_APP_ID,
    facebookSecret: process.env.FACEBOOK_APP_SECRET,
    githubId: process.env.GITHUB_APP_ID,
    githubSecret: process.env.GITHUB_APP_SECRET,
    linkedinId: process.env.LINKEDIN_APP_ID,
    linkedinSecret: process.env.LINKEDIN_APP_SECRET,
  },
  mongo: {
    dbName: null,
    uri: null,
  },
  redis: {
    keyTtl: process.env.REDIS_KEY_TTL,
    host: null,
    port: null,
    password: null,
  },
  PACK_REDIS_KEY: process.env.PACK_REDIS_KEY === 'true',
  PACK_REDIS_VAL: process.env.PACK_REDIS_VAL === 'true',
  mail: {
    awsSesUser: process.env.AWS_SES_USER,
    awsSesKey: process.env.AWS_SES_KEY,
    awsSesPass: process.env.AWS_SES_PASSWORD,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};

const environment = process.env.NODE_ENV.toLowerCase() === 'test'
  ? process.env.TEST_ENV : process.env.NODE_ENV;

if (environment === 'production') {
  // mongodb
  env.mongo.dbName = process.env.MONGO_PROD_DB;
  env.mongo.uri = process.env.MONGO_PROD_URI;
  // redis
  env.redis.host = process.env.REDIS_PROD_HOST;
  env.redis.port = process.env.REDIS_PROD_PORT;
  env.redis.password = process.env.REDIS_PROD_PASS;
} else if (environment === 'stage') {
  env.mongo.dbName = process.env.MONGO_STAGE_DB;
  env.mongo.uri = process.env.MONGO_STAGE_URI;
  // redis
  env.redis.host = process.env.REDIS_STAGE_HOST;
  env.redis.port = process.env.REDIS_STAGE_PORT;
  env.redis.password = process.env.REDIS_STAGE_PASS;
} else {
  env.mongo.dbName = process.env.MONGO_DEV_DB;
  env.mongo.uri = process.env.MONGO_DEV_URI;
  // redis
  env.redis.host = process.env.REDIS_DEV_HOST;
  env.redis.port = process.env.REDIS_DEV_PORT;
  env.redis.password = process.env.REDIS_DEV_PASS;
}

export default env;
