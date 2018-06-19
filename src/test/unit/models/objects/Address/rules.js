import models from '../../../../../src/models/consts/models';
import { instances } from '../../../../utils/schemaTypes';

const { String } = instances();

const fields = {
  company: String,
  street1: String,
  street2: String,
  city: String,
  state: String,
  zipcode: String,
  country: String,
  timezone: String,
};

const required = {
  street1: true,
  city: true,
  state: true,
  zipcode: true,
  country: true,
  timezone: true,
};

const indexes = {
  company: { index: true },
  city: { index: true },
  state: { index: true },
  zipcode: { index: true },
  country: { index: true },
  timezone: { index: true },
};

export default {
  fields,
  required,
  indexes,
};
