/* eslint no-void: 0 */
import setting from '../objects/setting';
import profileTypes from '../enums/profileTypes';

const profile = {
  profileId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: profileTypes },
  preferences: { type: [setting], default: void 0 },
  image: { type: String }, // profile image
  gravatarId: { type: String },
  passwordEnabled: { type: Boolean },
  password: { type: String },
  mustChangePassword: { type: Boolean, hideJSON: true }, // <-- watch this hide thing. TODO
  forcedLogout: { type: Boolean, hideJSON: true }, // <-- watch this hide thing. TODO
  mustVerifyPassword: { type: Boolean, hideJSON: true },
  _id: false,
};

export default profile;
