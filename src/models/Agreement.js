/* eslint class-methods-use-this: 0 */
import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import AgreementSchema from './schemas/AgreementSchema';
import c from '../config/consts';
import models from './consts/models';
import log from '../utils/logger';

export default class Agreement {
  static get Model() {
    const model = mongoose.model(models.agreement, AgreementSchema);

    return model;
    // need to do some automated testing on this method for all models.
  }

  get Model() {
    return Agreement.Model;
    // need to do some automated testing on this method for all models.
  }

  static async getCurrentVersion(list) {
    try {
      const query = {
        isCurrent: true,
      };

      const results = this.Model.findOne(query, { version: 1, _id: 0 });

      if (results) {
        return results.version;
      }
    } catch (e) {
      log.error('Error: ', e.stack);
    }

    return null;
  }

  async getCurrentVersion(list) {
    try {
      const out = await Agreement.getCurrentVersion(list);
      return out;
    } catch (e) {
      log.error('Error: ', e.stack);
    }
  }
}
