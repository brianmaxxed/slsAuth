/* eslint no-shadow: 0, no-unused-expressions:0 */
import mongoose from 'mongoose';
import _ from 'lodash';

import Agreement from '../../../../src/models/Agreement';
import AgreementSchema from '../../../../src/models/schemas/AgreementSchema';

import D from '../../data/Data';

import m from '../../../../src/models/consts/models';
import log from '../../../../src/utils/logger';
import mh from '../../utils/mongooseHelper';

require('../../utils/unitTestSetupHelper');

// what do i need to test.
// signup, login, logout, account, myAccount,

describe('Agreement model CRUD', async () => {
  describe('Agreement Class Structure', () => {
    test('an instance should have a mongoose model', async () => {
      expect(Agreement.Model).toEqual(mongoose.models[m.agreement]);
    });

    test('a static model call should have a mongoose model', async () => {
      expect(Agreement.Model).toEqual(mongoose.models[m.agreement]);
    });
  });

  beforeAll(async () => {
    const conn = await mh.connect();
  });

  beforeEach(async () => {
    const accountId = D.accountInit();
    const account = await D.accountSetup();
    // const clear = await mc.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterEach(async () => {
    const removed = await D.accountRemove();
    // const clear = await mc.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterAll(async () => {
    const conn = await mh.close();
  });
});
