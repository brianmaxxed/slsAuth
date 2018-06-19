import mongoose from 'mongoose';
import { instances } from '../../../../utils/schemaTypes';

const {
  Boolean, Number, Schema, String,
} = instances();

const fields = {
  type: String,
  value: String,
  ttl: Number,
};

const required = {
  type: true,
  value: true,
};

const indexes = {
  type: { type: true },
  value: { index: true },
};

export default {
  fields,
  required,
  indexes,
};
