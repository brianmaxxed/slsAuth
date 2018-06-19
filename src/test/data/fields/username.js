
import c from '../../../../src/config/consts';

export default {
  name: 'username',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    200,
    'z'.repeat(50),
    '123',
    '123)11',
    'b!+@gcom',
  ],
  valids: [
    'bill@somewhere.com',
    'chuck@hello.com',
    'brian@smooth.com',
  ],
};
