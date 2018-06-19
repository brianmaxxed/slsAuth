
import c from '../../../../src/config/consts';

export default {
  name: 'enabled',
  type: c.BOOLEAN,
  invalids: [
    undefined,
    null,
    2004,
    'zzzzzz!!',
    '!!',
  ],
  valids: [
    true,
    false,
  ],
};
