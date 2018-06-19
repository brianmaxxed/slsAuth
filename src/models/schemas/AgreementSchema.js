import mongoose, { Schema } from 'mongoose';

import models from '../consts/models';
import log from '../../utils/logger';

const agreement = new Schema({
  version: { type: Number, required: true, unique: true },
  data: { type: String },
  started: { type: Date },
  ended: { type: Date },
  isCurrent: { type: Boolean, required: true, default: false },
}, { autoIndex: false, timestamps: true, collection: models.agreement });

export default agreement;
