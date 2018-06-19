import mongoose from 'mongoose';
import models from '../../../../../src/models/consts/models';
import { instances } from '../../../../utils/schemaTypes';
const { Date } = instances();

const fields = {
  start: Date,
  end: Date,
};

const required = {
  start: true,
  end: true,
};

const indexes = {
};

export default {
  fields,
  required,
  indexes,
};
