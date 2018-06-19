/* eslint no-void: 0 */
import mongoose from 'mongoose';
import events from '../enums/userHistoryEvents';
import types from '../enums/userHistoryTypes';
import models from '../consts/models';
import error from '../objects/error';

const { Schema } = mongoose;

const UserHistorySchema = new Schema({
  userId: { type: String, required: true },
  accountId: { type: String, required: true },
  event: { type: String, required: true, enum: events },
  type: { type: String, required: true, enum: types },
  deviceId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  timeZone: { type: String }, // to be enum or lookup or kept as string
  location: { type: Object, default: void 0 }, // can put in long/lat
  data: { type: Object },
  problems: { type: [error], default: void 0 },
}, { autoIndex: false, timestamps: true, collection: models.userHistory });

UserHistorySchema.index({
  userId: 1,
  accountId: 1,
  event: 1,
  type: 1,
}, { unique: true });

export default UserHistorySchema;
