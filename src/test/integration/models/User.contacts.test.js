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

describe('User model contacts routes', () => {
  describe('addContact', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('addContact');
    });

    test('allow adding contact with valid email and data fields', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = Object.assign({}, D.newGoodContact1);

      const expected = D.newGoodContact1;
      const out = await new User().addContact(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE, {});
    });

    test('reject invalid email and contact update', async () => {
      const out = await th.testForInvalidUserFields('addContact', ['email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('updateContact', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('updateContact');
    });

    test('allow updating contact with valid email and valid fields', async () => {
      // use accountId and userId off authed.user.
      // need contactId and valid contact fields
    });

    test('reject invalid email and contact update', async () => {
      const out = await th.testForInvalidUserFields('updateContact', ['email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('getContact', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getContact');
    });
    test('get a user contact from email', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = {
        email: D.newUserGood1.contacts[0].email,
      };

      const expected = D.newUserGood1.contacts[0];

      const out = await new User().getContact(validAuth);
      expectGoodOutput(out, sc.SUCCESS, D.newUserGood1.contacts[0]);
    });

    test('reject invalid email without getting contact', async () => {
      const out = await th.testForInvalidUserFields('getContact', ['email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('getAllContacts', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getAllContacts');
    });

    test('get contact list for a user', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const expected = D.newUserGood1.contacts;

      let out = await new User().getAllContacts(validAuth);
      expect(out.data).toEqual(expected);

      validAuth.body = D.newGoodContact1;
      await new User().addContact(validAuth);

      out = await new User().getAllContacts(validAuth);
      expect(out.data).toHaveLength(2);

      validAuth.body = D.newGoodContact2;
      await new User().addContact(validAuth);

      out = await new User().getAllContacts(validAuth);
      expect(out.data).toHaveLength(3);

      validAuth.body = D.newGoodContact3;
      await new User().addContact(validAuth);

      out = await new User().getAllContacts(validAuth);
      expect(out.data).toHaveLength(4);
    });
  });

  describe('deleteContact', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('deleteContact');
    });

    test('delete contact valid contactId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const expected = [
        D.newUserGood1.contacts[0],
        D.newGoodContact1,
        D.newGoodContact2,
        D.newGoodContact3,
      ];

      validAuth.body = D.newGoodContact1;
      await new User().addContact(validAuth);
      validAuth.body = D.newGoodContact2;
      await new User().addContact(validAuth);
      validAuth.body = D.newGoodContact3;
      await new User().addContact(validAuth);

      validAuth.body = { email: D.newGoodContact2.email };
      let out = await new User().deleteContact(validAuth);
      expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      out = await new User().getAllContacts(validAuth);
      expect(out.data).toHaveLength(3);
      // delete expected[2];
      // TODO: expect(out.data).toEqual(expected); birthdate. look at.

      validAuth.body = { email: D.newGoodContact1.email };
      out = await new User().deleteContact(validAuth);
      expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      out = await new User().getAllContacts(validAuth);
      expect(out.data).toHaveLength(2);

      validAuth.body = { email: D.newGoodContact3.email };
      out = await new User().deleteContact(validAuth);
      expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      out = await new User().getAllContacts(validAuth);
      expect(out.data).toHaveLength(1);
    });

    test('reject deleting only contact', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        email: D.newUserGood1.contacts[0].email,
      };

      const out = await new User().deleteContact(validAuth);
      expect(out).toEqual(errorObject(sc.CANT_DELETE_PRIMARY_CONTACT));
    });

    test('reject invalid contactId without deleting contact', async () => {
      // use accountId and userId off authed.user.
      // need an invalid contactId
      const out = await th.testForInvalidUserFields('deleteContact', ['email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('updateEmail', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('updateEmail');
    });

    test('update email with new valid unused email', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      let user = await User.Model.findOne({
        accountId: D.accountId,
        userId: D.newUserGood1.userId,
      });
      user.contacts[0].verifyCode = '12345';
      const saved = await user.save();

      validAuth.body = {
        email: D.newUserGood1.contacts[0].email,
        newEmail: 'newemail@email.com',
      };

      const out = await new User().updateEmail(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE, {});

      user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });

      expect(user.contacts[0].email).toBe('newemail@email.com');
      expect(typeof user.contacts[0].verifyCode).toBe('string');
      expect(user.contacts[0].emailVerified).toBeUndefined();
    });

    test('reject invalid emails', async () => {
      // use accountId and userId off authed.user.
      // need an invalid or no email or current email on req.body
      const out = await th.testForInvalidUserFields('updateEmail', ['oldEmail', 'newEmail']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('resendEmailVerifyCode', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('resendEmailVerifyCode');
    });

    test('resend email code for logged in user', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        email: D.newUserGood1.contacts[0].email,
        verifyCode: '12345',
      };

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });

      user.contacts[0].verifyCode = '12345';
      const saved = await user.save();

      const out = await new User().resendEmailVerifyCode(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);
    });

    test('reject invalid email verify code', async () => {
      const out = await th.testForInvalidUserFields('resendEmailVerifyCode', ['email']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('verifyEmail', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('verifyEmail');
    });

    test('verify email with valid email code', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        email: D.newUserGood1.contacts[0].email,
        verifyCode: '12345',
      };

      let user = await User.Model.findOne({
        accountId: D.accountId,
        userId: D.newUserGood1.userId,
      });

      user.contacts[0].verifyCode = '12345';
      const saved = await user.save();

      const out = await new User().verifyEmail(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      user = await User.Model.findOne({
        accountId: D.accountId,
        userId: D.newUserGood1.userId,
      });

      expect(user.contacts[0].emailVerified).toBe(true);
    });

    test('reject invalid input', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        email: D.newUserGood1.contacts[0].email,
        verifyCode: '12345',
      };

      const out = await new User().verifyEmail(validAuth);
      th.expectErrorOutput(out, sc.NO_VERIFY_CODE_IN_USE);
    });

    test('reject invalid email or emailVerifyCode', async () => {
      const out = await th.testForInvalidUserFields('verifyEmail', ['email', 'verifyCode']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('verifyEmailViaLink', () => {
    test('verify email with valid email code from link', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = {
        email: D.newUserGood1.contacts[0].email,
        verifyCode: '12345',
      };

      let user = await User.Model.findOne({
        accountId: D.accountId,
        userId: D.newUserGood1.userId,
      });

      user.contacts[0].verifyCode = '12345';
      const saved = await user.save();

      const out = await new User().verifyEmailViaLink(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE, {});

      user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
      expect(user.contacts[0].emailVerified).toBe(true);
    });

    test('verify altEmail with valid email code from link', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = {
        altEmail: 'test@test.com',
        verifyCode: '12345',
      };

      let user = await User.Model.findOne({
        accountId: D.accountId,
        userId: D.newUserGood1.userId,
      });

      user.contacts[0].altEmail = 'test@test.com';
      user.contacts[0].altVerifyCode = '12345';
      const saved = await user.save();

      user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();

      const out = await new User().verifyEmailViaLink(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE, {});

      user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();

      expect(user.contacts[0].altVerified).toBe(true);
    });

    test('reject invalid email or emailVerifyCode', async () => {
      const out = await th.testForInvalidUserFields('verifyEmailViaLink', ['email', 'verifyCode'], 'params');

      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('resendUsername', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('resendUsername');
    });

    test('resend username to email', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const out = await new User().resendUsername(validAuth);
      th.expectGoodOutput(out, sc.SUCCESSFUL_UPDATE, {});
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
