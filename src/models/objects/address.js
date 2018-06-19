const address = {
  company: { type: String, index: true },
  street1: { type: String, required: true },
  street2: { type: String },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  zipcode: { type: String, required: true, index: true },
  country: { type: String, required: true, index: true },
  timezone: { type: String, required: true, index: true },
  _id: false,
};

export default address;
