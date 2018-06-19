
import c from '../../../../src/config/consts';

export default {
  name: 'accountId',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    200,
    'z'.repeat(50),
    'zzzzzz!!',
    '123',
  ],
  valids: [
    '012345',
    '0123xxxx1234',
    'abdmdkw923123nsd23slad',
    'v'.repeat(15),
  ],
};
