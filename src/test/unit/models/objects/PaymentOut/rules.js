import mongoose from 'mongoose';
import models from '../../../../../src/models/consts/models';
import { instances } from '../../../../utils/schemaTypes';
const {   String } = instances();

const fields = {
  type: String, // enum: paymentOutTypes },
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
