import { environment, domain } from '../config/env';

// TODO: this needs to be alphabetical to avoid collision);
// TODO: come up with a way to avoid collision and having a constant overwritten);


class c {
  static addProp(prop, value) {
    if (!(prop in c)) {
      Object.defineProperty(c, prop, { value, writable: false });
    } else {
      const msg = `Constant class c already has property '${prop}' assigned`;
      throw new Error(msg);
    }
  }
}

c.addProp('CLEAR_REFRESH_TOKEN', true);
c.addProp('REFRESH_FROM_DB', true); // use the db on an auth check or not.
c.addProp('LEAN', true); // model lean or full mongoose object.

c.addProp('PROD', 'production');
c.addProp('DEV', 'development');
c.addProp('STAGE', 'staging');

c.addProp('TRUE', 'true');
c.addProp('FALSE', 'false');

c.addProp('INDEX', 'index');
c.addProp('UNIQUE', 'unique');
c.addProp('SPARSE', 'sparse');

c.addProp('NESTED', 'NESTED');

c.addProp('PAGE_LIMIT', 1000);
c.addProp('PER_PAGE_LIMIT', 20);
c.addProp('MULTI_PER_PAGE_LIMIT', 10);
c.addProp('ENDPOINT_ENTRY', '/api');
c.addProp('LOG_ENDPOINT_COLLECTION', 'search_log');

c.addProp('SIGINT', 'SIGINT');
c.addProp('SIGTERM', 'SIGTERM');

// useful strings (mongoose events', strings', etc)
c.addProp('EMPTY_STR', '');

c.addProp('OFFLINE', 'offline');
c.addProp('DISABLED', 'disabled');
c.addProp('SOFT_DELETE', 'softDelete');

c.addProp('USERNAME', 'username');
c.addProp('PASSWORD', 'password');
c.addProp('EMAIL', 'email');
c.addProp('ALT_EMAIL', 'altEmail');

c.addProp('OPEN', 'open');
c.addProp('EXIT', 'exit');
c.addProp('CONNECTING', 'connecting');
c.addProp('CONNECTED', 'connected');
c.addProp('DISCONNECTION', 'disconnecting');
c.addProp('DISCONNECTED', 'disconnected');
c.addProp('CLOSE', 'close');
c.addProp('RECONNECT', 'reconnected');
c.addProp('ERROR', 'error');
c.addProp('FULLSETUP', 'fullsetup');
c.addProp('ALL', 'all');

c.addProp('BEARER_AUTH_PREFIX', 'Bearer ');
c.addProp('AUTH_TOKEN', 'authToken');
c.addProp('REFRESH_TOKEN', 'refreshToken');
c.addProp('AUTH', 'auth');
c.addProp('REFRESH', 'refresh');

c.addProp('FAKE_TOKEN', 'fake-token');

c.addProp('TYPE', 'type');
c.addProp('DATA', 'data');

c.addProp('SILLY', 'silly');
c.addProp('DEBUG', 'debug');
c.addProp('INFO', 'info');
c.addProp('VERBOSE', 'verbose');
c.addProp('PORT', 'port');
c.addProp('NODE', 'node');

c.addProp('LOGGER', {
  SILLY: c.SILLY,
  DEBUG: c.DEBUG,
  INFO: c.INFO,
  VERBOSE: c.VERBOSE,
});

c.addProp('NEW_USER', true);
c.addProp('SAVE', 'save');

c.addProp('SALT_WORK_FACTOR', 12);
c.addProp('MAX_LOGIN_ATTEMPTS', 4);
c.addProp('LAST_LOGIN_CHECK_TIME', 60 * 30); // increment time if within this time.
c.addProp('LOCK_TIME', 60 * 30); // lock for an hour.

c.addProp('BOOLEAN', 'boolean');
c.addProp('OBJECT', 'object');
c.addProp('STRING', 'string');
c.addProp('FUNCTION', 'function');
c.addProp('NUMBER', 'number');
c.addProp('UNDEFINED', 'undefined');

c.addProp('INSERT', 'insert');
c.addProp('UPDATE', 'update');
c.addProp('DELETE', 'delete');

c.addProp('DEFAULT', 'default');
c.addProp('DESKTOP', 'desktop');
c.addProp('WINDOWS', 'Windows');
c.addProp('MAC', 'Mac');
c.addProp('LINUX', 'Linux');
c.addProp('IPHONE', 'iPhone');
c.addProp('IPAD', 'iPad');
c.addProp('ANDROID_PHONE', 'Android Phone');
c.addProp('ANDROID_TABLET', 'Android Tablet');

c.addProp('DEFAULT_AUTH_PAYLOAD', {
  sub: null,
  iat: null,
  exp: null,
  jti: null,
  aud: domain, // localhost or diff servers
  env: environment, // dev, stage, productions
  type: c.AUTH,
  accountId: null,
  deviceId: null,
  ip: null,
  userAgent: null,
  data: {
    username: null,
    email: null,
    firstName: null,
    lastName: null,
    displayName: null,
    rememberLoggedIn: null,
    agreementVersion: null,
  },
});

c.addProp('DEFAULT_REFRESH_PAYLOAD', {
  sub: null,
  iat: null,
  exp: null,
  jti: null,
  aud: domain, // localhost or diff servers
  env: environment, // dev, stage, production
  type: c.REFRESH,
  accountId: null,
  deviceId: null,
  ip: null,
  userAgent: null,
});

// model property types.
c.addProp('SETTINGS_TYPE', 0);
c.addProp('OBJECT_TYPE', 1);
// c.addProp('', 0);

c.addProp('MAX_USER_CONTACTS', 4);
c.addProp('MAX_USER_PROFILES', 5);

Object.freeze(c);

export default c;
