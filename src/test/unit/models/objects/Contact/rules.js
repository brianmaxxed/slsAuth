import models from '../../../../../src/models/consts/models';
import { Schema, String } from '../../../../utils/schemaHelper';

const fields = {
  email: String,
  alternateEmail: String,
  firstName: String,
  middleName: String,
  lastName: String,
  displayName: String,
  title: String,
  phone: [{ type: Schema }],
  socialLinks: [Schema],
  _id: false,
};

const required = {
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
};

const indexes = {
  email: { unique: true },
  alternateEmail: { unique: true, sparse: true },
};

export default {
  fields,
  required,
  indexes,
};
