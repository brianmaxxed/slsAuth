import _ from 'lodash';
import log from '../../../src/utils/logger';
import crypto from '../../../src/utils/crypto';
import User from '../../../src/models/User';
import Auth from '../../../src/utils/Auth';
import Validate from '../../../src/utils/Validate';
import h, { statusObject, errorObject } from '../../../src/utils/helper';
import D from '../data/Data';
import c from '../../../src/config/consts';
import sc from '.testHelper./../../src/config/statusCodes';
import ec from '../../../src/config/errorCodes';
import CustomError from '../../../src/utils/CustomError';

const expectErrorOutput = (output, obj) => {
  const { id, status, msg } = obj;
  expect(output.status).toEqual(status);
  expect(output.errors[0].error.msg).toBe(msg);
};

const expectGoodOutput = (output, obj, data = {}) => {
  const { id, status, msg } = obj;
  expect(output.status).toBe(status);
  expect(output.msg).toBe(msg);
  expect(output.data).toEqual(data);
};

const insertNewValidUser = async () => {
  let saved;

  try {
    const u1 = new User.Model(D.newUserGood1);
    const { hash } = await crypto.hashPassword(D.newUserGood1.password);
    u1.password = hash;
    saved = await u1.save();
  } catch (e) {
    log.error('Error: ', e.stack);
  }

  return saved;
};

const getValidAuth = async (newUser = false) => {
  let validAuth = {};
  let saved;

  try {
    if (newUser) {
      saved = await insertNewValidUser();
    }

    validAuth = Object.assign({}, D.validTokenHeader);
    validAuth.auth = await Auth.checkAuth(D.validTokenHeader);
  } catch (e) {
    log.error('Error: ', e.stack);
  }
  return Object.assign({}, validAuth);
};

const getInvalidAuthUser = async () => {
  let validAuth = {};
  let saved;

  try {
    const u = await new User().Model(D.newUserGood1);
    u.softDelete = true;
    saved = await u.save();

    validAuth = Object.assign({}, D.validTokenHeader);
    validAuth.auth = await Auth.checkAuth(D.validTokenHeader);
  } catch (e) {
    log.error('Error: ', e.stack);
  }

  return Object.assign({}, validAuth);
};

const getBadAuth = async (token) => {
  let req;

  if (_.isString(token)) {
    req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
  } else {
    req = D.invalidTokenHeader;
  }

  const badAuth = Object.assign({}, req);

  return Object.assign({}, badAuth);
};

const expectSuccessfulPayload = (authed, expected) => {
  expect(authed.status).toBe(sc.SUCCESS.status);
  expect(authed.msg).toBe(sc.SUCCESS.msg);
  expect(authed.data).toEqual(expected);
};

const testForUnAuthedInvalidUser = async (method) => {
  // empty request object.
  const u = new User();
  let authed = await u[method]();
  expect(authed).toEqual(errorObject(sc.NOT_AUTHENTICATED));

  // invalid token header
  const user = await u.Model(D.newUserGood1).save();
  const badAuth = Object.assign({}, D.invalidTokenHeader);
  const auth = await Auth.checkAuth(D.invalidTokenHeader);
  badAuth.auth = auth;
  authed = await u[method](badAuth);
  expect(authed).toEqual(errorObject(sc.NOT_AUTHENTICATED));

  // create an invalid User;
  user.softDelete = true;
  await user.save();

  // reject an invalid User in db;
  const validAuth = await getValidAuth();
  authed = await u[method](validAuth);

  expect(authed).toEqual(errorObject(sc.INVALID_USER));
};


const mapFieldToObject = (field, source) => source.map((item) => {
  if (!_.isUndefined(item)) {
    const obj = {};
    obj[field] = item;
    return obj;
  }
  return item;
});

const testForInvalidUserFields = async (method, fields, type = 'body') => {
  try {
    if (type !== 'params' && type !== 'body') {
      throw new CustomError(ec.INVALID_FIELD_SOURCE_TYPE);
    }

    const u = new User();
    expect(typeof u[method]).toBe('function');

    const validAuth = await getValidAuth(c.NEW_USER);
    const validFields = Object.keys(D.fields);

    expect(_.difference(fields, validFields)).toHaveLength(0);

    const checks = fields.map(field => ({
      name: field,
      invalids: mapFieldToObject(field, D.fields[field].invalids).reverse(),
      valids: mapFieldToObject(field, D.fields[field].valids).reverse(),
    }));

    const perms = [];

    const test = _.zipWith(checks, (check) => {
      check.invalids.forEach((item, index) => {
        perms[index] = Object.assign({}, perms[index], item);
      });
    });

    perms.forEach((perm, index) => {
      if (!_.isEmpty(perms[index])) {
        checks.forEach((check) => {
          if (!_.has(perms[index], check.name) && check.valids.length > 0) {
            perms[index][check.name] = check.valids.pop()[check.name];
          }
        });
      }
    });

    const results = [];
    await h.asyncForEachLinear(perms, async (perm) => {
      validAuth[type] = Object.assign({}, perm);
      results.push(await u[method](validAuth));
    });

    const remove = await User.Model.remove({ accountId: D.accountId });
    // expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS, method);
    return results;
  } catch (e) {
    return h.unhandledErrorObject(e);
  }
};

module.exports = {
  expectErrorOutput,
  expectGoodOutput,
  insertNewValidUser,
  testForUnAuthedInvalidUser,
  testForInvalidUserFields,
  getValidAuth,
  getInvalidAuthUser,
  getBadAuth,
  expectSuccessfulPayload,
};
