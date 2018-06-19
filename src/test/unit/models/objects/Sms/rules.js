import models from '../../../../../src/models/consts/models';
import { instances } from '../../../../utils/schemaTypes';

const { String, Boolean } = instances();

const fields = {
  type: String,
  phone: String,
  sendSMS: Boolean,
};

const required = {
  type: true,
  phone: true,
};

const indexes = {
  phone: { unique: true },
};

export default {
  fields,
  required,
  indexes,
};
