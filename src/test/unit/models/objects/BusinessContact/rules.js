import mongoose from 'mongoose';
import models from '../../../../../src/models/consts/models';
import { Schema } from '../../../../utils/schemaHelper';

const { ObjectId } = mongoose.Schema.Types;

const fields = {
  userId: { type: ObjectId, ref: models.user },
  socialLinks: [Schema],
};

const required = {
};

const indexes = {
  userId: { unique: true },
};

export default {
  fields,
  required,
  indexes,
};
