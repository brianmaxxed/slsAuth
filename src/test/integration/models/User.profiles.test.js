/* eslint no-shadow: 0, no-unused-expressions:0, padded-blocks:0 */
import _ from 'lodash';
import mongoose from 'mongoose';
import mh from '../../utils/mongooseHelper';
import Account from '../../../../src/models/Account';
import User from '../../../../src/models/User';
import deviceTypes from '../../../../src/models/enums/deviceTypes';
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
import D from '../../data';
import th, { expectErrorOutput, expectGoodOutput } from '../../utils/testHelper';

require('../../utils/unitTestSetupHelper');

describe('User model profile routes', () => {
  describe('getProfile', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getProfile');
    });

    test('rejects invalid profileId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = { profileId: 999999999999 };

      expect(await new User().getProfile(validAuth))
        .toEqual(errorObject(sc.PROFILE_ID_NOT_FOUND));
    });

    test('gets a user profile by profileId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = { profileId: D.newUserGood1.profiles[0].profileId };

      const out = await new User().getProfile(validAuth);
      const expected = Object.assign({}, D.newUserGood1.profiles[0]);

      expect(out.data).toEqual(expected);
    });
  });

  describe('getAllProfiles', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getAllProfiles');
    });

    test('gets an authenticated user\'s profiles', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);

      const expected = Object.assign([], D.newUserGood1.profiles);

      const out = await new User().getAllProfiles(validAuth);
      expect(out.data).toEqual(expected);
    });
  });

  describe('addProfile', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('addProfile');
    });

    test('adds a valid profile', async () => {
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { profileName: 'Mary\'s profile #1' };

      const out = await u.addProfile(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESSFUL_UPDATE));
    });

    test('rejects an invalid profile', async () => {
      const out = await th.testForInvalidUserFields('addProfile', ['profileName']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });

    test('reject duplicate profile name', async () => {
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { profileName: 'Mary\'s profile #1' };

      let out = await u.addProfile(validAuth);
      out = await u.addProfile(validAuth);
      expectErrorOutput(out, sc.PROFILE_NAME_IN_USE);
    });

    test('reject profiles over the maximum allowed', async () => {
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      let out;

      await h.asyncForEachLinear([...Array(c.MAX_USER_PROFILES - 1).keys()], async (i) => {
        validAuth.body = { profileName: `Mary's profile #${i}` };
        out = await u.addProfile(validAuth);
        expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);
      });

      validAuth.body = { profileName: `Mary's profile #${c.MAX_USER_PROFILES}` };
      out = await u.addProfile(validAuth);
      const u2 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      expectErrorOutput(out, sc.PROFILE_LIMIT_REACHED);
    });
  });

  describe('updateProfile', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('updateProfile');
    });

    test('updates a valid profile', async () => {
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { profileId: D.newUserGood1.profiles[0].profileId, profileName: 'Big Daddy' };

      const out = await u.updateProfile(validAuth);
      expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
      expect(user.profiles[0].name).toBe(validAuth.body.profileName);
    });

    test('rejects invalid profile update', async () => {
      const out = await th.testForInvalidUserFields('updateProfile', ['profileId', 'profileName']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('deleteProfile', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('deleteProfile');
    });

    test('rejects invalid profileId for deletion', async () => {
      const out = await th.testForInvalidUserFields('deleteProfile', ['profileId']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });

    test('cannot delete main profile', async () => {
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { profileId: D.newUserGood1.profiles[0].profileId };

      const out = await u.deleteProfile(validAuth);
      expect(out).toEqual(errorObject(sc.CANT_DELETE_PRIMARY_PROFILE));
    });

    test('delete a valid profile', async () => {
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { profileName: 'Mary\'s profile #1' };

      const one = await u.addProfile(validAuth);
      const u1 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      expect(u1.profiles[1].name).toBe(validAuth.body.profileName);

      validAuth.body = { profileId: u1.profiles[1].profileId };

      expectGoodOutput(await u.deleteProfile(validAuth), sc.SUCCESSFUL_UPDATE);

      const u2 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
      expect(u2.profiles).toHaveLength(1);
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
