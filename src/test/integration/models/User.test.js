/* eslint no-shadow: 0, no-unused-expressions:0, padded-blocks:0 */
import _ from 'lodash';
import mongoose from 'mongoose';
import mh from '../../utils/mongooseHelper';
import Account from '../../../../src/models/Account';
import User from '../../../../src/models/User';
import UserSchema from '../../../../src/models/schemas/UserSchema';
import Blacklist from '../../../../src/models/Blacklist';
import BlacklistSchema from '../../../../src/models/schemas/BlacklistSchema';
import h, { statusObject, errorObject } from '../../../../src/utils/helper';
import m from '../../../../src/models/consts/models';
import Auth from '../../../../src/utils/Auth';
import log from '../../../../src/utils/logger';
import crypto from '../../../../src/utils/crypto';
import c from '../../../../src/config/consts';
import sc from '../../../../src/config/statusCodes';
import D from '../../data/Data';
import th, { expectErrorOutput, expectGoodOutput } from '../../utils/testHelper';

require('../../utils/unitTestSetupHelper');

describe('User model routes', () => {

  describe('signup', () => {
    test('cannot signup with authn token in header', async () => {
      const req = {
        headers: {
          authorization: 'Bearer 11gsjsjSwWeew2',
        },
      };

      expectErrorOutput(await new User().signup(req), sc.ALREADY_AUTHENTICATED);
    });

    test('should signup with a valid req.body', async () => {
      const u = new User();
      const req = {
        body: Object.assign({}, D.signupValidFields),
      };

      const out = await new User().signup(req);
      expectGoodOutput(out, sc.SIGNUP_COMPLETE);
    });

    test('should not signup with an invalid req.body', async () => {
      const req = {
        body: Object.assign({}, D.signupInvalidFields),
      };

      const out = await new User().signup(req);

      expect(out.status).toBe(sc.FIELD_VALIDATION_ERRORS.status);
      expect(out.errors).toHaveLength(3);
    });

    test('should signup with correct document fields.', async () => {
      const req = {
        body: Object.assign({}, D.signupValidFields),
      };

      const out = await new User().signup(req);
      const doc = await User.Model.findOne({ accountId: D.accountId, username: D.signupValidFields.username });

      // TODO: write a method to verify the signup signature.
      // nothing else gets in there put what is supposed to be in there.
      // this will allow precise validation for methods and data afterwards.
      // some models don't need this, but for the most part it will prevent extra mess and bugs.

      expect(out.status).toBe(sc.SIGNUP_COMPLETE.status);
    });

    test('should error with an invalid req.body', async () => {
      const u = new User();

      const req = {
        body: {},
      };

      expectErrorOutput(await u.signup(), sc.NEED_ALL_REQUIRED_FIELDS);
      expectErrorOutput(await u.signup(req), sc.NEED_ALL_REQUIRED_FIELDS);

      req.body = Object.assign({}, D.signupInvalidFields);
      const out = await u.signup(req);
      expect(out.status).toBe(sc.FIELD_VALIDATION_ERRORS.status);
      expect(out.errors).toHaveLength(3);
      expect(out.errors[0].error.type).toBe('email');
      expect(out.errors[1].error.type).toBe('username');
      expect(out.errors[2].error.type).toBe('password');
    });

    test('should not allow profanity', async () => {
      const u = new User();
      const req = {
        body: D.signupInvalidProfanity,
      };

      await u.signup(req);

      req.body.username = D.signupValidFields.username;

      let out = await u.signup(req);
      expectErrorOutput(out, sc.PROFANITY_REJECT_NAME);

      req.body.firstName = D.signupValidFields.firstName;
      out = await u.signup(req);
      expectErrorOutput(out, sc.PROFANITY_REJECT_NAME);

      req.body.lastName = D.signupValidFields.lastName;
      out = await u.signup(req);
      expectGoodOutput(out, sc.SIGNUP_COMPLETE);
    });

    test('do not allow blacklisted username, email, or password', async () => {
      const list = [
        D.blacklistedPassword,
        D.blacklistedEmail,
        D.blacklistedUsername,
      ];

      await Blacklist.Model.remove({ accountId: D.accountId });
      await Blacklist.Model.insertMany(list);

      expect(await Blacklist.Model.count({ accountId: D.accountId })).toBe(3);

      const req = {
        body: Object.assign({}, D.signupValidFields),
      };

      req.body.password = D.blacklistedPassword.value;
      req.body.email = D.blacklistedEmail.value;
      req.body.username = D.blacklistedUsername.value;

      const blsted = await new User().signup(req);
      expect(blsted.errors).toHaveLength(3);
      expect(blsted.errors[0].error.msg).toBe('that email is not available');
      expect(blsted.errors[1].error.msg).toBe('that password is not available');
      expect(blsted.errors[2].error.msg).toBe('that username is not available');

      await Blacklist.Model.remove({ accountId: D.accountId });
    });
  });

  describe('login', () => {
    test(
      'should have logged in status with valid username/email, password, and account',
      async () => {
        const u1 = await th.insertNewValidUser();

        const req = {
          body: {
            username: D.newUserGood1.username,
            password: D.newUserGood1.password,
            accountId: D.newUserGood1.accountId, // accountId is in the db, account is frontend param
          },
        };

        const u = new User();
        let out = await u.login(req);
        expect(out).toHaveProperty('status', sc.SUCCESSFUL_LOGIN.status);
        expect(Auth.decodeToken(out.data.auth.token)).toEqual(out.data.auth.payload);

        out = await User.Model.findOne({ accountId: D.accountId, username: D.newUserGood1.username }).lean();

        expect(out.devices[0].loginAttempts).toBeUndefined();
        expect(out.devices[0].lastLoginAttemptTime).toBeDefined();
        expect(out.devices[0].lockUntil).toBeUndefined();

        await User.Model.remove({ accountId: D.accountId });
        await th.insertNewValidUser();
        req.body.username = D.newUserGood1.contacts[0].email;

        out = await u.login(req);
        expectGoodOutput(out, sc.SUCCESSFUL_LOGIN, out.data);
        expect(Auth.decodeToken(out.data.auth.token)).toEqual(out.data.auth.payload);
      },
    );

    test('can\'t login if username or email does not exist', async () => {
      const req = {
        body: {
          username: D.newUserGood1.username,
          password: 'Fake!Pass#123',
          accountId: D.newUserGood1.accountId, // accountId is in the db, account is frontend param
        },
      };

      const u = new User();
      expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);

      req.body.username = D.newUserGood1.contacts[0].email;

      expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);
    });

    test('an invalid user cannot login', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      u1.softDeleted = true;
      let save = await u1.save();

      const req = {
        body: {
          username: D.newUserGood1.contacts[0].email,
          password: 'Fake!Pass#123',
          accountId: D.newUserGood1.accountId, // accountId is in the db, account is frontend param
        },
      };

      const u = new User();
      const out = await u.login(req);
      expectErrorOutput(out, sc.INVALID_AUTH_CREDENTIALS);

      u1.softDeleted = undefined;
      u1.archived = true;
      save = await u1.save();

      expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);
    });

    test('a disabled user cannot login', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      u1.disabled = true;
      await u1.save();

      const req = {
        body: {
          username: D.newUserGood1.contacts[0].email,
          password: 'Fake!Pass#123',
          accountId: D.newUserGood1.accountId, // accountId is in the db, account is frontend param
        },
      };

      expectErrorOutput(await new User().login(req), sc.DISABLED_ACCOUNT);
    });

    test(
      'should have increment login count on unsuccessful login attempt',
      async () => {
        const u1 = await new User.Model(D.newUserGood1);
        const { hash } = await crypto.hashPassword(D.newUserGood1.password);
        u1.password = hash;
        const save = await u1.save();

        const req = {
          body: {
            username: D.newUserGood1.username,
            password: 'Fake!Pass#123',
            accountId: D.newUserGood1.accountId, // accountId is in the db, account is frontend param
          },
        };

        const u = new User();
        expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);
        let found = await User.Model.findOne({ accountId: D.accountId, username: D.newUserGood1.username });
        expect(found.devices[0].loginAttempts).toBe(1);
        expect(typeof found.devices[0].lastLoginAttemptTime).toBe(c.NUMBER);

        expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);
        found = await User.Model.findOne({ accountId: D.accountId, username: D.newUserGood1.username });

        expect(found.devices[0].loginAttempts).toBe(2);
        expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);

        found = await User.Model.findOne({ accountId: D.accountId, username: D.newUserGood1.username });
        expect(found.devices[0].loginAttempts).toBe(3);

        expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);
        found = await User.Model.findOne({ accountId: D.accountId, username: D.newUserGood1.username });

        expect(found.devices[0].loginAttempts).toBe(c.MAX_LOGIN_ATTEMPTS);
        expectErrorOutput(await u.login(req), sc.ACCOUNT_NOW_LOCKED);
      },
    );

    test(
      'should lock account after c.MAX_LOGIN_ATTEMPTS unsuccessful logins',
      async () => {
        const u1 = await new User.Model(D.newUserGood1);
        const { hash } = await crypto.hashPassword(D.newUserGood1.password);
        u1.password = hash;
        u1.devices[0].loginAttempts = c.MAX_LOGIN_ATTEMPTS;
        const save = await u1.save();

        const req = {
          body: {
            username: D.newUserGood1.username,
            password: 'FAKE!Pass#123',
            accountId: D.newUserGood1.accountId, // accountId is in the db, account is frontend param
          },
        };

        expectErrorOutput(await new User().login(req), sc.ACCOUNT_NOW_LOCKED);
        const found = await User.Model.findOne({ accountId: D.accountId, username: D.newUserGood1.username });
        expect(found.devices[0].loginAttempts).toBe(c.MAX_LOGIN_ATTEMPTS);
      },
    );

    test('should not allow invalid parameters', async () => {
      await new User.Model(D.newUserGood1).save();

      const u = new User();
      expectErrorOutput(await u.login(), sc.INVALID_AUTH_CREDENTIALS);

      const req = {
        body: {
          username: D.newUserGood1.username,
          password: D.newUserGood1.password,
        },
      };

      expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);

      delete req.username;
      req.account = D.newUserGood1.accountId; // remember that account param translates into accountId

      expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);

      delete req.password;
      req.username = D.newUserGood1.username;

      expectErrorOutput(await u.login(req), sc.INVALID_AUTH_CREDENTIALS);
    });

    test('should not allow login without an account parameter', async () => {
      await new User.Model(D.newUserGood1).save();

      const req = {
        body: {
          username: D.newUserGood1.username,
          password: D.newUserGood1.password,
        },
      };

      expectErrorOutput(await new User().login(req), sc.INVALID_AUTH_CREDENTIALS);
    });

    test(
      'should allow with valid credentials (username, password, account)',
      async () => {
        const u = new User();

        let req = {
          body: Object.assign({}, D.signupValidFields),
        };

        await u.signup(req);

        req = {
          body: {
            username: D.signupValidFields.username,
            password: D.signupValidFields.password,
            accountId: D.signupValidFields.accountId,
          },
          headers: {
            'user-agent': 'TESTING',
          },
        };

        const out = await u.login(req);
        expect(out.status).toBe(sc.SUCCESSFUL_LOGIN.status);
        expect(Object.keys(out.data.auth)).toEqual(['token', 'payload']);
        expect(Auth.decodeToken(out.data.auth.token))
          .toEqual(out.data.auth.payload);
      },
    );

    test('turns rememberLoggedIn on', async () => {
      let req = {
        body: Object.assign({}, D.signupValidFields),
        headers: {
          'user-agent': 'TESTING',
        },
      };
      const u = new User();
      await u.signup(req);

      req = {
        body: {
          username: D.signupValidFields.username,
          password: D.signupValidFields.password,
          accountId: D.signupValidFields.accountId,
          rememberLoggedIn: true,
        },
      };

      let out = await u.login(req);
      expect(out.status).toBe(sc.SUCCESSFUL_LOGIN.status);
      expect(out.data.auth.payload.data.rememberLoggedIn).toBe(true);

      out = await User.Model.findOne({ accountId: D.accountId, username: req.body.username });
      expect(out.rememberLoggedIn).toBe(out.rememberLoggedIn);

    });

    test('turns rememberLoggedIn off', async () => {
      let req = {
        body: Object.assign({}, D.signupValidFields),
        headers: {
          'user-agent': 'TESTING',
        },
      };
      const u = new User();
      await u.signup(req);

      // not passing rememberLoggedIn will disable it in the db and token.
      req = {
        body: {
          username: D.signupValidFields.username,
          password: D.signupValidFields.password,
          accountId: D.signupValidFields.accountId,
        },
      };

      let out = await u.login(req);
      expect(out.status).toBe(sc.SUCCESSFUL_LOGIN.status);
      expect(out.data.auth.payload.data.rememberLoggedIn).toBe(false);

      // now rememberLoggedIn must be tested with false.
      req.body.rememberLoggedIn = false;

      out = await u.login(req);
      expect(out.status).toBe(sc.SUCCESSFUL_LOGIN.status);
      expect(out.data.auth.payload.data.rememberLoggedIn).toBe(false);

      out = await User.Model.findOne({ accountId: D.accountId, username: req.body.username });
      expect(out.rememberLoggedIn).toBe(out.rememberLoggedIn);

    });

    test('rememberedLoggedIn must be a boolean', async () => {
      let req = {
        body: Object.assign({}, D.signupValidFields),
        headers: {
          'user-agent': 'TESTING',
        },
      };
      const u = new User();
      await u.signup(req);

      // not passing rememberLoggedIn will disable it in the db and token.
      req = {
        body: {
          username: D.signupValidFields.username,
          password: D.signupValidFields.password,
          accountId: D.signupValidFields.accountId,
          rememberLoggedIn: 'aaaa',
        },
      };

      const out = await u.login(req);
      expect(out.status).toBe(sc.REMEMBERED_LOGGED_IN_INVALID.status);
      expect(out.errors[0].error.msg).toBe(sc.REMEMBERED_LOGGED_IN_INVALID.msg);

    });

    test('do not allow non-login related fields in the req.body', async () => {
      let req = {
        body: Object.assign({}, D.signupValidFields),
        headers: {
          'user-agent': 'TESTING',
        },
      };

      const u = new User();
      await u.signup(req);

      // not passing rememberLoggedIn will disable it in the db and token.
      req = {
        body: {
          username: D.signupValidFields.username,
          password: D.signupValidFields.password,
          accountId: D.accountId,
          rememberLoggedIn: true,
          titan1: 'NOT VALID',
        },
      };

      const out = await u.login(req);
      expect(out.status).toBe(sc.NO_EXTRA_FIELDS.status);
      expect(out.errors[0].error.msg).toBe(sc.NO_EXTRA_FIELDS.msg);
    });
  });

  describe('logout', () => {
    test('successful logout with valid auth token and user', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const u = await new User();
      const out = await u.logout(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESSFUL_LOGOUT));
    });

    test('reject logout of an invalid user', async () => {
      const req = {
        headers: {
          authorization: 'Bearer 11gsjsjSwWeew2',
        },
      };

      const u = new User();
      expectErrorOutput(await u.logout(req), sc.NOT_AUTHENTICATED);

      req.headers.authorization = `Bearer ${D.invalidUserAuthToken}`;

      expectErrorOutput(await u.logout(req), sc.NOT_AUTHENTICATED);

      req.headers = [];
      expectErrorOutput(await u.logout(req), sc.NOT_AUTHENTICATED);

      const validAuth = await th.getInvalidAuthUser();
      expectErrorOutput(await u.logout(validAuth), sc.INVALID_USER);
    });
  });

  describe('account', () => {
    // TODO: todo with authz.
  });

  describe('myAccount', async () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('myAccount');
    });

    test('returns the user data for an authenticated user', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const authed = await new User().myAccount(validAuth);

      const expected = {
        accountId: D.accountId,
        agreementVersion: 1,
        displayName: 'billy bear',
        email: 'billy1@someone.com',
        firstName: 'billy',
        lastName: 'bear',
        rememberLoggedIn: false,
        username: 'bounty1',
      };

      const actual = {
        accountId: authed.accountId,
        agreementVersion: authed.data.agreementVersion,
        displayName: authed.data.displayName,
        email: authed.data.email,
        firstName: authed.data.firstName,
        lastName: authed.data.lastName,
        rememberLoggedIn: authed.data.rememberLoggedIn,
        username: authed.data.username,
      };
    });
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
