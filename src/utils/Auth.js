/* eslint class-methods-use-this:0 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import _ from 'lodash';
import uuidv4 from 'uuid/v4';
import rIp from 'request-ip';

import env from '../config/env';
import c from '../config/consts';
import sc from '../config/statusCodes';
import verifyTokenTypes from '../models/enums/verifyTokenTypes';
import models from '../models/consts/models';
import UserSchema from '../models/schemas/UserSchema';
import BlacklistSchema from '../models/schemas/BlacklistSchema';
import crypto from '../utils/crypto';
import log from '../utils/logger';

/**
 *
 * Handles all authentication/authorization middleware.
 * Uses jwt auth and refresh tokens, checks blacklisting/validity via redis and mongoose models.
 *
 */
export default class Auth {
  static get defaultAuthPayload() {
    return c.DEFAULT_AUTH_PAYLOAD;
  }

  static get defaultRefreshPayload() {
    return c.DEFAULT_REFRESH_PAYLOAD;
  }

  static get blacklistModel() {
    return mongoose.models[models.blacklist] ?
      mongoose.models[models.blacklist] :
      mongoose.model(models.blacklist, BlacklistSchema);
  }

  static get userModel() {
    return mongoose.model(
      models.user,
      UserSchema,
    );
  }

  static getClientIp(req) {
    if (req) {
      return rIp.getClientIp(req) || '';
    }

    return '';
  }

  static getUserAgent(req) {
    return (req && req.headers && req.headers['user-agent']) ? req.headers['user-agent'] : '';
  }

  static getVerifyToken(size = 6, type = null, duration = null) {
    /* TODO:
      right now duration of tokens are infinite.
      i need to allow infinite tokens for now and add the correct
      code to allow 30m, 3h, 7d type of thing with moment.js. add(1, 'week') etc.
    */

    const len = parseInt(size, 10);

    if ((type !== null && !verifyTokenTypes.includes(type)) || !_.isNumber(len) || len < 3) {
      return null;
    }

    const ttl = null; // ttl is null when it is not used.
    const verifyToken = {
      code: crypto.genRandomString(len),
      verified: false,
      exp: ttl, // leave for now; will use with more advanced ttl functionality
    };

    if (ttl === null) {
      delete verifyToken.exp;
    }

    return verifyToken;
  }

  static getAuthTokenFromHeader(req) {
    let token = c.EMPTY_STR;
    if (_.has(req, 'headers.authorization', '')) {
      token = (req.headers.authorization || '').replace(
        c.BEARER_AUTH_PREFIX,
        c.EMPTY_STR,
      );
    }

    return token;
  }

  static hasAuthHeader(req) {
    return Auth.getAuthTokenFromHeader(req).length > 0;
  }

  static decodeToken(token) {
    let decoded = null;
    try {
      decoded = jwt.decode(token, env.jwtAuthSecret);
    } catch (e) {
      log.error('Error: ', e.stack);
      return null;
    }

    return decoded;
  }

  static isDecodedTokenExpired(decoded) {
    if (!decoded) {
      return true;
    }

    const ts = Date.now() / 1000;
    return parseFloat(ts) > parseFloat(decoded.exp);
  }

  static isTokenExpired(token) {
    const decoded = Auth.decodeToken(token);
    return decoded !== null && Date.now() / 1000 > (decoded.exp || 0);
  }

  static async isDataNotBlacklisted(accountId, list = null) {
    let blacklisted = null;

    try {
      blacklisted = await Auth.blacklistModel.check(accountId, list, c.LEAN);
    } catch (e) {
      log.error('Error: ', e.stack);
    }

    return (blacklisted) || true;
  }

  static async isTokenNotBlacklisted(accountId, type, token) {
    const isBlacklisted = false;

    if (type !== c.REFRESH_TOKEN || type !== c.AUTH_TOKEN) {
      return null;
    }

    const list = {};
    list[type] = token;

    try {
      const blacklist = await Auth.blacklistModel.check(accountId, list, c.LEAN);
      log.silly('blacklist:', blacklist);
    } catch (e) {
      log.error('Error: ', e.stack);
    }


    // do a query on the blacklisted collection for the
    // particular type. return true or false...

    return isBlacklisted;
  }

  // verify auth and refresh payloads.
  static verifyPayloadStructure(payload, type) {
    let verified = true;

    if (!payload) {
      return false;
    }

    const keys = (type === c.AUTH) ?
      Object.keys(Auth.defaultAuthPayload) :
      Object.keys(Auth.defaultRefreshPayload);

    keys.forEach((key) => {
      log.silly('#payload key:', key);
      if (!(payload && key in payload)) {
        log.silly('#payload key not found:', key);
        verified = false;
      }

      // AUTH payloads have a data object.
      if (type === c.AUTH) {
        if (key === c.DATA && payload.data) {
          const subkeys = Object.keys(Auth.defaultAuthPayload.data);

          subkeys.forEach((subkey) => {
            if (!(payload.data && subkey in payload.data)) {
              verified = false;
            }
          });
        }
      // refresh payloads just have a refresh type additionally.
      } else if (key === c.TYPE && payload[key] !== c.REFRESH) {
        verified = false;
      }
    });

    return verified;
  }

  static async getNewAuthToken(user, checkBlacklist = false) {
    // if something is wrong with user (deleted/etc/ then return
    // null) be sure to store refresh token in redis with a ttl.
    // the backend can kill off refresh tokens in mongo and
    // redis.

    // TODO: tokens based on device. shouldn't care what profile is.
    // so take devices out of profiles. i think.

    // if (!Validate.requireUserTokenFields(user)) return null;

    if (!user) return { valid: false };
    let token = null;

    // sign with default (HMAC SHA256)
    const created = Math.floor(Date.now() / 1000);
    const contacts = user.contacts[0];
    const device = user.devices[0];

    const payload = {
      sub: user.userId,
      iat: parseInt(created, 10),
      exp: parseInt(created, 10) + parseInt(
        env.jwtAuthTokenTtl,
        10,
      ),
      jti: uuidv4(),
      aud: env.domain,
      accountId: user.accountId,
      deviceId: device.deviceId,
      type: c.AUTH,
      env: env.environment,
      ip: device.ip,
      userAgent: device.userAgent,
      data: {
        username: user.username,
        email: contacts.email,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        displayName: contacts.displayName,
        rememberLoggedIn: device.rememberLoggedIn === true,
        agreementVersion: user.agreementVersion,
      },
    };

    token = jwt.sign(payload, env.jwtAuthSecret);
    return { token, payload };
  }

  static async getNewRefreshToken(user) {
    if (!user) return null;

    let token = null;
    // TODO: // refactor
    const device = _.get(user, 'devices[0]', {});

    const created = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.userId,
      iat: parseInt(created, 10),
      exp: parseInt(created, 10) + parseInt(env.jwtRefreshTokenTtl, 10),
      jti: uuidv4(),
      aud: env.domain,
      accountId: user.accountId,
      deviceId: device.deviceId,
      type: c.REFRESH,
      env: env.environment,
      ip: device.ip,
      userAgent: device.userAgent,
    };

    token = jwt.sign(payload, env.jwtRefreshSecret);
    return { token, payload };
  }

  static async getUserRefreshToken(user) {
    const refreshToken = null;

    try {
      const u = await Auth.userModel.findValidUser({ accountId: user.accountId, userId: user.userId }, c.LEAN);
      let device;

      if (u) {
        device = _.get(user, 'devices[0]', {});
        const list = {
          id: u.userId, // be sure to check that I'm using hashed user._uid all over.
          username: u.username,
          email: u.contacts[0].email,
          refreshToken: device.refreshToken,
          // crypto.getHashids().encodeHex(client): u.devices[0]._id, TODO: decide if i need to allow blacklisting of clientids.
        };

        if (_.get(device, 'ip.length', 0) > 1) {
          list.ip = device.ip;
        }

        const notBlacklisted = await Auth.isDataNotBlacklisted(user.accountId, list);

        // make sure token not expired.
        if (notBlacklisted && device && device.refreshToken) {
          if (!Auth.isTokenExpired(device.refreshToken)) {
            return device.refreshToken;
          }
        }
      }
    } catch (e) {
      log.error('Error: ', e.stack);
    }

    // if anything but a valid, non-expired token return null;
    return null;
  }

  static async refreshTokens(user, bNew = false) {
    let refresh = null;
    let auth = null;

    // if not new then check for valid refresh token
    // otherwise new user gets new refresh token
    refresh = (!bNew) ?
      await Auth.getUserRefreshToken(user) :
      await Auth.getNewRefreshToken(user);

    // if you now don't have a refresh token, something is wrong.
    if (refresh || bNew) auth = await Auth.getNewAuthToken(user);
    return { auth, refresh };
  }

  static async getNewTokens(user) {
    let tokens = null;
    try {
      tokens = await Auth.refreshTokens(user, true);
      return tokens;
    } catch (e) {
      log.error('Error: ', e.stack);
    }

    return tokens;
  }

  static verifyToken(token, type) {
    let payload = null;

    try {
      payload = jwt.decode(token, env.jwtAuthSecret);
      log.silly('verifyToken: successfully decoded', payload);
      if (payload && Auth.verifyPayloadStructure(payload, type)) {
        log.silly('verifyToken: verified structure', payload);
        if (!Auth.isDecodedTokenExpired(payload)) {
          log.silly('verifyToken: token VERIFIED', payload);
          return { expired: false, verified: true, payload };
        }
        log.silly('verifyToken: token is EXPIRED', payload);
        return { expired: true, verified: true, payload };
      }
    } catch (e) {
      if (e.name !== 'TokenExpiredError') {
        log.silly('verifyToken: TOKEN ERROR (non-expired)', e);
        return { expired: true, verified: false, payload };
      }
    }

    log.silly('verifyToken: token NOT verified', payload);
    return { expired: false, verified: false, payload };
  }

  static async checkAuth(req) {
    // check that a token is in the req headers
    const token = Auth.getAuthTokenFromHeader(req);
    let a = {
      header: token,
      expired: null,
      verified: null,
      payload: null,
      newToken: null,
    };

    let r = Object.assign({}, a);

    if (token.length > 0) {
      try {
        // verify the payload is what we expect it to be.
        // payload from verifyToken needs more output from this fn.
        a = Object.assign(
          {},
          { header: token, newToken: null },
          Auth.verifyToken(token, c.AUTH),
        );

        if (a.verified && a.payload) {
          if (!a.expired) {
            // we're good. return all info back.
            return {
              header: token,
              expired: a.expired,
              verified: a.verified,
              payload: a.payload,
              newToken: null,
            };
          }
          // expired, but verified. expired but can use token info to
          // try a refresh token.
          // log.silly('checkAuth: the authToken has expired.', token);
          const model = mongoose.model(models.user, UserSchema);

          // use the dehashed user _id (userId to _id)
          const id = crypto.getHashids().decodeHex(a.payload.sub);

          // log.silly('checkAuth: trying refreshToken.', id);
          const user = await model.findValidUser({ _id: id }, c.LEAN);
          if (_.get(user, 'devices.[0].refreshToken', false)) {
            const device = user.devices[0];
            device.ip = Auth.getClientIp(req);
            device.userAgent = Auth.getUserAgent(req);

            r = Auth.verifyToken(device.refreshToken, c.REFRESH);
            if (r.verified && r.payload) {
              if (!r.expired) {
                const newToken = await Auth.getNewAuthToken(user);
                log.silly('checkAuth: refreshToken used.', newToken);
                return {
                  header: token,
                  expired: false,
                  verified: true,
                  payload: newToken.payload,
                  newToken: newToken.token,
                };
              }
            }
            log.silly('checkAuth: refresh token not used.');
          }
        }
      } catch (e) {
        // any error at this point means a bad token.
        log.error('Error: ', e.stack);
      }
    }
    // can't trust the token. return the non-verified information.
    return a;
  }

  // TODO: still need to finish off these methods below for authn and get rid of unneccesary.
  static async auth(req, res, next) {
    if (!req.body || !req.body.username || !req.body.password) {
      res.status(400).send({ status: 400, msg: 'username and password are required.' });
      return null;
    }
    // authenticate
    next();
  }

  static async isAuthN(req) {
    try {
      const { expired, verified, payload } = await Auth.checkAuth(req);
      if (expired === false && verified === true && _.isObject(payload)) {
        return payload;
      }
    } catch (e) {
      log.error('Error: ', e.stack);
    }
    return false;
  }

  // need to check if user has rights to operation.
  // so this will check the users token and then return their rights.
  // will be added to request object as middleware.
  // also check authentication first.
  static async isAuthZ(req) {
    let authed = null;

    // TODO: THIS IS WRONG.
    // AUTH Z should assume an authN check was made, then just do an authZ in model route method.
    // use as reference and then get rid of.

    try {
      authed = await Auth.checkAuth(req);
      if (authed.expired || !authed.verified || !authed.payload) {
        return { access: false, reason: sc.NOT_AUTHENTICATED, result: authed };
      }

      // now check authorized.
    } catch (err) {
      log.error('Error', err);
    }

    // need to implement, for now just give back unAuthz'd.
    return { access: false, reason: sc.NOT_AUTHORIZED, result: authed };

    // TODO later:
    // checkauth does most of this already:
    // check that a token is in the Headers check that it is
    // valid. use a refresh token if necessesary make sure not
    // blacklisted tokens what else?
  }

  // return authed.payload;
}
