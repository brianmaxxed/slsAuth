/* eslint class-methods-use-this: 0 */

import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import BlacklistSchema from './schemas/BlacklistSchema';
import Account from './Account';
import c from '../config/consts';
import models from './consts/models';
import log from '../utils/logger';

export default class Blacklist {
  static get Model() {
    return mongoose.model(models.blacklist, BlacklistSchema);
  }

  get Model() {
    return Blacklist.Model;
  }

  static async check(accountId, list, lean = false) {
    try {
      const query = {
        accountId,
        $and: [
          { $or: [] },
        ],
      };
      const keys = Object.keys(list);
      keys.forEach((key) => {
        query.$and[0].$or.push({ type: key, value: list[key] });
      });

      // TODO: need to make sure valid accountId.
      const validAccount = await Account.Model.findValidAccount({ accountId }, c.LEAN);
      if (!validAccount) {
        return false;
      }

      const results = await Blacklist.Model.find(query).sort({ type: 1 }).lean(lean);

      if (results && results.length > 0) {
        const blacklisted = {
          status: 400,
          errors: [],
        };

        results.forEach((error) => {
          blacklisted.errors.push({
            error: {
              type: error.type,
              msg: `that ${error.type} is not available`,
            },
          });
        });

        return blacklisted;
      }
    } catch (e) {
      log.error('Error: ', e.stack);
    }

    return false;
  }
}
