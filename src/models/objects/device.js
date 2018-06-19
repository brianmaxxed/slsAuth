/* eslint no-void: 0 */

import deviceTypes from '../enums/deviceTypes';

const device = {
  deviceId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: deviceTypes },
  ip: { type: String },
  userAgent: { type: String },
  activated: { type: Boolean },
  activationCode: { type: String },
  loggedIn: { type: Boolean },
  forceLogout: { type: Boolean },
  refreshToken: {
    type: String, hideJSON: true,
  },
  rememberLoggedIn: { type: Boolean },
  timeZone: { type: String },
  location: { type: Object, default: void 0 }, // can put in long/lat, don't neccessarily try as it will give a security warning.
  lastLoginTime: { type: Number },
  loginAttempts: { type: Number, default: void 0 },
  lastLoginAttemptTime: { type: Number },
  lockUntil: { type: Number }, // TODO: need to make sure other softer strategies work too.
  _id: false,
};

export default device;
