
import c from '../../../../src/config/consts';

export default {
  name: 'setting',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    200,
    'z'.repeat(50),
    'zzzzzz@',
    '12345@ss.c',
    'b!+@gcom',
  ],
  valids: [
    'bill@somewhere.com',
    'chuck@hello.com',
    'brian@smooth.com',
  ],
};
