/* eslint no-void: 0 */
import { Schema } from 'mongoose';

const item = {
  name: { type: String, required: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  type: { type: String, required: true },
  _id: false,
};

export default item;
