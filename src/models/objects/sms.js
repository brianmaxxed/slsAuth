const sms = {
  type: { type: String, required: true },
  phone: { type: String, required: true },
  sendSMS: { type: Boolean },
  _id: false,
};

export default sms;
