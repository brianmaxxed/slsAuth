/* eslint no-shadow: 0, no-unused-expressions:0, padded-blocks:0 */
import _ from 'lodash';
import mongoose from 'mongoose';

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
import mh from '../../utils/mongooseHelper';
import D from '../../data/Data';
import th, { expectErrorOutput, expectGoodOutput } from '../../utils/testHelper';

require('../../utils/unitTestSetupHelper');

describe('User model CRUD', () => {
  describe('resendPassword', () => {
    test('resend password for valid email or username via email', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const { payload } = validAuth.auth;
      validAuth.params = {
        accountId: D.accountId,
        username: payload.data.username,
      };

      const u = await new User();
      const out = await u.resendPassword(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESS));
    });

    test('reject invalid email and username', async () => {
      let out = await th.testForInvalidUserFields('resendPassword', ['accountId', 'username']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });

      out = await th.testForInvalidUserFields('resendPassword', ['accountId', 'email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('resetPassword', () => {
    test('reset password for valid email or username and send via email', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = {
        accountId: D.accountId,
        username: D.newUserGood1.username,
      };

      const u = await new User();
      let out = await u.resetPassword(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESSFUL_UPDATE));

      validAuth.params = {
        accountId: D.accountId,
        email: D.newUserGood1.contacts[0].email,
      };

      out = await u.resetPassword(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESSFUL_UPDATE));
    });

    test('reject invalid email and username', async () => {
      const out = await th.testForInvalidUserFields('resendPassword', ['accountId', 'username', 'email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('updatePassword', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('updatePassword');
    });

    test('update with a new password and send an ack email', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        password: D.newUserGood1.password,
        newPassword: 'New2Pword!2',
      };

      const u = await new User();
      const out = await u.updatePassword(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESSFUL_UPDATE));

      const user = User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
    });

    test('reject invalid password and newPassword', async () => {
      const out = await th.testForInvalidUserFields('updatePassword', ['password', 'newPassword']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('verifyPassword', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('verifyPassword');
    });

    test.skip('accept current password to verify identity while authed', async () => {
      // use accountId and userId off authed.user.
      // need a password on req.body
      // TODO: do later; needs to bring back a token.
    });

    test('reject invalid password for authed verification', async () => {
      const out = await th.testForInvalidUserFields('verifyPassword', ['password']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
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
    let removed = await User.Model.remove({ accountId: D.accountId });
    removed = await D.accountRemove();
    // const clear = await mh.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterAll(async () => {
    const conn = await mh.close();
  });
});
