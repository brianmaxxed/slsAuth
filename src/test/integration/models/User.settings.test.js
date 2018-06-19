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
  describe('updateSetting', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('updateSetting');
    });

    test('update 1 setting', async () => {
      // the nested object doesn't compare to the account privacy object on the account.
      // maybe fill in the default values for undefined settings (settings with no value)
      // i think privacy are all booleans make sure.
      // if not will need further validation.
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        notifyOnChanges: true,
      };

      let out = await new User().updateSetting(validAuth);
      expectGoodOutput(out, statusObject(sc.SUCCESSFUL_UPDATE));

      let u1 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
      expect(u1.settings.notifyOnChanges).toBe(true);

      validAuth.body.notifyOnChanges = false;
      out = await new User().updateSetting(validAuth);
      expectGoodOutput(out, statusObject(sc.SUCCESSFUL_UPDATE));

      u1 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
      expect(u1.settings.notifyOnChanges).toBe(false);
    });
  });

  describe('updateSettings', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('updateSettings');
    });

    test('update multiple settings', async () => {
      // the nested object doesn't compare to the account privacy object on the account.
      // maybe fill in the default values for undefined settings (settings with no value)
      // i think privacy are all booleans make sure.
      // if not will need further validation.
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        notifyOnChanges: false,
        expandedWatchlist: false,
        autoplay: false,
        expandContent: false,
      };

      let out = await new User().updateSettings(validAuth);
      expectGoodOutput(out, statusObject(sc.SUCCESSFUL_UPDATE));

      let u1 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();

      Object.keys(validAuth.body).forEach((field) => {
        expect(u1.settings[field]).toBe(false);
        validAuth.body[field] = true;
      });

      out = await new User().updateSettings(validAuth);
      expectGoodOutput(out, statusObject(sc.SUCCESSFUL_UPDATE));

      u1 = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId }).lean();
    });
  });

  describe('getSetting', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getSetting');
    });

    test('get one valid setting for a user', async () => {
      // make sure the privacy setting is valid based on control object for account.
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = { setting: 'notifyOnChanges' };

      const out = await u.getSetting(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESS, false));
    });
  });

  describe('getAllSettings', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getAllSettings');
    });

    test('get all settings based on account settings', async () => {
      // use accountId and userId to get all settings
      // set undefined to defined defaults
      const u = new User();
      const validAuth = await th.getValidAuth(c.NEW_USER);

      const out = await u.getAllSettings(validAuth);
      expect(out).toEqual(statusObject(sc.SUCCESSFUL_UPDATE, []));
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
