import mongoose from 'mongoose';
import accountSettings from '../objects/accountSettings';
import address from '../objects/address';
import models from '../consts/models';
import log from '../../utils/logger';

const { Schema } = mongoose;

const AccountSchema = new Schema({
  accountId: { type: String, required: true, unique: true },
  settings: { type: accountSettings },
  agreementVersion: { type: Number, hideJSON: true },
  userAgreementVersion: { type: Number, hideJSON: true },
  businessName: { type: String, required: true, index: true },
  address: { type: address },
  image: { type: String },
  users: [{ type: Schema.Types.ObjectId, ref: models.user, index: true }],
  offline: { type: Boolean },
  disabled: { type: Boolean },
  softDelete: { type: Boolean },
  archived: { type: Boolean },
}, { autoIndex: true, timestamps: true, collection: models.account });


AccountSchema.index(
  { accountId: 1, 'devices.deviceId': 1 },
  { unique: true, partialFilterExpression: { 'contacts.deviceId': { $type: 'string' } } },
);

AccountSchema.pre('save', (next) => {
  // do stuff
  next();
});

/* eslint func-names: 0 */
AccountSchema.statics.findValidAccount = async function (query = {}, lean = false, projection = {}) {
  let account = null;

  try {
    account = await this.findOne(query, projection).lean(lean);
  } catch (e) {
    log.error('Error: ', e.stack);
  }

  return (!account ||
    account.offline ||
    account.disabled ||
    account.softDelete ||
    account.archived) ? null : account;
};

export default AccountSchema;
