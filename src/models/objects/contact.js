/* eslint no-void: 0 */
import phone from './phone';
import verifyToken from '../objects/verifyToken';
import genders from '../enums/genders';

const contact = {
  email: {
    type: String, required: true, lowercase: true,
  },
  altEmail: {
    type: String, lowercase: true,
  },
  notifications: { type: [Object], default: void 0 },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  displayName: { type: String, required: true },
  title: { type: String },
  // phone: { type: [phone], default: void 0 },
  phone: { type: String, default: void 0 },
  timezone: { type: String, default: void 0 },
  birthdate: { type: Date, default: void 0 },
  gender: { type: String, enum: genders, default: void 0 },
  verifyCode: { type: verifyToken, default: void 0 },
  emailVerified: { type: Boolean, default: void 0 },
  altVerifyCode: { type: verifyToken, default: void 0 },
  altVerified: { type: Boolean, default: void 0 },
  _id: false,
};

export default contact;
