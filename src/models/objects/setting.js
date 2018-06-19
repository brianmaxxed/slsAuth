/* eslint no-void: 0 */
import { Schema } from 'mongoose';

const setting = {
  name: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  type: { type: String, required: true },
  _id: false,
};

export default setting;
