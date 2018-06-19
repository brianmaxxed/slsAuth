import redis from 'async-redis';
import env from './env';
import log from '../utils/logger';
import c from '../config/consts';

const pako = require('pako');

const { host, port, password } = env.redis;

const state = {
  client: null,
};

// print mongoose logs in dev env
const setClientEvents = () => {
  if (env.debug) {
    const events = [
      'ready',
      'connect',
      'reconnecting',
      'end',
      'warning',
    ];

    events.forEach((event) => {
      state.client.on(event, () => {
        log.debug(`redis event ${event}`);
      });
    });

    state.client.on('error', (e) => {
      log.debug('Error: ', e.stack);
    });

    state.client.on('connect', (e) => {
      log.debug('redis client connected.', e);
    });

    state.client.on('end', (e) => {
      log.debug('redis client ended.', e);
    });
  }
};

const connect = async () => {
  if (state.client) {
    return state.client;
  }

  try {
    const options = {
      host,
      port,
      socket_keepalive: true,
      no_ready_check: true,
      retryStrategy(times) {
        const delay = Math.min(times * 1000, 2000);
        return delay;
      },
    };

    if (typeof password === 'string') {
      options.password = password;
    }

    const client = await redis.createClient(options); // password?
    if (options.password) {
      await client.auth(options.password);
    }

    state.client = client;
    setClientEvents();

    /*
    setInterval(() => {
      log.warn('redisClient keep-alive: ping-pong OFF');
      // client.set('ping', 'pong');
    }, 1000 * 55);
    */

    log.debug('redis client.connected =', client.connected);
    log.debug(`redis host=${host}`);
    log.debug(`redis port=${port}, is password set? ${typeof password === 'string'}`);

    return client;
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }
};

const getClient = () => state.client;

const get = async (key, isJSON = false) => {
  let val;

  try {
    val = await state.client.get(key);
    if (val) {
      let restored;

      if (!isJSON) {
        restored = val;
        // need to test this for packing/unpacking
      } else {
        if (env.PACK_REDIS_VAL) {
          restored = JSON.parse(pako.inflate(val, { to: 'string' }));
        } else {
          restored = JSON.parse(val);
        }

        val = restored;
      }
    }
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }

  return val;
};

const getz = async (key, val, ttl = undefined) => {
  const res = get(key, true);
  return res;
};

const set = async (key, val, ttl = undefined, isJSON = false) => {
  let res;

  try {
    if (val) {
      let stored;
      if (!isJSON) {
        stored = val;
      } else if (env.PACK_REDIS_VAL) {
        stored = pako.deflate(JSON.stringify(val), { to: 'string' });
      } else {
        stored = JSON.stringify(val);
      }

      res = (ttl)
        ? await state.client.setex(key, ttl, stored)
        : await state.client.set(key, stored);
    } else {
      await state.client.set(key, '');
      res = null;
    }
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }

  return res;
};

const setz = async (key, val, ttl = undefined) => {
  const res = await set(key, val, ttl, true);
  return res;
};

const quit = async () => {
  try {
    if (getClient()) {
      await getClient().quit();
      state.client = null;
    }
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }

  return null;
};

export default {
  quit,
  connect,
  get,
  getz,
  set,
  setz,
  getClient,
};
