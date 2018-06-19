import m from './messages';
import c from './consts';

import log from '../utils/logger';

class sc {}

// TODO: make all ids unique and in ranges.
// TODO: perhaps add a category? I think cod      expect(res).e is category.
// TODO: I want these codes logged, so I can review which ones are called most often.

sc.INTERNAL_ERROR = {
  id: 500,
  status: 500,
  msg: 'internal error.',
};

sc.SUCCESS = {
  id: 1,
  status: 200,
  msg: m.OK,
};

sc.SUCCESSFUL_LOGIN = { id: 22, status: 201, msg: 'successfully logged in.' };
sc.SUCCESSFUL_LOGOUT = { id: 22, status: 205, msg: 'successfully logged out.' };
sc.SUCCESSFUL_UPDATE_WITH_TOKEN = { id: 22, status: 298, msg: 'successful update. new token returned.' };
sc.SUCCESSFUL_UPDATE = { id: 22, status: 299, msg: 'successful update.' };
sc.INVALID_PAGE = { id: 22, status: 422, msg: 'the page param must be an integer within 1 and 1000.' };

sc.PASSWORD_VERIFIED = {
  id: 400,
  status: 200,
  msg: 'the password has been verified.',
};

sc.EMAIL_VERIFIED = {
  id: 400,
  status: 422,
  msg: 'the email has been verified.',
};

sc.EMAIL_ALREADY_VERIFIED = {
  id: 400,
  status: 422,
  msg: 'the email has already been verified.',
};

sc.UPDATE_COMPLETED = {
  id: 200,
  status: 200,
  msg: 'The updated has complete.',
};

sc.UPDATE_COMPLETED_WITH_LOGOUT = {
  id: 200,
  status: 200,
  msg: 'The updated has complete. user is logged out.',
};

sc.SIGNUP_COMPLETE = {
  id: 202,
  status: 200,
  msg: 'signup is complete. confirm email, and login with credentials.',
};

sc.SIGNUP_NOT_COMPLETE = {
  id: 999,
  status: 470,
  msg: 'signup is not complete. check your input fields and re-submit.',
};

sc.NO_EXTRA_FIELDS = {
  id: 200,
  status: 445,
  msg: 'do not include invalid fields.',
};

sc.REMEMBERED_LOGGED_IN_INVALID = {
  id: 200,
  status: 446,
  msg: 'rememberLoggedIn param must be boolean true or false.',
};

sc.MUST_AUTHENTICATE = {
  id: 400,
  status: 421,
  msg: 'please enter login credentials.',
};

sc.CONTACT_LIMIT_REACHED = {
  id: 400,
  status: 421,
  msg: 'you have reached the maximum contacts allowed.',
};

sc.SPECIFY_CONTACT_INDEX = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid contact index.',
};

sc.SPECIFY_VERIFY_CODE = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid verification code.',
};

sc.NO_VERIFY_CODE_IN_USE = {
  id: 400,
  status: 421,
  msg: 'invalid; please request a new verification code.',
};

sc.NOT_A_BOOLEAN = {
  id: 400,
  status: 421,
  msg: 'value must be true or false.',
};

sc.INVALID_VERIFY_CODE = {
  id: 400,
  status: 421,
  msg: 'invalid verification code.',
};

sc.EMAIL_VERIFIED = {
  id: 200,
  status: 221,
  msg: 'email has been verified.',
};

sc.OLD_EMAIL_REQUIRED = {
  id: 400,
  status: 221,
  msg: 'current email is required.',
};

sc.NEW_EMAIL_REQUIRED = {
  id: 400,
  status: 421,
  msg: 'new email is required.',
};

sc.EMAIL_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'that email was not found.',
};

sc.OLD_EMAIL_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'current email was not found.',
};

sc.NEW_EMAIL_IN_USE = {
  id: 400,
  status: 421,
  msg: 'new email is already in use.',
};

sc.SPECIFY_OLD_EMAIL = {
  id: 400,
  status: 421,
  msg: 'current email is required.',
};

sc.SPECIFY_NEW_EMAIL = {
  id: 400,
  status: 421,
  msg: 'new email is required.',
};

sc.SPECIFY_OLD_ALT_EMAIL = {
  id: 400,
  status: 421,
  msg: 'current alt email is required.',
};

sc.SPECIFY_NEW_ALT_EMAIL = {
  id: 400,
  status: 421,
  msg: 'new alt email is required.',
};

sc.CANT_DELETE_PRIMARY_CONTACT = {
  id: 400,
  status: 421,
  msg: 'cannot delete the primary contact.',
};

sc.PROFILE_NAME_IN_USE = {
  id: 400,
  status: 421,
  msg: 'you have already used that profile name.',
};

sc.SUBSCRIPTION_ID_IN_USE = {
  id: 400,
  status: 421,
  msg: 'you have already added that subscription.',
};

sc.SUBSCRIPTION_ID_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'you do not have that subscription.',
};

sc.SERVICE_ID_IN_USE = {
  id: 400,
  status: 421,
  msg: 'you have already added that service.',
};

sc.SERVICE_ID_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'you do not have that service.',
};

sc.SUBSCRIPTION_ALREADY_CANCELLED = {
  id: 400,
  status: 421,
  msg: 'subscription already cancelled.',
};

sc.SUBSCRIPTION_ALREADY_RESUMED = {
  id: 400,
  status: 421,
  msg: 'subscription already resumed.',
};

sc.SUBSCRIPTION_ALREADY_PAUSED = {
  id: 400,
  status: 421,
  msg: 'subscription already paused.',
};

sc.PROFILE_ID_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'that profile id was not found.',
};

sc.PAYMENT_ID_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'that payment id was not found.',
};

sc.INVALID_PROFILE_ID = {
  id: 400,
  status: 421,
  msg: 'that profile id is invalid',
};

sc.PROFILE_LIMIT_REACHED = {
  id: 400,
  status: 421,
  msg: 'you have reached the maximum profiles allowed.',
};

sc.SPECIFY_PROFILE_INDEX = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid profile index.',
};

sc.SPECIFY_NEW_USERNAME = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid new username.',
};

sc.SPECIFY_PROFILE_ID = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid profile id.',
};

sc.SPECIFY_DEVICE_ID = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid device id.',
};

sc.SPECIFY_DEVICE_ID = {
  id: 400,
  status: 421,
  msg: 'you must specify a valid device id.',
};

sc.INVALID_DEVICE_ACTIVATION_CODE = {
  id: 400,
  status: 421,
  msg: 'invalid device activation code.',
};

sc.DEVICE_ALREADY_ACTIVATED = {
  id: 400,
  status: 421,
  msg: 'device already activated.',
};


sc.CANT_DELETE_PRIMARY_PROFILE = {
  id: 400,
  status: 421,
  msg: 'cannot delete the main profile.',
};

sc.SPECIFY_ONE_SETTING = {
  id: 400,
  status: 421,
  msg: 'you must specify one setting.',
};

sc.SPECIFY_ONE_INDEX = {
  id: 400,
  status: 421,
  msg: 'you must specify one valid index.',
};

sc.INVALID_SETTING_VALUE = {
  id: 400,
  status: 421,
  msg: 'invalid setting value.',
};

sc.INVALID_SETTING_STORE = {
  id: 400,
  status: 421,
  msg: 'invalid setting store.',
};

sc.SPECIFY_SETTINGS = {
  id: 400,
  status: 421,
  msg: 'you must specify settings.',
};

sc.INVALID_SETTINGS = {
  id: 400,
  status: 421,
  msg: 'invalid settings.',
};

sc.INVALID_SETTING = {
  id: 400,
  status: 421,
  msg: 'specified an invalid setting.',
};

sc.PROPERTY_NOT_WRITABLE = {
  id: 400,
  status: 421,
  msg: 'that setting is not writable',
};

sc.PROPERTY_NOT_ENABLED = {
  id: 400,
  status: 421,
  msg: 'that setting is not enabled',
};

sc.INVALID_PARAMETERS = {
  id: 400,
  status: 421,
  msg: 'payload contains invalid function parameters',
};

sc.INVALID_SETTING_STORE_TYPE = {
  id: 400,
  status: 421,
  msg: 'that is not a valid setting store type.',
};

sc.PROPERTY_NOT_FOUND = {
  id: 400,
  status: 421,
  msg: 'that setting was not found.',
};

sc.INVALID_DEVICE_CREDENTIALS = {
  id: 400,
  status: 418,
  msg: 'invalid authentication credentials. no device found.',
};

sc.REQUIRED_EMAIL_OR_USERNAME = {
  id: 400,
  status: 418,
  msg: 'username or password is required, but not both.',
};

sc.DEVICE_REQUIRED = {
  id: 400,
  status: 418,
  msg: 'at least 1 valid device is required.',
};

sc.INVALID_USER = {
  id: 400,
  status: 419,
  msg: 'not authenticated. that is an invalid user.',
};

sc.INVALID_USERNAME = {
  id: 400,
  status: 423,
  msg: 'not authenticated. that is an invalid username. please login again.',
};

sc.NOT_AUTHENTICATED = {
  id: 400,
  status: 400,
  msg: 'not authenticated. please login first.',
};

sc.NOT_AUTHORIZED = {
  id: 400,
  status: 401,
  msg: 'not authenticated. please login first.',
};

sc.ALREADY_AUTHENTICATED = {
  id: 400,
  status: 402,
  msg: 'already authenticated. logout first.',
};

sc.PASSWORD_NOT_VERIFIED = {
  id: 400,
  status: 302,
  msg: 'the password is incorrect.',
};


sc.INVALID_AUTH_CREDENTIALS = {
  id: 400,
  status: 410,
  msg: 'invalid authentication credentials.',
};

sc.MUST_AGREE_TO_TERMS = {
  id: 400,
  status: 414,
  msg: 'you must agree to terms.',
};

sc.NEED_ALL_REQUIRED_FIELDS = {
  id: 400,
  status: 411,
  msg: 'please fill out all required fields.',
};

sc.FIELD_VALIDATION_ERRORS = {
  id: 400,
  status: 449,
  msg: 'field validation errors.',
};

sc.NEW_USERNAME_REQUIRED = {
  id: 400,
  status: 499,
  msg: 'the new username field is required.',
};

sc.PASSWORD_REQUIRED = {
  id: 400,
  status: 499,
  msg: 'the password is required.',
};

sc.NEW_PASSWORD_REQUIRED = {
  id: 400,
  status: 499,
  msg: 'the new password is required.',
};

sc.NEW_PASSWORD_CANNOT_BE_SAME = {
  id: 400,
  status: 499,
  msg: 'the new password cannot be the same as the old password.',
};

sc.OLD_PASSWORD_MUST_MATCH = {
  id: 400,
  status: 499,
  msg: 'the old password must match the current password.',
};

sc.OLD_PASSWORD_REQUIRED = {
  id: 400,
  status: 499,
  msg: 'the old password is required.',
};

sc.NEW_PASSWORD_FIELD_REQUIRED = {
  id: 400,
  status: 499,
  msg: 'the new password field is required.',
};

sc.USERNAME_ALREADY_EXISTS = {
  id: 400,
  status: 498,
  msg: 'that username already exists.',
};

sc.ACCOUNT_NOW_LOCKED = {
  id: 400,
  status: 420,
  msg: 'you have reached the maximum login attempts.' +
    `your account is locked for ${c.LOCK_TIME / 60} minutes.`,
};

sc.ACCOUNT_IS_LOCKED = {
  id: 400,
  status: 420,
  msg: 'this user is locked. See your email for the time it will be unlocked.',
};

sc.DISABLED_ACCOUNT = {
  id: 400,
  status: 420,
  msg: 'this account is disabled. contact support.',
};

sc.ACCOUNT_NOT_ACCESSIBLE = {
  id: 400,
  status: 420,
  msg: 'this account is not accessable. contact support.',
};

sc.INVALID_APP_ACCOUNT = {
  id: 400,
  status: 499,
  msg: 'invalid app account.',
};

sc.PROFANITY_REJECT_NAME = {
  id: 400,
  status: 450,
  msg: 'your name and username cannot contain profanity.',
};

sc.INVALID_INPUT = {
  id: 400,
  status: 450,
  msg: 'your name and username cannot contain profanity.',
};

sc.TESTING_ROUTE = {
  id: 200,
  status: 298,
  msg: 'testing route.',
};

sc.INVALID_ACCOUNT_ID = {
  id: 400,
  status: 421,
  msg: 'invalid account id.',
};

Object.freeze(sc);

export default sc;
