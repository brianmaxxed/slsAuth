import { instances } from '../../../../utils/schemaTypes';

const { Number } = instances();

const fields = {
  hours: Number,
  minutes: Number,
};

const required = {
  hours: true,
  minutes: true,
};

const indexes = {
};

export default {
  fields,
  required,
  indexes,
};
