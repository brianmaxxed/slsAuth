/* eslint no-shadow: 0, no-unused-expressions:0 */
import helper from '../../../../src/utils/helper';
import c from '../../../../src/config/consts';
import sc from '../../../../src/config/statusCodes';
import mh from '../../utils/mongooseHelper';
import User from '../../../../src/models/User';
import log from '../../../../src/utils/logger';
import crypto from '../../../../src/utils/crypto';
import D from '../../data/Data';

// import realPropStores from '../../../../src/config/propertyStores';
// import testPropStores from '../../data/propertyStores/config/propertyStores';
import realPropStores from '../../../../src/models/propertyStores';
import testPropStores from '../../data/propertyStores';
import userStoreTest from '../../data/propertyStores/user/example';
import userStorePrivacy from '../../data/propertyStores/user/privacy';

require('../../utils/unitTestSetupHelper');

const u = {};
u.test = () => 'test';

const req = { name: 'req' };
const res = {
  name: 'res',
  status: () => ({
    send: () => null,
  }),
  type: () => {

  },
  set: () => {

  },
};

const next = () => 'next';

describe('helper library', async () => {
  describe('verifyValidSettableProperty', () => {
    test('rejects invalid function parameters', () => {
      expect(helper.verifyValidSettableProperty()).toEqual({
        valid: false,
        writable: false,
        error: sc.INVALID_SETTING_STORE,
      });

      expect(helper.verifyValidSettableProperty(null)).toEqual({
        valid: false,
        writable: false,
        error: sc.INVALID_SETTING_STORE,
      });

      expect(helper.verifyValidSettableProperty(testPropStores)).toEqual({
        valid: false,
        writable: false,
        error: sc.INVALID_SETTING,
      });
    });

    test('rejects invalid settings', () => {
      expect(helper.verifyValidSettableProperty(testPropStores, 'user.privacy.publicProfileFAKE')).toEqual({
        valid: false,
        writable: false,
        error: sc.INVALID_SETTING,
      });
    });

    test('statuses valid, writable settings of property stores', () => {
      expect(helper.verifyValidSettableProperty(testPropStores, 'user.privacy.publicProfile')).toEqual({
        valid: true,
        writable: true,
        error: null,
      });
    });

    test('rejects disabled settings', () => {
      expect(helper.verifyValidSettableProperty(testPropStores, 'user.example.testPrivacyDisabled1.subitem1')).toEqual({
        valid: false,
        writable: false,
        error: sc.PROPERTY_NOT_ENABLED,
      });
    });

    test('rejects unwritable proprerties', () => {
    });

    test('rejects disabled property parents', () => {
    });
  });

  describe('verifyValidSettablePropObject', () => {
    const invalidOutput = { invalidProps: null, validProps: false, validStore: false };
    test('rejects without valid function parameters', () => {
      expect(helper.verifyValidSettablePropObject()).toEqual(invalidOutput);
      expect(helper.verifyValidSettablePropObject(testPropStores.user)).toEqual(invalidOutput);
      expect(helper.verifyValidSettablePropObject(testPropStores.user, 'zzzzzzz')).toEqual(invalidOutput);
      expect(helper.verifyValidSettablePropObject(testPropStores.user, 'zzzzzzz', {})).toEqual(invalidOutput);
      expect(helper.verifyValidSettablePropObject(testPropStores.user, 'zzzzzz', { test: true })).toEqual(invalidOutput);
    });

    test('accepts valid function parameters', async () => {
      const out = helper.verifyValidSettablePropObject(testPropStores.user, 'example', { publicProfile: true });
      expect(out).toBeTruthy();
    });

    test('rejects invalid property store settings', async () => {
      const props = {
        publicProfile: true,
        publicProfileFAKE: true,
      };

      const out = helper.verifyValidSettablePropObject(testPropStores.user, 'example', props);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.invalidProps).toEqual({ publicProfileFAKE: true });
    });

    test('rejects valid not settable settings', async () => {
      const props = {
        publicProfile: true,
        hideUsername: false,
        sharedProfile: true,
      };

      const out = helper.verifyValidSettablePropObject(testPropStores.user, 'example', props);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.invalidProps).toEqual({ hideUsername: false, sharedProfile: true });
    });

    test('accepts valid settable property store settings', async () => {
      const props = {
        publicProfile: true,
        hideDisplayName: true,
        hideAvatar: true,
        sharedWatchlist: true,
        sharedHistory: true,
      };

      const out = helper.verifyValidSettablePropObject(testPropStores.user, 'example', props);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(true);
      expect(out.invalidProps).toEqual({});
    });

    test('accepts only enabled sub objects', async () => {
      const props = {
        testPrivacyDisabled1: {
          subitem1: true,
          subItem2: true,
        },
      };

      const out = helper.verifyValidSettablePropObject(testPropStores.user, 'example', props);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.invalidProps).toEqual(props);
    });

    test('accepts only enabled nested sub objects', async () => {
      const props = {
        testPrivacyDisabled2: {
          subitem1: true,
          subItem2: true,
          sublist1: {
            subItemA1: true,
            subItemA2: true,
            subItemA3: true,
          },
        },
      };

      const out = helper.verifyValidSettablePropObject(testPropStores.user, 'example', props);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.invalidProps).toEqual({
        testPrivacyDisabled2: {
          sublist1: {
            subItemA1: true,
            subItemA2: true,
            subItemA3: true,
          },
        },
      });
    });
  });

  describe('updatePropObject', () => {
    test('rejects invalid property store', async () => {
      const results = {
        validStore: false,
        validProps: false,
        invalidProps: {},
        saved: false,
        data: {},
        error: sc.INVALID_SETTING_STORE,
        result: null,
      };

      let expected = await helper.updatePropObject();
      expect(expected).toEqual(results);

      expected = await helper.updatePropObject('zzzzzzzz');
      expect(expected).toEqual(results);

      expected = await helper.updatePropObject('zzzzzzzz', 'zzzzzzzz');
      results.error = sc.SPECIFY_SETTINGS;
      expect(expected).toEqual(results);

      expected = await helper.updatePropObject('zzzzzzzz', 'zzzzzzzzz', null, new User());
      expect(expected).toEqual(results);
    });

    test('rejects invalid settings', async () => {
      const props = {
        publicProfile: true,
        publicProfileFAKE: true,
      };

      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      const save = await u1.save();

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      const out = await helper.updatePropObject('user', 'example', props, user, testPropStores);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.invalidProps).toEqual({ publicProfileFAKE: true });
      expect(out.saved).toBe(false);
    });

    test('accepts valid settings', () => {

    });

    test('rejects when it does not save a model', () => {

    });

    test('successfully saves a model with a valid model', () => {

    });

    test('rejects invalid output on errors', () => {

    });
  });

  describe('updateProperty', () => {
    test('rejects invalid property store', async () => {
      const results = {
        validStore: false,
        validProps: false,
        saved: false,
        data: {},
        error: sc.INVALID_SETTING_STORE,
        result: null,
      };

      let expected = await helper.updateProperty();
      expect(expected).toEqual(results);

      expected = await helper.updateProperty('zzzzzzzzz');
      expect(expected).toEqual(results);

      expected = await helper.updateProperty('zzzzzzzz', 'prop.prop1');
      expect(expected).toEqual(results);

      expected = await helper.updateProperty('zzzzzzzz', null, new User());
      expect(expected).toEqual(results);
    });

    test('rejects invalid settings', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      const save = await u1.save();

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      const out = await helper.updateProperty('user', 'privacy.publicProfileFAKE', true, user, testPropStores);

      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.saved).toBe(false);
    });

    test('rejects diableProperties', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      const save = await u1.save();

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      const out = await helper.updateProperty('user', 'privacy.publicProfileFAKE', true, user, testPropStores);

      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.saved).toBe(false);
    });

    test('rejects unwritable settings', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      const save = await u1.save();

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      const out = await helper.updateProperty('user', 'privacy.publicProfileFAKE', true, user, testPropStores);

      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.saved).toBe(false);
    });

    test('rejects disabled property parents', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      const save = await u1.save();

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      const out = await helper.updateProperty('user', 'privacy.publicProfileFAKE', true, user, testPropStores);

      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(false);
      expect(out.saved).toBe(false);
    });

    test('saves a valid, writable property', async () => {
      const u1 = await new User.Model(D.newUserGood1);
      const { hash } = await crypto.hashPassword(D.newUserGood1.password);
      u1.password = hash;
      const save = await u1.save();

      const user = await User.Model.findOne({ accountId: D.accountId, userId: D.newUserGood1.userId });
      const out = await helper.updateProperty('user', 'privacy.publicProfile', true, user, testPropStores);
      expect(out.validStore).toBe(true);
      expect(out.validProps).toBe(true);
      expect(out.saved).toBe(true);
      expect(user.privacy.publicProfile).toBe(true);
    });
  });

  describe('processResults', () => {
    test('return the payload when no errors', async () => {
      const output = {
        name: 'test',
      };

      const expected = helper.processResults(output, res, next);
      expect(expected).toEqual(output);
    });

    test('returns output.errors when errors exist', async () => {
      const output = { error: { id: sc.SIGNUP_NOT_COMPLETE.id, msg: sc.SIGNUP_NOT_COMPLETE.msg } };
      const expected = helper.processResults(output, res, next);
      expect(expected).toEqual({ errors: [output], status: 500 });
      expect(expected.status).toEqual(500);
    });

    test('wraps one error in output.errors', async () => {
      const output = { errors: [], status: sc.SIGNUP_NOT_COMPLETE.status };
      output.errors.push({ error: { id: sc.SIGNUP_NOT_COMPLETE.id, msg: sc.SIGNUP_NOT_COMPLETE.msg } });
      output.errors.push({ error: { id: sc.SIGNUP_NOT_COMPLETE.id, msg: sc.SIGNUP_NOT_COMPLETE.msg } });

      const expected = helper.processResults(output, res, next);

      expect(expected).toEqual(output);
      expect(expected.status).toEqual(sc.SIGNUP_NOT_COMPLETE.status);
    });
  });

  describe('asynced', () => {
    test(
      'allows execution of the passed objects function and returns the output',
      async () => {
        const expected = await helper.asynced(u, 'test', [req, res, next]);

        expect(expected).toEqual(u.test());
      },
    );
  });

  describe('authN', () => {
    test(
      'allows execution of the passed objects function and returns the output',
      async () => {
        const expected = await helper.authN(u, 'test', [req, res, next]);

        expect(expected).toEqual(u.test());
      },
    );

    test(
      'doesn\'t allow continuation if auth object is on request object already',
      async () => {
        req.auth = {};

        try {
          await helper.authN(u, 'test', [req, res, next]);
        } catch (e) {
          // TODO: put the error in a messages config file.
          expect(e.message).toEqual('request object already has an \'auth\' property');
        }

        delete req.auth;
      },
    );
  });

  describe('statusObject', () => {
    test(
      'retuns a status object when passed status, message and data',
      async () => {
        const sc = {
          id: 100,
          status: 200,
          msg: 'message',
        };

        const output = {
          results: {
            id: 1,
            name: 'Name',
          },
        };

        const actually = Object.assign({}, sc, { data: output });
        const expected = helper.statusObject(sc, output);
        expect(expected).toEqual(actually);
      },
    );

    test(
      'retuns an empty data object, when data not passed to function',
      async () => {
        const sc = {
          id: 100,
          status: 200,
          msg: 'message',
          data: {},
        };

        const actually = helper.statusObject(sc, sc.data);
        expect(sc).toEqual(actually);
      },
    );
  });

  describe('errorObject', () => {
    test('will turn a status code into an error object', async () => {
      const actually = helper.errorObject(sc.NEED_ALL_REQUIRED_FIELDS);

      const expected = {
        id: sc.NEED_ALL_REQUIRED_FIELDS.id,
        status: sc.NEED_ALL_REQUIRED_FIELDS.status,
        msg: sc.NEED_ALL_REQUIRED_FIELDS.msg,

        errors: [
          {
            error: {
              id: sc.NEED_ALL_REQUIRED_FIELDS.id,
              status: sc.NEED_ALL_REQUIRED_FIELDS.status,
              msg: sc.NEED_ALL_REQUIRED_FIELDS.msg,
            },
          },
        ],
      };

      expect(expected).toEqual(actually);
    });

    test(
      'takes a status object without code, returns an error object without status',
      async () => {
        const status = {
          id: 1,
          status: 200,
          msg: 'this is a message.',
        };

        const expected = helper.errorObject(status);

        const actually = status;
        actually.errors = [
          {
            error: {
              id: status.id,
              status: 200,
              msg: status.msg,
            },
          },
        ];

        expect(expected).toEqual(actually);
      },
    );
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
