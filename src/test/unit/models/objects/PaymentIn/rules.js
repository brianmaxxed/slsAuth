import { Schema } from 'mongoose';
import models from '../../../../../src/models/consts/models';
import paymentInTypes from '../../../../../src/models/enums/paymentInTypes';
import { String } from '../../../../utils/schemaHelper';

const fields = {
  type: { type: String, enum: paymentInTypes },
  paymentId: String,
  firstName: String,
  lastName: String,
};

const required = {
  type: true,
  paymentId: true,
  firstName: true,
  lastName: true,
};

const indexes = {
};

export default {
  fields,
  required,
  indexes,
};
