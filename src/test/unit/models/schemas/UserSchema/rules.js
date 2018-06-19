import mongoose from 'mongoose';
import { instances } from '../../../../utils/schemaTypes';
import Contact from '../../../../../src/models/objects/Contact';

const {
  Boolean, Number, Schema, String,
} = instances();

const fields = {
  userId: String,
  type: String,
  username: String,
  socialAuth: [Schema],
  password: String,
  passwordChangeToken: String,
  refreshToken: String,
  rememberLoggedIn: Boolean,
  loginAttempts: Number,
  lockUntil: Number,
  image: String,
  gravatarId: String,
  agreementVersion: Number,
  contacts: [Contact],
  paymentOutType: Schema,
  offline: Boolean,
  disabled: Boolean,
  softDelete: Boolean,
  archive: Boolean,
};

const required = {
  type: true,
  password: true,
  contacts: true,
};

const indexes = {
  accountId: { sparse: true },
  type: { index: true },
  /* username : { unique: true }, */

};

export default {
  fields,
  required,
  indexes,
};
