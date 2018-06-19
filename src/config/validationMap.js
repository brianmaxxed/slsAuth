import log from '../utils/logger';
import env from './env';
import c from '../config/consts';
import h from '../utils/helper';

export default {
  accountId: {
    param: 'accountId',
    func: 'accountId',
  },
  username: {
    param: 'username',
    func: 'username',
  },
  password: {
    param: 'password',
    func: 'password',
  },
  newPassword: {
    param: 'newPassword',
    func: 'password',
  },
  email: {
    param: 'email',
    func: 'email',
  },
  newEmail: {
    param: 'newEmail',
    func: 'email',
  },
  altEmail: {
    param: 'altEmail',
    func: 'email',
  },
  name: {
    param: 'name',
    func: 'dummy',
  },
  type: {
    param: 'type',
    func: 'name',
  },
  firstName: {
    param: 'firstName',
    func: 'dummy',
  },
  lastName: {
    param: 'lastName',
    func: 'dummy',
  },
  middleName: {
    param: 'middleName',
    func: 'dummy',
  },
  displayName: {
    param: 'displayName',
    func: 'dummy',
  },
  title: {
    param: 'title',
    func: 'dummy',
  },
  phone: {
    param: 'phone',
    func: 'dummy',
  },
  timezone: {
    param: 'timezone',
    func: 'dummy',
  },
  birthdate: {
    param: 'birthdate',
    func: 'dummy',
  },
  gender: {
    param: 'gender',
    func: 'dummy',
  },
  activationCode: {
    param: 'verifyCode',
    func: 'verifyCode',
  },
  verifyCode: {
    param: 'verifyCode',
    func: 'verifyCode',
  },
  profileName: {
    param: 'profileName',
    func: 'profileName',
  },
  settingName: {
    param: 'settingName',
    func: 'settingName',
  },
  profileId: {
    param: 'profileId',
    func: 'id',
  },
  deviceId: {
    param: 'deviceId',
    func: 'id',
  },
  subscriptionId: {
    param: 'subscriptionId',
    func: 'id',
  },
  serviceId: {
    param: 'serviceId',
    func: 'id',
  },
  paymentId: {
    param: 'paymentId',
    func: 'id',
  },
  setting: {
    param: 'setting',
    func: 'setting',
  },
  trial: {
    param: 'trial',
    func: 'enabled',
  },
  enabled: {
    param: 'trial',
    func: 'enabled',
  },
};
