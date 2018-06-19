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

describe('User model device routes', () => {

  describe('addDevice', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('addDevice');
    });

    test('adds a device', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        data: {
          name: 'TEST',
          type: h.enumProp(deviceTypes, c.DEFAULT),
        },
      };

      const out = await new User().addDevice(validAuth);
      const u1 = await User.Model.findOne({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
      }).lean();

      const newDeviceId = u1.devices[1].deviceId;
      expect(u1.devices[1]).toEqual({
        activated: true,
        deviceId: newDeviceId,
        ip: '',
        name: 'default',
        type: 'default',
        userAgent: '',
      });
    });
  });

  describe('updateDevice', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('addDevice');
    });

    test('update a device for a valid deviceId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = {
        deviceId: D.newUserGood1.devices[0].deviceId,
        name: 'TEST',
      };

      const out = await new User().updateDevice(validAuth);
      const u1 = await User.Model.findOne({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
      }).lean();

      expect(u1.devices[0].name).toBe(validAuth.body.name);
    });
  });

  describe('deleteDevice', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('deleteDevice');
    });

    test('delete a device for a valid deviceId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { data: { name: 'TEST', type: h.enumProp(deviceTypes, c.DEFAULT) } };
      const u = new User();
      let out = await u.addDevice(validAuth);
      out = await u.addDevice(validAuth);
      out = await u.addDevice(validAuth);

      let user = await User.Model.findOne({ accountId: D.newUserGood1.accountId, userId: D.newUserGood1.userId });
      validAuth.body = { deviceId: D.newUserGood1.devices[0].deviceId };
      out = await u.deleteDevice(validAuth);
      expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      user = await User.Model.findOne({ accountId: D.newUserGood1.accountId, userId: D.newUserGood1.userId });

      expect(user.devices).toHaveLength(3);
    });

    test('reject invalid deviceId', async () => {
      const out = await th.testForInvalidUserFields('deleteDevice', ['deviceId']);
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('getDevice', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getDevice');
    });

    test('get a device for a valid deviceId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.params = { deviceId: D.newUserGood1.devices[0].deviceId };

      const out = await new User().getDevice(validAuth);
      expect(out.data).toEqual(D.newUserGood1.devices[0]);
    });

    test('reject invalid deviceId', async () => {
      const out = await th.testForInvalidUserFields('getDevice', ['deviceId'], 'params');
      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('getAllDevices', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getAllDevices');

    });

    test('get all devices', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      const out = await new User().getAllDevices(validAuth);
      expect(out.data).toEqual(D.newUserGood1.devices);
    });
  });

  describe('getLoggedinDevices', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('getLoggedinDevices');
    });

    test('get all loggedin devices', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);

      let out = await new User().getLoggedinDevices(validAuth);
      let expected = Object.assign({ loginAttempts: 0 }, D.newUserGood1.devices[0]);

      expect(out.data).toHaveLength(0);

      const user = await User.Model.findOne({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
      });

      out = await new User().getLoggedinDevices(validAuth);
      expected = Object.assign({ loginAttempts: 0 }, D.newUserGood1.devices[0]);

      expect(out.data).toHaveLength(0);
    });
  });

  describe('logoutAllDevices', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('logoutAllDevices');
    });

    test('logout all devices', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);

      let user = await User.Model.findOne({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
      });

      user.devices[0].loggedIn = true;
      const saved = await user.save();

      const out = await new User().logoutAllDevices(validAuth);
      expect(out.data).toHaveLength(1);

      user = await User.Model.find({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
        'device.loggedIn': true,
      });

      expect(user).toHaveLength(0);
    });
  });

  describe('logoutAllDevicesExcept', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('logoutDevicesExcept');
    });

    test('logout all devices except one valid deviceId', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { deviceId: D.newUserGood1.devices[0].deviceId };

      let user = await User.Model.findOne({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
      });

      user.devices[0].loggedIn = true;
      const saved = await user.save();

      let out = await new User().logoutDevicesExcept(validAuth);
      expect(out.data).toHaveLength(0);

      user = await User.Model.find({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
        'devices.loggedIn': true,
      });

      expect(user).toHaveLength(1);

      validAuth.body = {
        data: {
          name: 'TEST',
          type: h.enumProp(deviceTypes, c.DEFAULT),
        },
      };

      out = await new User().addDevice(validAuth);

      user = await User.Model.update(
        {
          accountId: D.newUserGood1.accountId,
          userId: D.newUserGood1.userId,
        },
        {
          $set: { 'devices.$[].loggedIn': true },
        },
        { multi: true },
      );

      validAuth.body = { deviceId: D.newUserGood1.devices[0].deviceId };
      out = await new User().logoutDevicesExcept(validAuth);
      expect(out.data).toHaveLength(1);

      user = await User.Model.find({
        accountId: D.newUserGood1.accountId,
        userId: D.newUserGood1.userId,
        'devices.loggedIn': true,
      });
    });

    test('reject invalid deviceId id', async () => {
      const out = await th.testForInvalidUserFields('logoutDevicesExcept', ['deviceId']);

      out.forEach((res) => {
        expect({ id: res.id, status: res.status, msg: res.msg }).toEqual(sc.FIELD_VALIDATION_ERRORS);
      });
    });
  });

  describe('activateDevice', () => {
    test('requires a valid, authenticated user', async () => {
      await th.testForUnAuthedInvalidUser('activateDevice');
    });

    test('allow activating valid device by device id and activation code', async () => {
      const validAuth = await th.getValidAuth(c.NEW_USER);
      validAuth.body = { data: { name: 'TEST', type: h.enumProp(deviceTypes, c.DEFAULT) } };
      const u = new User();
      let out = await u.addDevice(validAuth);
      out = await u.addDevice(validAuth);

      let user = await User.Model.findOne({ accountId: D.newUserGood1.accountId, userId: D.newUserGood1.userId });
      user.devices[0].activated = false;
      user.devices[1].activated = false;
      user.devices[1].activationCode = '12345';
      await user.save();

      const users = await User.Model.find({ accountId: D.newUserGood1.accountId, userId: D.newUserGood1.userId });

      validAuth.body = { deviceId: user.devices[1].deviceId, activationCode: '12345' };
      out = await u.activateDevice(validAuth);
      expectGoodOutput(out, sc.SUCCESSFUL_UPDATE);

      user = await User.Model.findOne({ accountId: D.newUserGood1.accountId, userId: D.newUserGood1.userId });
      expect(user.devices[1].activated).toBe(true);

      expect(user.devices).toHaveLength(3);
    });

    test('reject activating invalid device id and activation code', async () => {
      // use accountId and userId off authed.user.
      // need activation code, deviceId
      const out = await th.testForInvalidUserFields('activateDevice', ['activationCode', 'deviceId']);
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
