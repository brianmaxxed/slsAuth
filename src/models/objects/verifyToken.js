const verifyToken = {
  code: { type: String },
  verified: { type: Boolean },
  exp: { type: Number },
  _id: false,
};

export default verifyToken;
