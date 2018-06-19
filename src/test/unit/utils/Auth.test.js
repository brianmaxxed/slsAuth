/* eslint no-shadow: 0, no-unused-expressions:0 */
import mongoose from 'mongoose';
import rIp from 'request-ip';

import mh from '../../utils/mongooseHelper';
import crypto from '../../../../src/utils/crypto';
import env from '../../../../src/config/env';
import c from '../../../../src/config/consts';
import Auth from '../../../../src/utils/Auth';

import BlacklistSchema from '../../../../src/models/schemas/BlacklistSchema';
import Blacklist from '../../../../src/models/Blacklist';
import UserSchema from '../../../../src/models/schemas/UserSchema';
import User from '../../../../src/models/User';
import m from '../../../../src/models/consts/models';
import log from '../../../../src/utils/logger';
import D from '../../data/';

require('../../utils/unitTestSetupHelper');

const u = {};
u.test = () => 'test';

const req = { name: 'req' };
const res = {
  name: 'res',
  status: () => ({
    send: () => null,
  }),
};

const next = () => 'next';

const reqUserAgent = {
  headers: {
    'user-agent': 'TESTING',
  },
};

// what do i need to test.
// signup, login, logout, account, myAccount,

describe('Auth library', () => {
  /*
  describe('getClientIp', async () => {
    test('', async () => {
      // what to test?
    });
  });

  describe('getUserAgent', async () => {
    test('', async () => {
      // what to test?
    });
  });
  */

  describe('defaultAuthPayload', () => {
    test('results equal c.DEFAULT_AUTH_PAYLOAD', () => {
      expect(Auth.defaultAuthPayload).toEqual(c.DEFAULT_AUTH_PAYLOAD);
    });
  });

  describe('getVerifyToken', () => {
    test('gets a username verify token with no ttl', () => {
      const size = 6;
      const token = Auth.getVerifyToken(size, c.USERNAME);

      expect(typeof token).toBe(c.OBJECT);
      expect(token.code).toHaveLength(size);
      expect(token).not.toHaveProperty('ttl');
      expect(token.verified).toBe(false);
    });

    test('gets a password verify token with no ttl', () => {
      const size = 6;
      const token = Auth.getVerifyToken(size, c.PASSWORD);

      expect(typeof token).toBe('object');
      expect(token.code).toHaveLength(size);
      expect(token).not.toHaveProperty('ttl');
      expect(token.verified).toBe(false);
    });

    test('gets an email verify token with no ttl', () => {
      const size = 6;
      const token = Auth.getVerifyToken(size, c.EMAIL);

      expect(typeof token).toBe('object');
      expect(token.code).toHaveLength(size);
      expect(token).not.toHaveProperty('ttl');
      expect(token.verified).toBe(false);
    });

    test('gets an alt email verify token with no ttl', () => {
      const size = 6;
      const token = Auth.getVerifyToken(size, c.ALT_EMAIL);

      expect(typeof token).toBe(c.OBJECT);
      expect(token.code).toHaveLength(size);
      expect(token).not.toHaveProperty('ttl');
      expect(token).toHaveProperty('verified', false);
    });

    test('expect verify token to have the correct size', () => {
      expect(Auth.getVerifyToken().code).toHaveLength(6);
      expect(Auth.getVerifyToken(6).code).toHaveLength(6);
      expect(Auth.getVerifyToken(7).code).toHaveLength(7);
      expect(Auth.getVerifyToken(8, c.USERNAME).code).toHaveLength(8);
      expect(Auth.getVerifyToken(9, c.PASSWORD).code).toHaveLength(9);
      expect(Auth.getVerifyToken(10, c.EMAIL).code).toHaveLength(10);
      expect(Auth.getVerifyToken(20, c.ALT_EMAIL).code).toHaveLength(20);
    });

    test('expect a token size to be at least 3 in length', () => {
      expect(Auth.getVerifyToken(1)).toBeNull();
      expect(Auth.getVerifyToken(2)).toBeNull();
      expect(Auth.getVerifyToken(3).code).toHaveLength(3);
    });

    test('expect no expiration on tokens', () => {
      expect(typeof Auth.getVerifyToken()).toBe(c.OBJECT);
      expect(Auth.getVerifyToken()).not.toHaveProperty('exp');
    });
  });

  describe('defaultRefreshPayload', () => {
    test('results equal c.DEFAULT_AUTH_PAYLOAD', () => {
      expect(Auth.defaultRefreshPayload).toEqual(c.DEFAULT_REFRESH_PAYLOAD);
    });
  });

  describe('blacklistModel', () => {
    test('equals the mongoose blacklist model', () => {
      const u = mongoose.model(m.blacklist, BlacklistSchema);
      expect(Auth.blacklistModel).toEqual(u);
    });
  });

  describe('userModel', () => {
    test('equals the mongoose user model', () => {
      const u = mongoose.model(m.user, UserSchema);
      expect(Auth.userModel).toEqual(u);
    });
  });

  describe('getAuthTokenFromHeader', () => {
    test('returns a valid auth token from the header', () => {
      const token = Auth.getAuthTokenFromHeader(D.validTokenHeader);
      expect(token).toBe(D.validAuthToken);
    });
  });

  describe('hasAuthHeader', () => {
    test('true when req has a bearer token in the auth header', () => {
      const hasToken = Auth.hasAuthHeader(D.validTokenHeader);
      expect(hasToken).toBe(true);
    });

    test('false when req has no bearer token in the auth header', () => {
      const token = Auth.getAuthTokenFromHeader();
      const hasToken = Auth.hasAuthHeader();
      expect(hasToken).toBe(false);
    });
  });

  describe('decodeToken', () => {
    test('a jwt decoded object', () => {
      const token = Auth.getAuthTokenFromHeader(D.validTokenHeader);
      const decoded = Auth.decodeToken(token);
      expect(typeof decoded).toBe(c.OBJECT);
    });

    test('a verified payload from a jwt auth token', () => {
      const decoded = Auth.decodeToken(D.validAuthToken);
      const verified = Auth.verifyPayloadStructure(decoded, c.AUTH);
      expect(verified).toBe(true);
    });

    test('a verified payload from a jwt refresh token', () => {
      const decoded = Auth.decodeToken(D.validRefreshToken);
      const verified = Auth.verifyPayloadStructure(decoded, c.REFRESH);
      expect(verified).toBe(true);
    });
  });

  describe('isDecodedTokenExpired', () => {
    test('auth not expired', () => {
      const out = Auth.isDecodedTokenExpired(D.validAuthPayload);
      expect(out).toBe(false);
    });

    test('auth expired', () => {
      const out = Auth.isDecodedTokenExpired(D.expiredAuthPayload);
      expect(out).toBe(true);
    });

    test('refresh not expired', () => {
      const out = Auth.isDecodedTokenExpired(D.validRefreshPayload);
      expect(out).toBe(false);
    });

    test('refresh expired', () => {
      const out = Auth.isDecodedTokenExpired(D.expiredRefreshPayload);
      expect(out).toBe(true);
    });

    test('invalid token', () => {
      const out = Auth.isDecodedTokenExpired({ stuff: 'not valid' });
      expect(out).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    test('auth not expired', () => {
      const out = Auth.isTokenExpired(D.validAuthToken);
      expect(out).toBe(false);
    });

    test('auth expired', () => {
      const out = Auth.isTokenExpired(D.expiredAuthToken);
      expect(out).toBe(true);
    });

    test('refresh not expired', () => {
      const out = Auth.isTokenExpired(D.validRefreshToken);
      expect(out).toBe(false);
    });

    test('refresh expired', () => {
      const out = Auth.isTokenExpired(D.expiredRefreshToken);
      expect(out).toBe(true);
    });

    test('invalid token', () => {
      const out = Auth.isTokenExpired('3456543234');
      expect(out).toBe(false);
    });
  });

  describe('isDataNotBlacklisted', () => {
    test('valid payload is not blacklisted', async () => {
      const list = [
        D.blacklistedAuthToken,
        D.blacklistedPassword,
        D.blacklistedUsername,
        D.blacklistedEmail,
      ];

      await Blacklist.Model.remove({ accountId: D.accountId });
      await Blacklist.Model.insertMany(list);
      const count = await Blacklist.Model.count({ accountId: D.accountId });
      expect(count).toEqual(4);

      const out = await Auth.isDataNotBlacklisted(
        D.blacklistedAuthToken.accountId,
        {
          username: D.signupValidFields.username,
          email: D.signupValidFields.email,
          authToken: D.signupValidFields.authToken,
          password: D.signupValidFields.password,
        },
      );

      expect(out).toBe(true);

      await Blacklist.Model.remove({ accountId: D.accountId });
    });

    test('blacklisted payload is verified blacklisted', async () => {
      const list = [
        D.blacklistedPassword,
        D.blacklistedUsername,
        D.blacklistedEmail,
      ];

      const removed = await Blacklist.Model.remove({ accountId: D.accountId });
      const output = await Blacklist.Model.insertMany(list);
      const count = await Blacklist.Model.count({ accountId: D.accountId });
      expect(count).toEqual(3);

      const out = await Auth.isDataNotBlacklisted(
        D.blacklistedPassword.accountId,
        {
          email: D.blacklistedEmail.value,
          password: D.blacklistedPassword.value,
          username: D.blacklistedUsername.value,
        },
      );

      const errors = [
        { error: { msg: 'that email is not available' } },
        { error: { msg: 'that password is not available' } },
        { error: { msg: 'that username is not available' } },
      ];

      expect(out.status).toEqual(400);
      expect(out.errors).toEqual(errors);
      await Blacklist.Model.remove({ accountId: D.accountId });
    });
  });

  describe('isTokenNotBlacklisted', () => {
    test('blacklisted payload is verified blacklisted', async () => {
      const list = [
        D.blacklistedAuthToken,
      ];

      await Blacklist.Model.remove({ accountId: D.accountId });
      await Blacklist.Model.insertMany(list);
      const count = await Blacklist.Model.count({ accountId: D.accountId });
      expect(count).toEqual(1);

      const out = await Auth.isDataNotBlacklisted(
        D.blacklistedAuthToken.accountId,
        { authToken: D.blacklistedAuthToken.value },
      );

      const errors = [
        { error: { msg: 'that authToken is not available' } },
      ];

      expect(out.status).toEqual(400);
      expect(out.errors).toEqual(errors);
      await Blacklist.Model.remove({ accountId: D.accountId });
    });
  });

  describe('verifyPayloadStructure', () => {
    test('a verified payload from a jwt auth token', () => {
      const verified = Auth.verifyPayloadStructure(D.validAuthPayload, c.AUTH);
      expect(verified).toBe(true);
    });

    test('a verified payload from a jwt refresh token', () => {
      const verified = Auth.verifyPayloadStructure(D.validRefreshPayload, c.REFRESH);
      expect(verified).toBe(true);
    });

    test('doesn\'t allow a wrong jwt auth payload', () => {
      const verified = Auth.verifyPayloadStructure(D.validRefreshPayload, c.AUTH);
      expect(verified).toBe(false);
    });

    test('doesn\'t allow a wrong jwt refresh payload', () => {
      const verified = Auth.verifyPayloadStructure(D.validAuthPayload, c.REFRESH);
      expect(verified).toBe(false);
    });

    test('doesn\'t allow an invalid jwt auth payload', () => {
      const verified = Auth.verifyPayloadStructure({ stuff: 'not valid' }, c.AUTH);
      expect(verified).toBe(false);
    });

    test('doesn\'t allow an invalid jwt refresh payload', () => {
      const verified = Auth.verifyPayloadStructure({ stuff: 'not valid' }, c.REFRESH);
      expect(verified).toBe(false);
    });

    test('doesn\'t allow an empty jwt auth payload', () => {
      const verified = Auth.verifyPayloadStructure(null, c.AUTH);
      expect(verified).toBe(false);
    });

    test('doesn\'t allow an empty jwt refresh payload', () => {
      const verified = Auth.verifyPayloadStructure(null, c.REFRESH);
      expect(verified).toBe(false);
    });
  });

  describe('getNewAuthToken', () => {
    test('returns a valid auth token and payload', async () => {
      const auth = await Auth.getNewAuthToken(D.newUserGood1, reqUserAgent);

      expect(Object.keys(auth)).toEqual(['token', 'payload']);

      const decoded = Auth.decodeToken(auth.token);

      expect(decoded).toEqual(auth.payload);
      // verify the expire time
      expect(auth.payload.exp - auth.payload.iat).toEqual(parseInt(env.jwtAuthTokenTtl, 10));
    });
  });

  describe('getNewRefreshToken', () => {
    test('returns a valid refresh token and payload', async () => {
      const newPayload = Object.assign({}, D.newUserGood1, { _id: 1 });

      const refresh = await Auth.getNewRefreshToken(newPayload);

      expect(Object.keys(refresh)).toEqual(['token', 'payload']);

      const decoded = Auth.decodeToken(refresh.token);
      expect(decoded).toEqual(refresh.payload);

      // verify the expire time
      expect(refresh.payload.exp - refresh.payload.iat).toBe(parseInt(env.jwtRefreshTokenTtl, 10));
    });

    test('must have a user agent header', async () => {
      const refresh = await Auth.getNewRefreshToken(D.newUserGood1, reqUserAgent);
      expect(refresh.payload.userAgent).toBe(reqUserAgent.headers['user-agent']);
    });
  });

  describe('getUserRefreshToken', () => {
    test('returns a valid refresh token and payload', async () => {
      await new User().Model.remove({ accountId: D.accountId });
      const u = await new User.Model(D.newUserGood1);
      const refresh = await Auth.getNewRefreshToken(u._doc, reqUserAgent);
      u.devices[0].refreshToken = refresh.token;
      const saved = await u.save();

      delete u.devices[0].refreshToken;

      const token = await Auth.getUserRefreshToken(u._doc, reqUserAgent);
      const decoded = Auth.decodeToken(token);
      const verified = Auth.verifyPayloadStructure(decoded, c.REFRESH);

      expect(verified).toBe(true);

      await new User().Model.remove({ accountId: D.accountId });
    });
  });

  describe('refreshTokens', () => {
    test('expects valid auth/refresh tokens for new users', async () => {
      const u = Object.assign({}, D.newUserGood1);
      u.devices[0].ip = '0.0.0.0';
      u.devices[0].userAgent = 'TESTING';

      const tokens = await Auth.refreshTokens(u, true);
      expect(tokens.auth).not.toBeNull();
      expect(tokens.refresh).not.toBeNull();

      await new User().Model.remove({ accountId: D.accountId });
    });

    test('expects valid auth/refresh tokens for existing users', async () => {
      const u = await new User.Model(D.newUserGood1);
      const refresh = await Auth.getNewRefreshToken(u._doc, reqUserAgent);
      u.devices[0].refreshToken = refresh.token;
      await u.save();

      // Object.assign({}, u._doc, { _id: 1, ip: '0.0.0.0', userAgent: 'PostmanRuntime/7.1.1' }
      const tokens = await Auth.refreshTokens(u._doc);
      expect(tokens.auth).not.toBeNull();
      expect(tokens.refresh).not.toBeNull();

      await new User().Model.remove({ accountId: D.accountId });
    });

    test(
      'expects null auth/refresh tokens for existing invalid users',
      async () => {
        await new User().Model.remove({ accountId: D.accountId });
        const u = await new User.Model(D.newUserGood1);
        await u.save();

        const tokens = await Auth.refreshTokens(u);
        // existing users without refresh token receive null tokens.
        expect(tokens.auth).toBeNull();
        expect(tokens.refresh).toBeNull();

        await new User().Model.remove({ accountId: D.accountId });
      },
    );
  });

  describe('getNewTokens', () => {
    test('expects valid auth/refresh tokens for new users', async () => {
      const newPayload = Object.assign({}, D.newUserGood1);

      const tokens = await Auth.getNewTokens(D.newUserGood1);
      expect(tokens.auth).not.toBeNull();
      expect(tokens.refresh).not.toBeNull();

      await new User().Model.remove({ accountId: D.accountId });
    });
  });

  describe('verifyToken', () => {
    test('verify valid auth token', async () => {
      const out = Auth.verifyToken(D.validAuthToken, c.AUTH);
      expect({ expired: out.expired, verified: out.verified })
        .toEqual({ expired: false, verified: true });

      const verified = Auth.verifyPayloadStructure(out.payload, c.AUTH);
      expect(verified).toBe(true);
    });

    test('verify valid refresh token', async () => {
      const out = Auth.verifyToken(D.validRefreshToken, c.REFRESH);
      expect({ expired: out.expired, verified: out.verified })
        .toEqual({ expired: false, verified: true });

      const verified = Auth.verifyPayloadStructure(out.payload, c.REFRESH);
      expect(verified).toBe(true);
    });

    test('verify expired auth token', async () => {
      const out = Auth.verifyToken(D.expiredAuthToken, c.AUTH);
      expect({ expired: out.expired, verified: out.verified })
        .toEqual({ expired: true, verified: true });

      const verified = Auth.verifyPayloadStructure(out.payload, c.AUTH);
      expect(verified).toBe(true);
    });

    test('verify expired refresh token', async () => {
      const out = Auth.verifyToken(D.expiredRefreshToken, c.REFRESH);
      expect({ expired: out.expired, verified: out.verified })
        .toEqual({ expired: true, verified: true });

      const verified = Auth.verifyPayloadStructure(out.payload, c.REFRESH);
      expect(verified).toBe(true);
    });

    test('verify invalid auth token', async () => {
      const out = Auth.verifyToken('1999222wdw22w', c.AUTH);

      expect({ expired: out.expired, verified: out.verified, payload: out.payload })
        .toEqual({ expired: false, verified: false, payload: null });

      const verified = Auth.verifyPayloadStructure(out.payload, c.AUTH);
      expect(verified).toBe(false);
    });

    test('verify invalid refresh token', async () => {
      const out = Auth.verifyToken('122212122wdw22w', c.REFRESH);

      expect({ expired: out.expired, verified: out.verified, payload: out.payload })
        .toEqual({ expired: false, verified: false, payload: null });

      const verified = Auth.verifyPayloadStructure(out.payload, c.REFRESH);
      expect(verified).toBe(false);
    });
  });

  describe('checkAuth', () => {
    test('returns a valid auth token from the header', async () => {
      const out = await Auth.checkAuth(D.validTokenHeader);
      const {
        header,
        expired,
        verified,
        payload,
        newToken,
      } = out;

      expect({ expired, verified }).toEqual({ expired: false, verified: true });
      expect(header).toBe(D.validAuthToken);
      const decoded = Auth.decodeToken(D.validAuthToken);
      expect(decoded).toEqual(payload);
      expect(newToken).toBeNull();
    });

    test('invalidates an expired token', async () => {
      const out = await Auth.checkAuth(D.expiredTokenHeader);
      const {
        header,
        expired,
        verified,
        payload,
        newToken,
      } = out;

      expect({ expired, verified }).toEqual({ expired: true, verified: true });
      expect(header).toBe(D.expiredAuthToken);
      const decoded = Auth.decodeToken(D.expiredAuthToken);
      expect(decoded).toEqual(payload);
      expect(newToken).toBeNull();
    });

    test('validates an expired token with a refresh token', async () => {
      let decoded = Auth.decodeToken(D.expiredAuthToken);
      const _id = crypto.getHashids().decodeHex(decoded.sub);

      await new User().Model.remove({ accountId: D.accountId });
      const u = await new User.Model(D.newUserGood1);
      u._id = _id;

      const refresh = await Auth.getNewRefreshToken(u._doc, reqUserAgent);

      u.devices[0].refreshToken = refresh.token;
      await u.save();

      delete u.devices[0].refreshToken;

      let out = await Auth.checkAuth(D.expiredTokenHeader);

      const {
        header,
        expired,
        verified,
        payload,
        newToken,
      } = out;

      // token should be verified, and not expired since the refresh token is used.
      expect({ expired, verified }).toEqual({ expired: false, verified: true });
      expect(header).toBe(D.expiredAuthToken);

      decoded = Auth.decodeToken(D.expiredAuthToken);
      const newTokenVerified = Auth.verifyPayloadStructure(decoded, c.AUTH);

      // payload structure should verify.
      expect(newTokenVerified).toBe(true);

      out = Auth.verifyToken(newToken, c.AUTH);

      expect({ expired: out.expired, verified: out.verified })
        .toEqual({ expired: false, verified: true });

      await new User().Model.remove({ accountId: D.accountId });
    });

    test('invalidates an invalid token', async () => {
      await new User().Model.remove({ accountId: D.accountId });

      const out = await Auth.checkAuth(D.invalidTokenHeader);

      const {
        header,
        expired,
        verified,
        payload,
        newToken,
      } = out;

      expect({ expired, verified }).toEqual({ expired: false, verified: false });
      expect(header).toBe(D.invalidAuthToken);
      const decoded = Auth.decodeToken(D.invalidAuthToken);
      expect(decoded).toEqual(payload);
      expect(newToken).toBeNull();
    });
    test('invalidates an empty token header', async () => {
      const out = await Auth.checkAuth();

      const {
        header,
        expired,
        verified,
        payload,
        newToken,
      } = out;

      expect({
        expired, verified, payload, newToken,
      })
        .toEqual({
          expired: null, verified: null, payload: null, newToken: null,
        });
      expect(header).toBe('');
    });
  });

  describe('auth', () => {
    // not implemented yet
  });

  describe('isAuthN', () => {
    it('auth payload for an authenticated (non-expired and verified) user', async () => {
      const auth = await Auth.isAuthN(D.validTokenHeader);
      expect(auth).toEqual(D.validAuthPayload);
    });

    it('false when not authenticated or verified', async () => {
      const auth = await Auth.isAuthN(D.invalidTokenHeader);
      expect(auth).toBe(false);
    });
  });

  describe('isAuthZ', () => {
    // not implemented yet
  });

  beforeAll(async () => {
    const conn = await mh.connect();
  });

  beforeEach(async () => {
    const accountId = D.accountInit();
    const account = await D.accountSetup();
    // const clear = await mh.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterEach(async () => {
    let removed = await User.Model.remove({ accountId: D.accountId });
    removed = await D.accountRemove();
    // const clear = await mh.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterAll(async () => {
    const conn = await mh.close();
  });
});
