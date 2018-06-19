import mongoose from 'mongoose';
import businessContact from '../objects/businessContact';
import address from '../objects/address';
import industries from '../enums/industries';
import businessTypes from '../enums/businessTypes';
import models from '../consts/models';

const { Schema } = mongoose;

const UserAccountSchema = new Schema({
  accountId: { type: String, required: true, unique: true },
  agreementVersion: { type: Number, hideJSON: true },
  contacts: { type: businessContact },
  businessName: { type: String, required: true, index: true },
  address: { type: address },
  image: { type: String },
  offline: { type: Boolean },
  disabled: { type: Boolean },
  softDelete: { type: Boolean },
}, { autoIndex: false, timestamps: true, collection: models.userAccount }); // TODO: unit test these 3 params.

export default UserAccountSchema;
