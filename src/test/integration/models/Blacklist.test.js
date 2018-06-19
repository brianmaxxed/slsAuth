/* eslint no-shadow: 0, no-unused-expressions:0 */
import mongoose from 'mongoose';
import _ from 'lodash';

import Account from '../../../../src/models/Account';
import Blacklist from '../../../../src/models/Blacklist';
import BlacklistSchema from '../../../../src/models/schemas/BlacklistSchema';

import m from '../../../../src/models/consts/models';
import log from '../../../../src/utils/logger';
import c from '../../../../src/config/consts';
import mh from '../../utils/mongooseHelper';

import D from '../../data/Data';

require('../../utils/unitTestSetupHelper');

// still need account, myAccount, and the other ones related to email.

describe('Blacklist model CRUD', async () => {
  describe('create a blacklist', () => {
    test('should create a blacklist with all required fields', async () => {
      await new Blacklist.Model(D.blacklistedAuthToken).save();
    });

    test('should not allow a blacklist without required fields', async () => {
      let b = new Blacklist.Model(D.blacklistedAuthToken);
      b.type = undefined;
      await mh.checkModelValidateError('`type` is required', b);

      b = new Blacklist.Model(D.blacklistedAuthToken);
      b.value = undefined;
      await mh.checkModelValidateError('`value` is required', b);
    });

    test('should not allow duplicate unique fields', async () => {
      const b1 = Blacklist.Model(D.blacklistedAuthToken);
      const b2 = Blacklist.Model(D.blacklistedAuthToken);
      await mh.checkModelSaveError('E11000 duplicate key error collection', b1, b2);
    });

    test('should find all blacklists', async () => {
      await new Blacklist.Model(D.blacklistedAuthToken).save();
      await new Blacklist.Model(D.blacklistedPassword).save();
      await new Blacklist.Model(D.blacklistedEmail).save();

      const docs = await Blacklist.Model.find({ accountId: D.accountId });

      expect(docs).toHaveLength(3);
    });

    test('should update a blacklist', async () => {
      expect(BlacklistSchema).toHaveProperty('obj.value');
      const b = new Blacklist.Model(D.blacklistedAuthToken);

      let save = await b.save();
      b.value = b.value.toUpperCase();
      save = await b.save();

      const doc = await Blacklist.Model.findOne(b._id);
      expect(doc.value).toBe(b.value);
    });

    test('should delete a blacklist', async () => {
      const b1 = await new Blacklist.Model(D.blacklistedAuthToken).save();
      await new Blacklist.Model(D.blacklistedPassword).save();

      let count = await Blacklist.Model.count({ accountId: D.accountId });
      expect(count).toBe(2);

      const doc = await Blacklist.Model.findOneAndRemove({
        _id: b1._id,
      });

      expect(doc.id).toBe(b1.id);

      count = await Blacklist.Model.count({ accountId: D.accountId });
      expect(count).toBe(1);
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
    let removed = await Blacklist.Model.remove({ accountId: D.accountId });
    removed = await D.accountRemove();
    // const clear = await mh.clearCollections([m.agreement, m.user, m.blacklist]);
  });

  afterAll(async () => {
    const conn = await mh.close();
  });
});
