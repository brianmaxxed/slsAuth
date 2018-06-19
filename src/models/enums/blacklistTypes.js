
const blacklistTypes = [
  'authToken',
  'refreshToken',
  'username',
  'email',
  'creditCard', // hash this with a secret if I use.
  'password', // i can blacklist any field type I want.
  'country',
  'ipAddress',
  'domain',
  'phone',
  'password',
  'client',
];

export default blacklistTypes;
