import phoneTypes from '../enums/phoneTypes';

const phone = {
  nbr: { type: String },
  type: {
    type: String,
    enum: phoneTypes,
    required: true,
  },
  ext: { type: String },
  verificationCode: { type: String },
  verified: { type: Boolean },
  _id: false,
};

export default phone;
