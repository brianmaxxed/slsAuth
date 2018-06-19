
import c from '../../../../src/config/consts';

export default {
  name: 'password',
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
    '0wwWe!21s',
    'awWwe!21s',
    '33Wwe!23s',
  ],
};
