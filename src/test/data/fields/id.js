
import c from '../../../../src/config/consts';

export default {
  name: 'id',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    200,
    'z'.repeat(50),
    'zzzzzz!!',
    '12345',
    12345,
    22,
  ],
  valids: [
    '012345678901234',
    'abdmdkw923123nsd23slad',
    'v'.repeat(15),
  ],
};
