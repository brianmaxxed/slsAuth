import c from '../../../../src/config/consts';

export default {
  name: 'name',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    200,
    'z'.repeat(50),
    'zzzzzz!!',
    '12345@@',
    '12345$%',
    22,
  ],
  valids: [
    'My Profile',
    'movieland',
    'profile 2',
  ],
};
