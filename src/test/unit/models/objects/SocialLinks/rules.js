import models from '../../../../../src/models/consts/models';
import socialLinks from '../../../../../src/models/enums/socialLinks';
import { objectTypes } from '../../../../utils/schemaTypes';

const { String } = objectTypes();

const fields = {
  socialLinks: {
    brand: { type: String, enum: socialLinks, required: true },
    link: { type: String, required: true },
  },
};

const required = {
  socialLinks: {
    brand: true,
    link: true,
  },
};

const indexes = {
};

export default {
  fields,
  required,
  indexes,
};
