import c from '../../../../src/config/consts';

export default {
  name: 'profileName',
  type: c.STRING,
  invalids: [
    undefined,
    null,
    'z'.repeat(50),
    22,
  ],
  valids: [
    'My Profile',
    'movieland',
    'profile 2',
  ],
};
