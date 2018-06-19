import m from './messages';
import c from './consts';
import log from '../utils/logger';

class ec {}

// TODO: make all ids unique and in ranges.
// TODO: perhaps add a category? I think cod      expect(res).e is category.
// TODO: I want these codes logged, so I can review which ones are called most often.

ec.INTERNAL_ERROR = {
  id: 500,
  status: 500,
  msg: 'internal error.',
};

ec.ENUM_PROP_NOT_FOUND = {
  id: 10001,
  status: 400,
  msg: 'enum property does not exist.',
};

ec.INVALID_FIELD_SOURCE_TYPE = {
  id: 10001,
  status: 400,
  msg: 'invalid source field type, use: params or body.',
};

ec.INVALID_VALIDATION_FIELD = {
  id: 10002,
  status: 400,
  msg: 'that validation field is not in the validation map.',
};

ec.TEST = {
  id: 1,
  status: 1,
  msg: 'test',
};

Object.freeze(ec);

export default ec;
