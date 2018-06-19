/* eslint no-void: 0 */
import { Schema } from 'mongoose';
import models from '../consts/models';
import item from '../objects/item';

const PaymentSchema = new Schema({
  transId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  profileId: { type: String, required: true },
  deviceId: { type: String, required: true },
  accountId: { type: String, required: true },
  settings: { type: [item], default: void 0 },
  action: { type: String, required: true },
  result: { type: String, required: true },
  amount: { type: String, required: true },
}, { autoIndex: false, timestamps: true, collection: models.payment });

PaymentSchema.index({
  transId: 1,
  userId: 1,
  id: 1,
  deviceId: 1,
  accountId: 1,
}, { unique: true });

export default PaymentSchema;
