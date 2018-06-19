/*
  eslint no-useless-escape:0, no-useless-concat:0,
  no-shadow:0, no-restricted-syntax:0, no-await-in-loop:0
*/

import moment from 'moment';
import _ from 'lodash';
import u from 'util';
import uuid from 'uuid/v4';

import Auth from './Auth';
import log from './logger';

import c from '../config/consts';
import sc from '../config/statusCodes';
import ec from '../config/errorCodes';
import CustomError from '../utils/CustomError';
import env from '../config/env';
import deviceTypes from '../models/enums/deviceTypes';

const mapToArray = (map) => {
  const output = [];

  map.forEach((value, key, map) => {
    output.push(value);
  });

  return output;
};

const enumProp = (ar = [], item) => {
  try {
    return ar[item];
  } catch (e) {
    throw new CustomError(ec.PROP_NOT_FOUND);
  }
};

const wrapAsync = async fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

const statusObject = (sc, output = {}) => {
  const { id, status, msg } = sc;
  return {
    id,
    status, // TODO: need to consolidate sc to status not code.
    msg,
    data: output,
  };
};

const hasOnlyOne = (obj = {}, fields = []) => {
  const out = fields.filter(f => f in obj).map(k => ({ field: k, value: obj[k] }));
  return (out.length === 1) ? out : [];
};

const wrapErrorCode = error => ([{ error }]);

const errorObject = (error) => {
  const output = {};

  if (!error) {
    return output;
  }

  const { id = 0, status = 500, msg = 'internal error' } = error;

  output.id = id;
  output.status = status;
  output.msg = msg;

  if (_.get(error, 'errors')) {
    output.errors = error.errors;
  } else {
    output.errors = [];
    const e = {
      error: {
        id,
        status,
        msg,
      },
    };

    if (error.extra) e.extra = error.extra;
    output.errors.push(e);
  }

  return output;
};

/*
  log an unhandled error and output errorObject depending on debug options

*/

const unhandledErrorObject = (e) => {
  if (env.environment === 'production' && !env.stackTraceUnhandledErrors) {
    log.error(`${e.message} ${e.extra}`);
  } else {
    log.error(e.stack);
  }
  if (env.environment !== 'production' || env.debug) return errorObject(e);
  return errorObject(sc.INTERNAL_ERROR);
};

/*
  take a path to a property and verify that property is settable and the parents are enabled.

*/

const verifyValidSettableProperty = (store, prop) => {
  const output = {
    valid: false,
    writable: false,
    error: null,
  };

  // split the property on '.' as an array. for each over the array and see if all parents enabled.
  // but first check that the property is valid and settable.

  if (!_.isObject(store)) {
    output.error = sc.INVALID_SETTING_STORE;
    return output;
  }

  if (!_.has(store, prop)) {
    // invalid property. return that status code.
    output.error = sc.INVALID_SETTING;
    return output;
  }

  if (_.get(store, prop) !== true) {
    // not writable
    output.error = sc.PROPERTY_NOT_WRITABLE;
    return output;
  }

  const path = prop.split('.');

  if (path.length < 3) {
    // not a valid property within a property store.
    output.error = sc.INVALID_SETTING;
    return output;
  }

  output.writable = true;
  let valid = true;
  const property = path.pop();

  let check = '';
  path.forEach((item, index) => {
    check += `${item}.`;
    if (_.get(store, `${check}_enabled`) === false) {
      // a disabled parent in hierarchy.
      valid = false;
      output.writable = false;
    }
  });

  output.valid = valid;

  if (!valid) {
    output.error = sc.PROPERTY_NOT_ENABLED;
  }

  return output;
};

/*
  takes in an object off the model schema and allows for updating one or more settings off
  the params property. this can be either req.body or a param set by model.
  when it gets here it doesn't have to be know where it came from.
*/

const verifyValidSettablePropObject = (store, parent, props) => {
  const output = { validStore: false, validProps: false, invalidProps: null };

  if (!_.isObject(store) || !_.isString(parent) || !_.isObject(props)) {
    return output;
  }

  if (!(parent in store) || Object.keys(props).length < 1) {
    return output;
  }

  output.validStore = true;

  // check it's value for a prop in an object against the store nested object property.
  const search = (actual, parent, expected, root = true) => {
    let check = {};
    let invalid = {};
    if (!(parent in expected)) {
      check[parent] = expected;
    } else {
      check = expected;
    }

    if (!_.has(actual, parent) || actual[parent]._enabled !== true) {
      invalid = check[parent];
      return invalid;
    }

    Object.keys(check[parent]).forEach((key) => {
      if (key !== '_enabled') {
        if (typeof check[parent][key] !== 'object') {
          if (actual[parent][key] !== true) {
            invalid[key] = check[parent][key];
          }
        } else {
          const test = search(actual[parent], key, check[parent], false);
          if (Object.keys(test).length > 0) {
            invalid[key] = test;
          }
        }
      }
    });

    return invalid;
  };

  output.invalidProps = search(store, parent, props);

  // check props against the propertyStore.
  if (Object.keys(output.invalidProps).length === 0) {
    output.validProps = true;
  }

  return output;

  // verify


  // make up a simple property store.
  // do privacy first, then a simple paymentmethods, and some of the other settings.
  // think generic but think starbuzz.

  // then test for different valid and invalid possiblities.
  // write tests
  // complete function as it applies to updatePropObject and updateProperty.
  // remember updatePropObject is a set of object settings
  // updateProperty is a path to a specific setting.
};

const updatePropObject = async (store, parent, props, doc, propertyStores) => {
  const output = {
    validStore: false,
    validProps: false,
    invalidProps: {},
    saved: false,
    data: {},
    error: null,
    result: null,
  };

  if (_.isUndefined(store) || _.isUndefined(parent)) {
    output.error = sc.INVALID_SETTING_STORE;
    return output;
  }

  if (_.isEmpty(props)) {
    output.error = sc.SPECIFY_SETTINGS;
    return output;
  }

  const model = doc;

  // can update groups of settings objects. if they're not there add them if valid/settable props.
  // settings are objects of { name, value, type } see models/objects/settings.js
  // can update a valid/settable sub-object (paymentMethods, subscriptions)

  // TODO: accept any settings for now; but add property objects for major model settings.
  // TODO: must account for nested settings. only allow correct settings, no overwrites.
  // TODO: I can even be sure of datatypes.
  const verify = verifyValidSettablePropObject(propertyStores[store], parent, props);
  if (!verify.validStore) {
    output.error = sc.INVALID_SETTING_STORE;
    return output;
  }

  output.validStore = true;

  if (!verify.validProps) {
    output.invalidProps = verify.invalidProps;
    output.error = sc.INVALID_SETTINGS;
    return output;
  }

  output.validProps = true;

  model[parent] = Object.assign({}, model[parent], props);

  try {
    output.result = await model.save();
    output.saved = true;
  } catch (e) {
    log.log(e);
    output.saved = false;
    output.error = sc.INTERNAL_ERROR;
  }

  return output;
};

/*
      update one setting off a model setting object.
      uses lodash _.has, _.get, and _.set to find and update a path.
    */

const updateProperty = async (store, prop, value, model, propertyStores) => {
  const output = {
    validStore: false,
    validProps: false,
    saved: false,
    data: {},
    error: null,
    result: null,
  };

  // only valid settings that can be set.
  if (!_.has(propertyStores, store)) {
    output.error = sc.INVALID_SETTING_STORE;
    return output;
  }

  output.validStore = true;

  // only valid settings that can be set.
  const verify = verifyValidSettableProperty(propertyStores, `${store}.${prop}`);
  if (!verify.valid || !verify.writable) {
    output.error = verify.error;
    return output;
  }

  if (_.isUndefined(prop) || _.isUndefined(value)) {
    output.error = sc.SPECIFY_ONE_SETTING;
    return output;
  }

  output.validProps = true;

  const doc = model;

  /*
      need for profiles and devices...
      if (!_.isInteger(idx) || !_.indexOf(doc[parent], idx) !== -1) {
        output.error = sc.SPECIFY_ONE_INDEX;
      }
  */

  // verified so set the property.
  _.set(doc, prop, value);

  try {
    output.result = await doc.save();
    output.saved = true;
  } catch (e) {
    log.log(e);
    output.saved = false;
    output.error = sc.INTERNAL_ERROR;
  }

  return output;
};

const processResults = (payload, res, next) => {
  const output = Object.assign({}, payload);

  if (output) {
    if (output.error) {
      if (output.errors) {
        output.errors.push({ msg: output.error.msg, stack: output.error.stack });
      } else {
        output.errors = [{ error: output.error }];
      }
      delete output.error;
      if (!_.has(output, 'status')) {
        output.status = output.errors[0].status || 500;
      }
    }

    res.type('json');
    /*
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    });
    */
    res.status(output.status || 500).send(output);
  }

  if (!res.headersSent) {
    next();
  }

  return output;
};

const asynced = async (inst, fn, params) => {
  // log.info(`Memory before route: ${parseInt(process.memoryUsage().rss / 1024 / 1024, 10)} MB used.`);
  const [req, res, next] = params;
  const out = await inst[fn](req);
  processResults(out, res, next);
  // log.info(`Memory after route: ${parseInt(process.memoryUsage().rss / 1024 / 1024, 10)} MB used.`);
  return out;
};

const asyncForEachLinear = async (ar, fn) => {
  for (const t of ar) { await fn(t); }
};

const asyncForEach = async (ar, fn) => {
  await Promise.all(ar.map(fn));
};

const authN = async (inst, fn, params) => {
  // console.log(fn);
  const [req, res, next] = params;
  // check if a doc is authenticated.

  if ('auth' in req) {
    throw new Error("request object already has an 'auth' property");
  }

  let out;

  try {
    const auth = await Auth.checkAuth(req);

    req.auth = auth;
    out = await asynced(inst, fn, [req, res, next]);
  } catch (e) {
    log.error(e);
    out = e;
  }

  return out;
};

const getDeviceType = (req) => {
  const verified = {
    valid: false,
    type: _.keyBy(deviceTypes).default,
    ip: Auth.getClientIp(req),
    userAgent: Auth.getUserAgent(req),
  };

  // need to devise a device type from the req object.

  return verified;
};

const formatTimeLeft = (time) => {
  const minutes = (time) / 60 > 1 ? (time) / 60 : 1;
  return `${minutes} minute${(minutes !== 1) ? 's' : ''}`;
};

// TODO: not used at the moment.
const escapeRegSlash = (str) => {
  log.debug('1 -  the str:', str);
  log.debug('2 - regex escaped str:', str.replace(/\\/g, String.raw`\\`));
  return str.replace(/\\/g, String.raw`\\`);
};

// TODO: not used at the moment.
const escapeRegExp = str => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

module.exports = {
  mapToArray,
  enumProp,
  wrapErrorCode,
  hasOnlyOne,
  verifyValidSettableProperty,
  verifyValidSettablePropObject,
  updatePropObject,
  updateProperty,
  processResults,
  statusObject,
  errorObject,
  unhandledErrorObject,
  getDeviceType,
  // escapeRegSlash,
  // escapeRegExp,
  formatTimeLeft,
  asynced,
  asyncForEachLinear,
  asyncForEach,
  authN,
  /*
    checkPageParam,
    formatPagedPayload,
    formatPayload,
    packEndpoint,
    outputResponse,
  */
};

/*

from other api:

const checkPageParam = (q, params) => {
  const [req, res, next] = params;
  const pageCount = (q && q.pageCount)
    ? q.pageCount
    : c.PAGE_LIMIT;

  const page = (req && req.query && req.query.page)
    ? parseInt(req.query.page || 1, 10)
    : 1;
  if (Number.isNaN(page) || page < 1 || page > pageCount) {
    return false;
  }

  return page;
};

const packEndpoint = (val) => {
  if (!env.PACK_REDIS_KEY) {
    return val;
  }

  let regex;
  let idx = 0;
  for (const v in vals) {
    const re = new RegExp(vals[v]);
    regex = val.match(re);
    if (regex) {
      break;
    }
    idx += 1;
  }

  if (regex && regex.length && regex.length > 1) {
    let ret = `${keys[idx]}`;

    if (regex.length > 2) {
      for (let i = 2; i < regex.length; i += 1) {
        ret += `${regex[i]}`;
      }
    }

    return ret;
  }
  return val;
};

const unpackEndpoint = (val) => {
  // TODO: not needed yet.
};

const formatPagedPayload = (data, params) => {
  const [req, res, next] = params;

  const results = data.results || [];

  const payload = {
    statusCode: {
      status: sc.SUCCESS.status,
      msg: sc.SUCCESS.msg,
    },
    page: data.page || 0,
    search: data.name,
    totalResults: data.totalResults || 0,
    totalPages: Math.ceil(data.totalResults / data.perPage) || 0,
    perPage: data.perPage,
    count: results.length,
    results,
  };

  return { status: sc.SUCCESS.status, payload };
};

const formatPayload = (results, params) => {
  const payload = {
    statusCode: {
      status: sc.SUCCESS.status,
      msg: sc.SUCCESS.msg,
    },
    count: 1,
    results: results || {},
  };

  return { status: sc.SUCCESS.status, payload };
};

const outputResponse = (results, ...params) => {
  const [req, res, next] = params;
  if (!res.headersSent) {
    let success = true;

    for (const result in results) {
      if (results[result] &&
        results[result].status &&
        results[result].status !== 200) {
        success = false;
        res.status(results[result].status).send(results[result]);
        break;
      }
    }

    if (success) {
      res.status(200).send(results);
    }
  }
};

*/
