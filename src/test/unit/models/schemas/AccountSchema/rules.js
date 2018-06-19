import mongoose from 'mongoose';
import models from '../../../../../src/models/consts/models';
import businessTypes from '../../../../../src/models/enums/businessTypes';
import { String, Schema, Boolean } from '../../../../utils/schemaHelper';

const { ObjectId } = mongoose.Schema.Types;


const fields = {
  accountId: String,
  agreementVersion: Number,
  contacts: Schema,
  businessName: String,
  address: Schema,
  industry: String,
  businessType: String,
  image: String,
  users: [{ type: ObjectId, ref: models.user }],
  reps: [{ type: ObjectId, ref: models.user }],
  jobs: [{ type: ObjectId, ref: models.Job }],
  offline: String,
  disabled: String,
  softDelete: String,
};

const required = {
  accountId: true,
  businessName: true,
  industry: true,
  businessType: true,
};

const indexes = {
  accountId: { unique: true },
  businessName: { index: true },
  industry: { index: true },
  users: { index: true },
  reps: { index: true },
  jobs: { index: true },
};

const enums = {
  businessType: { enum: businessTypes },
};

const refs = {
  users: [{ type: ObjectId, ref: models.user }],
  reps: [{ type: ObjectId, ref: models.user }],
  jobs: [{ type: ObjectId, ref: models.Job }],
};

export default {
  fields,
  required,
  indexes,
};
