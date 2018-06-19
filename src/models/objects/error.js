/* eslint no-void: 0 */
const error = {
  name: { type: String, required: true, index: true },
  type: { type: String, required: true },
  status: { type: Number, required: true },
  message: { type: String, required: true },
};

export default error;
