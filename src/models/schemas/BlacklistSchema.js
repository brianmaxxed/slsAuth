import mongoose, { Schema } from 'mongoose';
import blacklistTypes from '../enums/blacklistTypes';

import models from '../consts/models';
import log from '../../utils/logger';

const BlacklistSchema = new Schema({
  type: { type: String, enum: blacklistTypes, required: true },
  value: { type: String, required: true },
  accountId: { type: String, required: true },
  ttl: { type: Number },
}, { autoIndex: false, timestamps: true, collection: models.blacklist });

BlacklistSchema.index(
  { accountId: 1, type: 1, value: 1 },
  { unique: true, partialFilterExpression: { accountId: { $type: 'string' } } },
);

/* eslint func-names: 0 */
BlacklistSchema.statics.check = async function (accountId, list, lean = false) {
  try {
    const query = {
      accountId,
      $and: [{
        $or: [],
      }],
    };

    const keys = Object.keys(list);
    keys.forEach((key) => {
      query.$and[0].$or.push({ type: key, value: list[key] });
    });

    const results = await this.find(query).sort({ type: 1 }).lean(lean);

    if (results && results.length > 0) {
      const blacklisted = {
        status: 400,
        errors: [],
      };

      results.forEach((error) => {
        blacklisted.errors.push({
          error: {
            msg: `that ${error.type} is not available`,
          },
        });
      });
      return blacklisted;
    }
  } catch (e) {
    log.error('Error: ', e.stack);
  }

  return null;
};

export default BlacklistSchema;
