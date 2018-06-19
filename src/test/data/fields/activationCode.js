
import c from '../../../../src/config/consts';

export default {
  name: 'activationCode',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    2004,
    'z'.repeat(50),
    'zzzzzz!!',
    '!!',
  ],
  valids: [
    '0123456',
    '23nsd23',
    'a'.repeat(6),
  ],
};
