/* eslint class-methods-use-this: 0 */
import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import AccountSchema from './schemas/AccountSchema';
import c from '../config/consts';
import sc from '../config/statusCodes';
import models from './consts/models';
import h, { statusObject, errorObject } from '../utils/helper';
import log from '../utils/logger';

export default class Account {
  static get Model() {
    return mongoose.models[models.account] ?
      mongoose.models[models.account] :
      mongoose.model(models.account, AccountSchema);
  }

  get Model() {
    return Account.Model;
  }

  static async validAccount(accountId) {
    const validAct = await Account.Model.findOne({ accountId });
    if (!validAct || validAct.disabled === true || validAct.softDelete === true) {
      return errorObject(sc.INVALID_APP_ACCOUNT);
    }
  }
}
