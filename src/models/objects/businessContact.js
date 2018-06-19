/* eslint no-void: 0 */
import { Schema } from 'mongoose';

import models from '../consts/models';

const businessContact = {
  userId: { type: Schema.Types.ObjectId, ref: models.user, unique: true },
  _id: false,
};

export default businessContact;
