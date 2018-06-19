/* eslint no-shadow: 0, no-unused-expressions:0, padded-blocks:0 */
import mongoose from 'mongoose';
import _ from 'lodash';

import UserBase from '../../../models/base/UserBase';
import UserSchema from '../../../models/schemas/UserSchema';

import Blacklist from '../../../models/Blacklist';
import BlacklistSchema from '../../../models/schemas/BlacklistSchema';

import m from '../../../models/consts/models';
import Auth from '../../../utils/Auth';
import log from '../../../utils/logger';
import h, { statusObject, errorObject } from '../../../utils/helper';
import crypto from '../../../utils/crypto';
import c from '../../../config/consts';
import sc from '../../../config/statusCodes';
import ec from '../../../config/errorCodes';
import mh from '../../utils/mongooseHelper';
import D from '../../data/Data';

require('../../utils/unitTestSetupHelper');

describe('UserBase model CRUD and helper methods', async () => {
  describe('create a user', async () => {
    test('should create a user with all required fields', async () => {
      const u = await new UserBase().Model(D.newUserGood1).save();
      const doc = await UserBase.Model.find({ accountId: D.accountId }).lean();
      expect(doc).toHaveLength(1);
    });

    test('should not allow a user without required fields', async () => {
      let u = new UserBase.Model(D.newUserGood1);
      u.password = undefined;
      await mh.checkModelValidateError('`password` is required', u);

      u = new UserBase.Model(D.newUserGood1);
      u.contacts[0].email = undefined;
      await mh.checkModelValidateError('`email` is required', u);

      u = new UserBase.Model(D.newUserGood1);
      u.type = undefined;
      await mh.checkModelValidateError('`type` is required', u);

      u = new UserBase.Model(D.newUserGood1);
      u.contacts = undefined;
      await mh.checkModelValidateError('`contacts` is required', u);
    }, 10000);

    test('should not allow duplicate unique fields', async () => {
      const u1 = new UserBase.Model(D.newUserGood1);
      const u2 = new UserBase.Model(D.newUserGood1);
      await mh.checkModelSaveError('E11000 duplicate key error collection', u1, u2);
    });

    test('should find all users', async () => {
      await new UserBase.Model(D.newUserGood1).save();
      await new UserBase.Model(D.newUserGood2).save();
      await new UserBase.Model(D.newUserGood3).save();

      const doc = await UserBase.Model.find({ accountId: D.accountId }).lean();
      expect(doc).toHaveLength(3);
    });

    test('should update a user', async () => {
      expect(UserSchema.obj.contacts.type[0].firstName).toBeDefined();
      const u = await new UserBase.Model(D.newUserGood1);

      u.contacts[0].firstName = u.contacts[0].firstName.toUpperCase();
      const save = await u.save();

      const doc = await UserBase.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      expect(doc.contacts[0].firstName).toBe(u.contacts[0].firstName);
    });

    test('should offline a user', async () => {
      // make sure the property exist on the schema or it will fake update...
      expect(UserSchema.obj[c.OFFLINE]).toBeDefined();

      const u = await new UserBase.Model(D.newUserGood1).save();
      await mh.checkUpdatedDocProperty(u, UserBase.Model, c.OFFLINE);
    });

    test('should disable a user', async () => {
      // make sure the property exist on the schema or it will fake update...
      expect(UserSchema.obj[c.DISABLED]).toBeDefined();

      const u = await new UserBase.Model(D.newUserGood1).save();

      await mh.checkUpdatedDocProperty(u, UserBase.Model, c.DISABLED);
    });

    test('should soft delete a user', async () => {
      // make sure the property exist on the schema or it will fake update...
      expect(UserSchema.obj[c.SOFT_DELETE]).toBeDefined();

      const u = await new UserBase.Model(D.newUserGood1).save();

      await mh.checkUpdatedDocProperty(u, UserBase.Model, c.SOFT_DELETE);
    });

    test('should delete a user', async () => {
      const u1 = await new UserBase.Model(D.newUserGood1).save();
      const u2 = await new UserBase.Model(D.newUserGood2).save();

      expect(await UserBase.Model.count({ accountId: D.accountId })).toBe(2);

      const doc = await UserBase.Model.findOneAndRemove({
        _id: u1._id,
      });

      expect(doc.id).toBe(u1.id);
      expect(await UserBase.Model.count({ accountId: D.accountId })).toBe(1);
    });
  });

  describe('User Class Structure', () => {
    test('an instance should have a mongoose model', async () => {
      expect(UserBase.Model).toEqual(mongoose.models[m.user]);
    });

    test('a static model call should have a mongoose model', async () => {
      expect(UserBase.Model).toEqual(mongoose.models[m.user]);
    });
  });

  describe('User Model Methods', () => {
    describe('hasRequired', () => {
      test('returns true with correct fields', async () => {
        const u = new UserBase();
        expect(u.hasRequired(D.signupValidFields, D.reqSignupFieldsArray)).toBe(true);
      });

      test('hasRequired returns false with incorrect fields', async () => {
        const u = new UserBase();
        const fields = Object.assign({}, D.signupValidFields);
        delete fields.username;
        expect(u.hasRequired(fields, D.reqSignupFieldsArray)).toBe(false);
        fields.username = D.signupValidFields.username;
        delete fields.password;
        expect(u.hasRequired(fields, D.reqSignupFieldsArray)).toBe(false);
        fields.password = D.signupValidFields.password;
        delete fields.firstName;
        expect(u.hasRequired(fields, D.reqSignupFieldsArray)).toBe(false);
        fields.firstName = D.signupValidFields.firstName;
        delete fields.lastName;
        expect(u.hasRequired(fields, D.reqSignupFieldsArray)).toBe(false);
      });
    });

    describe('validateRequiredFields', async () => {
      test('returns true with valid required fields', async () => {
        const u = new UserBase();
        expect(u.validateRequiredFields(D.signupValidFields).valid).toBe(true);
      });

      test('returns errors without valid required fields', async () => {
        const u = new UserBase();
        const fields = Object.assign({}, D.signupInvalidFields);

        let out = u.validateRequiredFields(fields);
        expect(out.errors[0].error.type).toBe('email');

        delete fields.email;
        out = u.validateRequiredFields(fields);
        expect(out.errors[0].error.type).toBe('username');

        delete fields.username;
        out = u.validateRequiredFields(fields);
        expect(out.errors[0].error.type).toBe('password');
      });

      test('returns error with empty field object', async () => {
        const u = new UserBase();
        const out = u.validateRequiredFields();
        expect(out.errors[0].error).toEqual({ type: 'empty fields object', msg: 'empty fields object' });
      });
    });

    describe('checkForRequiredFieldsNotInUse', async () => {
      test('returns null when an email or username not passed', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        await new UserBase.Model(D.newUserGood2).save();

        const u = new UserBase();
        let out = await u.checkForRequiredFieldsNotInUse(D.newUserGood1.accountId);
        expect(out).toBeNull();

        out = await u.checkForRequiredFieldsNotInUse(D.newUserGood1.accountId, { email: 'billy3@someone.com' });
        expect(out).toBeNull();

        out = await u.checkForRequiredFieldsNotInUse(D.newUserGood1.accountId, { username: 'bounty3' });
        expect(out).toBeNull();
      });

      test('doesn\'t allow reusing email or username', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        await new UserBase.Model(D.newUserGood2).save();

        const users = await UserBase.Model.find({ accountId: D.accountId }).lean();

        const u = new UserBase();
        const username1 = D.newUserGood1.username;
        const email2 = D.newUserGood2.contacts[0].email;
        let out = await u.checkForRequiredFieldsNotInUse(
          D.newUserGood1.accountId,
          { email: email2, username: 'fakeGoodUser1' },
        );

        expect(out.errors[0].error.msg).toBe(`that email '${email2}' is already taken.`);

        out = await u.checkForRequiredFieldsNotInUse(
          D.newUserGood1.accountId,
          { email: email2, username: username1 },
        );
        const shouldBe = [
          { error: { msg: `that email '${email2}' is already taken.` } },
          { error: { msg: `that username '${username1}' is already taken.` } },
        ];

        expect(out.status).toBe(400);
        expect(out.errors).toEqual(shouldBe);

        out = await u.checkForRequiredFieldsNotInUse(
          D.newUserGood1.accountId,
          { email: 'email@email.com', username: username1 },
        );
        expect(out.errors[0].error.msg).toBe(`that username '${username1}' is already taken.`);
      });

      test('returns true when fields not in use', async () => {
        await new UserBase.Model(D.newUserGood1).save();

        const u = new UserBase();
        let out = await u.checkForRequiredFieldsNotInUse(
          D.newUserGood1.accountId,
          { email: 'email@email.com', username: 'fakeGoodUser1' },
        );
        expect(out).toBe(true);

        out = await u.checkForRequiredFieldsNotInUse(D.newUserGood1.account);
        expect(out).toBeNull();
      });

      test('returns null when null or empty values are passed', async () => {
        // TODO: need to re-look at this.
        await new UserBase.Model(D.newUserGood1).save();
        await new UserBase.Model(D.newUserGood2).save();

        const u = new UserBase();
        let out = await u.checkForRequiredFieldsNotInUse(
          D.newUserGood1.accountId,
          { email: null, username: null },
        );
        expect(out).toBeNull();

        out = await u.checkForRequiredFieldsNotInUse(D.newUserGood1.account);
        expect(out).toBeNull();
      });
    });

    describe('getAuthedUserDetails', async () => {
      test('reject unauthenticated user', async () => {
        const expected = {
          valid: false,
          error: sc.NOT_AUTHENTICATED,
        };

        const u = new UserBase();
        const actual = await u.getAuthedUserDetails({});
        expect(actual).toEqual(expected);
      });

      test('reject invalid user', async () => {
        const expected = {
          valid: false,
          error: sc.NOT_AUTHENTICATED,
        };

        const u = new UserBase();
        const actual = await u.getAuthedUserDetails(D.invalidTokenHeader);
        expect(actual).toEqual(expected);
      });

      test('return authed user details from auth token', async () => {
        const u = new UserBase();
        const validAuth = Object.assign({}, D.validTokenHeader);
        const auth = await Auth.checkAuth(D.validTokenHeader);
        validAuth.auth = auth;
        const actual = await u.getAuthedUserDetails(validAuth);

        expect(actual.valid).toBe(true);
        expect(actual.auth).toEqual(auth);
      });

      test('return authed user details from database', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const u = new UserBase();
        const validAuth = Object.assign({}, D.validTokenHeader);
        const auth = await Auth.checkAuth(D.validTokenHeader);
        validAuth.auth = auth;
        const actual = await u.getAuthedUserDetails(validAuth, c.REFRESH_FROM_DB);
        // log.dir(actual);
        expect(actual.valid).toBe(true);
        expect(actual.auth).toEqual(auth);
      });

      test('return authed user details from database (lean document)', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const u = new UserBase();
        const validAuth = Object.assign({}, D.validTokenHeader);
        const auth = await Auth.checkAuth(D.validTokenHeader);
        validAuth.auth = auth;
        const actual = await u.getAuthedUserDetails(validAuth, c.REFRESH_FROM_DB, c.LEAN);
        expect(actual.valid).toBe(true);
        expect(actual.auth).toEqual(auth);
      });
    });

    describe('getFreshAuthedUserDetails', () => {
      test('reject unauthenticated user', async () => {
        const expected = {
          valid: false,
          error: sc.NOT_AUTHENTICATED,
        };

        const u = new UserBase();
        const actual = await u.getFreshAuthedUserDetails({});
        expect(actual).toEqual(expected);
      });

      test('reject invalid token header', async () => {
        const expected = {
          valid: false,
          error: sc.NOT_AUTHENTICATED,
        };

        const u = new UserBase();
        const actual = await u.getFreshAuthedUserDetails(D.invalidTokenHeader);
        expect(actual).toEqual(expected);
      });

      test('reject invalid user', async () => {
        let user = await new UserBase.Model(D.newUserGood1);
        user.softDelete = true;
        const saved = await user.save();
        user = await UserBase.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });

        const u = new UserBase();
        const validAuth = Object.assign({}, D.validTokenHeader);
        const auth = await Auth.checkAuth(D.validTokenHeader);
        validAuth.auth = auth;
        const actual = await u.getFreshAuthedUserDetails(validAuth);
        expect(actual.valid).toBe(false);
        expect(actual.error).toEqual(sc.INVALID_USER);
      });

      test('return fresh authed user details from auth token', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const u = new UserBase();
        const validAuth = Object.assign({}, D.validTokenHeader);
        const auth = await Auth.checkAuth(D.validTokenHeader);
        validAuth.auth = auth;
        const actual = await u.getFreshAuthedUserDetails(validAuth);
        expect(actual.valid).toBe(true);
        expect(actual.auth).toEqual(auth);
      });

      test('return fresh authed user details (lean document)', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const u = new UserBase();
        const validAuth = Object.assign({}, D.validTokenHeader);
        const auth = await Auth.checkAuth(D.validTokenHeader);
        validAuth.auth = auth;
        const actual = await u.getFreshAuthedUserDetails(validAuth, c.LEAN);
        expect(actual.valid).toBe(true);
        expect(actual.auth).toEqual(auth);
      });
    });

    describe('updateUserDeviceDocument', async () => {
      test('update DB doc of user device sub document (whole object)', async () => {
        let user = await new UserBase.Model(D.newUserGood1).save();
        const refreshToken = D.validRefreshToken;

        const device = {
          deviceId: D.newUserGood1.devices[0].deviceId,
          name: 'DEVICE 1',
          type: c.DESKTOP,
          ip: '1.1.1.1',
          userAgent: 'TESTING AGAIN',
          activated: false,
          refreshToken,
          loginAttempts: undefined,
        };

        const u = new UserBase();
        await u.updateUserDeviceDocument(user.accountId, user.userId, device);
        user = await UserBase.Model.findOne({ accountId: D.accountId, userId: user.userId }).lean();
        delete device.loginAttempts;
        expect(device).toEqual(user.devices[0]);

      });

      test('update DB doc of user profile device sub document (whole object) and clear refresh token', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const refreshToken = D.validRefreshToken;

        let user = await UserBase.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
        const d1 = Object.assign({ refreshToken }, D.newUserGood1.devices[0]);

        const device = {
          deviceId: d1.deviceId,
          name: 'DEVICE 1',
          type: c.DESKTOP,
          ip: '1.1.1.1',
          userAgent: 'TESTING AGAIN',
          activated: false,
          refreshToken,
        };

        const u = new UserBase();
        const update = await u.updateUserDeviceDocument(user.accountId, user.userId, device, c.CLEAR_REFRESH_TOKEN);
        delete device.refreshToken;
        user = await UserBase.Model.findOne({ accountId: D.accountId, userId: user.userId }).lean();
        expect(device).toEqual(user.devices[0]);
      });
    });

    describe('updateUserDeviceInfo', async () => {
      test('refresh a devices object settings and tokens', async () => {
        await new UserBase.Model(D.newUserGood1).save();

        const refreshToken = D.validRefreshToken;

        const user = await UserBase.Model.findValidUser({ accountId: D.accountId, userId: D.newUserGood1.userId }, c.LEAN);
        const sourceDevice = Object.assign({ refreshToken }, D.newUserGood1.devices[0]);
        const device = Object.assign({}, sourceDevice);

        const u = new UserBase();
        const out = await u.updateUserDeviceInfo(D.validTokenHeader, user, device);

        expect(out.tokens.refresh.token).not.toBe(refreshToken);
        expect(out.tokens.refresh.token).toBe(out.device.refreshToken);
        expect(out.device.lockedUntil).toBeUndefined();
        expect(out.device.loginAttempts).toBeUndefined();
        expect(typeof out.device.lastLoginTime).toBe(c.NUMBER);
      });

      test('refresh a devices object settings and tokens and clear refresh token', async () => {
        await new UserBase.Model(D.newUserGood1).save();

        const refreshToken = D.validRefreshToken;

        const user = await UserBase.Model.findValidUser({ accountId: D.accountId, userId: D.newUserGood1.userId }, c.LEAN);
        const sourceDevice = Object.assign({ refreshToken }, D.newUserGood1.devices[0]);
        const device = Object.assign({}, sourceDevice);

        const u = new UserBase();
        const out = await u.updateUserDeviceInfo(D.validTokenHeader, user, device, c.CLEAR_REFRESH_TOKEN);

        expect(out.tokens.refresh.token).not.toBe(refreshToken);
        expect(out.device.refreshToken).toBeUndefined();
        expect(out.device.lockedUntil).toBeUndefined();
        expect(out.device.loginAttempts).toBeUndefined();
        expect(typeof out.device.lastLoginTime).toBe(c.NUMBER);
      });
    });

    describe('isUserLocked', () => {
      test('returns lockedUntil time for a user device', async () => {

        const device = {
          lockedUntil: Date.now(),
        };

        const u = new UserBase();
        expect(await u.isUserLocked(device)).toBe(false);

        device.lockedUntil = Date.now() * 2;
        expect(await u.isUserLocked(device)).toBe(true);
      });
    });

    describe('getSecureUserData', async () => {
      test('returns user data without security info', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const refreshToken = D.validRefreshToken;

        let user = await UserBase.Model.findValidUser({ accountId: D.accountId, userId: D.newUserGood1.userId }, c.LEAN);
        const sourceDevice = Object.assign({ refreshToken }, D.newUserGood1.devices[0]);
        const device = Object.assign({}, sourceDevice);
        device.loginAttempts = undefined;

        expect(device).toEqual(sourceDevice);

        const u = new UserBase();
        const update = await u.updateUserDeviceDocument(user.accountId, user.userId, device);
        user = await UserBase.Model.findValidUser({ accountId: D.accountId, userId: user.userId }, c.LEAN);

        expect(user.devices[0].refreshToken).toBe(refreshToken);

        const data = await u.getSecureUserData(user);

        expect(data.password).toBeUndefined();
        expect(data.devices[0].refreshToken).toBeUndefined();
      });

      test('rejects an invalid user', async () => {
        await new UserBase.Model(D.newUserGood1).save();
        const refreshToken = D.validRefreshToken;

        let user = await UserBase.Model.findValidUser({ accountId: D.accountId, userId: D.newUserGood1.userId }, c.LEAN);
        const sourceDevice = Object.assign({ refreshToken }, D.newUserGood1.devices[0]);
        const device = Object.assign({}, sourceDevice);
        device.loginAttempts = undefined;

        expect(device).toEqual(sourceDevice);

        const u = new UserBase();
        const update = await u.updateUserDeviceDocument(user.accountId, user.userId, device);
        user = await UserBase.Model.findValidUser({ accountId: D.accountId, userId: user.userId });
        user.softDelete = true;
        await user.save();

        expect(user.devices[0].refreshToken).toBe(refreshToken);

        const data = await u.getSecureUserData(user);

        data.devices.forEach((device) => {
          expect(device.refreshToken).toBeUndefined();
        });
      });
    });

    describe('isAuthN', async () => {
      test('returns false if user is not authed', async () => {
        const auth = await Auth.checkAuth({});
        const u = new UserBase();
        let authed = await u.isAuthN({ auth });
        expect(authed).toBe(false);

        authed = await u.isAuthN();
        expect(authed).toBe(false);

        authed = await u.isAuthN({});
        expect(authed).toBe(false);
      });

      test('returns false if user auth has expired', async () => {
        const auth = {
          expired: true,
          verified: true,
        };

        const u = new UserBase();
        const authed = await u.isAuthN({ auth });
        expect(authed).toBe(false);
      });

      test('returns false if user auth is not verified', async () => {
        const auth = {
          expired: false,
          verified: false,
        };

        const u = new UserBase();
        const authed = await u.isAuthN({ auth });
        expect(authed).toBe(false);
      });

      test('returns true if user is authed, not expired and verified', async () => {
        const auth = await Auth.checkAuth(D.validTokenHeader);
        const u = new UserBase();
        const authed = await u.isAuthN({ auth });
        expect(authed).toBe(true);
      }, 10000);
    });

    describe('isAuthZ', async () => {
      test.skip('returns not authorized if user role not set on request auth data', async () => {
        // TODO: not implemented yet.
      });

      test.skip('returns unauthenticated status if user is not authenticated', async () => {
        // TODO: not implemented yet.
      });

      test.skip('returns true if user role is set on authentication request auth data', async () => {
        // TODO: not implemented yet.
      });
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
    let removed = await UserBase.Model.remove({ accountId: D.accountId });
    removed = await D.accountRemove();
    // const clear = await mh.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterAll(async () => {
    const conn = await mh.close();
  });
});
