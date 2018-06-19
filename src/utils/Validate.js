/* eslint guard-for-in: 0, no-restricted-syntax:0,
  no-useless-escape:0, no-useless-concat:0, quotes: 0,
  no-shadow: 0 */

import _ from 'lodash';
import env from '../config/env';
import c from '../config/consts';
import sc from '../config/statusCodes';
import ec from '../config/errorCodes';
import CustomError from '../utils/CustomError';
import vMap from '../config/validationMap';
import redisClient from '../config/redisClient';
import { keys, vals } from '../config/endpointMap';
import h, { errorObject } from '../utils/helper';
import log from '../utils/logger';
import objs from '../models/objects';
import stores from '../models/propertyStores';
import enums from '../models/enums';


// TODO properly test all validation methods and min, max. all params

export default class Validate {
  static validPunc() {
    return String.raw`!\#$%&\'()*+,\-\.@_`;
  }
  static email(val, type = 'email') {
    const str = String.raw`^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$`;
    const re = new RegExp(str);
    return Validate.test(
      re,
      val,
      type,
      `please enter a valid ${type}.`,
    );
  }

  static username(val, type = 'username', min = 3, max = 16) {
    const re = new RegExp(String.raw`^[a-z](?:[a-z\d]|[-_](?=[a-z\d])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain lowecase letters, numbers, _, or -, ${min}-${max} length, no begining or ending hyphen, and no spaces.`,
    );
  }

  static settingName(val, type = 'settingName', min = 3, max = 16) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z\d](?=[a-zA-Z\d])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain lowecase letters, numbers, _, or -, ${min}-${max} length, no begining or ending hyphen, and no spaces.`,
    );
  }

  static accountId(val, type = 'accountId', min = 4, max = 40) {
    const re = new RegExp(String.raw`^[a-zA-Z\d]{${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} is invalid.`,
    );
  }

  static password(val, type = 'password', min = 8, max = 16) {
    const re = new RegExp(String.raw`^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} requires 1 lowercase letter, ` +
          `1 uppercase letter, 1 digit, 1 special character [#$@!%*?&], ${min}-${max} length, and no spaces.`,
    );
  }

  static dummy(val, type = 'dummy') {
    return { valid: true, type, msg: 'dummy.' };
  }

  static agreementVersion(val, type = 'agreementVersion', min = 1, max = 10) {
    const re = new RegExp(String.raw`^[\d]{${min},${max}}$`);
    return Validate.test(re, val, type, 'terms of agreement must be accepted.');
  }

  static profileName(val, type = 'profileName', min = 3, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z0-9${Validate.validPunc}]{${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain ${min}-${max} characters`,
    );
  }

  static id(val, type = 'id', min = 10, max = 40) {
    const re = new RegExp(String.raw`^[a-zA-Z\d]{${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain ${min}-${max} alphanumeric characters.`,
    );
  }

  static verifyCode(val, type = 'verifyCode', min = 5, max = 15) {
    const re = new RegExp(String.raw`^[a-zA-Z\d]{${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain ${min}-${max} alphanumeric characters.`,
    );
  }

  static name(val, type = 'name', min = 1, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z]|[ ](?=[a-zA-Z])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain letters, spaces, ${min}-${max} length, no begining non-letters.`,
    );
  }

  static title(val, type = 'title', min = 3, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z]|[ ](?=[a-zA-Z])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain letters, spaces, ${min}-${max} length, no begining non-letters.`,
    );
  }

  static timezone(val, type = 'timezone', min = 3, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z]|[ ](?=[a-zA-Z])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain letters, spaces, ${min}-${max} length, no begining non-letters.`,
    );
  }

  static trial(val, type = 'trial') {
    return Validate.boolean(
      val,
      type,
      `${type} must be true or false`,
    );
  }

  static enabled(val, type = 'enabled') {
    return Validate.boolean(
      val,
      type,
      `${type} must be true or false`,
    );
  }

  static phone(val, type = 'phone', min = 3, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z]|[ ](?=[a-zA-Z])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain letters, spaces, ${min}-${max} length, no begining non-letters.`,
    );
  }

  static bithdate(val, type = 'birthdate', min = 3, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z]|[ ](?=[a-zA-Z])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain letters, spaces, ${min}-${max} length, no begining non-letters.`,
    );
  }

  static setting(val, type = 'setting', min = 3, max = 25) {
    const re = new RegExp(String.raw`^[a-zA-Z](?:[a-zA-Z]|[ ](?=[a-zA-Z])){${min},${max}}$`);
    return Validate.test(
      re,
      val,
      type,
      `${type} must contain letters, spaces, ${min}-${max} length, no begining non-letters.`,
    );
  }

  static hasOnlyOne(obj = {}, fields = []) {
    const verify = {
      valid: false,
      field: {},
      errors: [],
    };

    const field = h.hasOnlyOne(obj, fields);
    if (field.length !== 1) {
      verify.errors = h.wrapErrorCode(sc.REQUIRED_EMAIL_OR_USERNAME);
      return Validate.payloadObject(verify.errors);
    }

    verify.valid = true;
    [verify.field] = field;
    return verify;
  }

  static payloadObject(errors = []) {
    if (errors.length > 0) {
      return {
        valid: false,
        id: sc.FIELD_VALIDATION_ERRORS.id,
        status: sc.FIELD_VALIDATION_ERRORS.status,
        msg: sc.FIELD_VALIDATION_ERRORS.msg,
        errors,
      };
    }

    return {
      valid: true,
      errors,
    };
  }

  static test(re, val, type, msg) {
    const results = (val && re.test(val)) === true;
    return { valid: results, type, msg: !results ? msg : '' };
  }

  static boolean(val, type, msg) {
    const results = (typeof val === 'boolean');
    return { valid: results, type, msg: !results ? msg : '' };
  }


  // not in use.
  /*
  static acceptTerms(val, type = 'boolean') {
    // return { valid: (val === true), type: 'acceptTerms', msg: 'acceptTerms must be true' };
  }
  */

  static requireSelectedFields(fields, required) {
    let passed = true;

    required.forEach((field) => {
      if (!(field in fields)) {
        passed = false;
      }
    });

    return false;
  }

  static clearedValidation(results) {
    let test = results;
    if (!Array.isArray(test)) {
      test = [test];
    }

    const errors = [];

    test.forEach((output) => {
      if (output && !output.valid) {
        errors.push({
          error: {

            type: output.type,
            msg: output.msg,
          },
        });
      }
    });

    return Validate.payloadObject(errors);
  }

  static check(req, fields, type = 'body') {
    const list = Array.isArray(fields) ? fields : [fields];
    const map = Object.keys(vMap);
    const validations = [];

    try {
      if (type !== 'params' && type !== 'body') {
        throw new CustomError(ec.INVALID_FIELD_SOURCE_TYPE, `check ${type}`);
      }

      list.forEach((field) => {
        if (map.includes(field)) {
          const param = type === 'params' && 'param' in vMap[field] ? vMap[field].param : field;
          validations.push(Validate[vMap[field].func](_.get(req, `${type}.${param}`), field));
        } else {
          // log.dir(field);
          throw new CustomError(ec.INVALID_VALIDATION_FIELD, field);
        }
      });

      return Validate.clearedValidation(validations);
    } catch (e) {
      return {
        valid: false,
        errors: h.unhandledErrorObject(e),
      };
    }
  }

  // validates device obj matches schema
  static async deviceSchema(device = {}) {
    const output = {
      valid: false,
      errors: [],
    };

    // TODO for later; can ignore for now. use for tighter control of db.

    output.valid = (output.errors.length === 0);
    return output;
  }

  // validates input fields
  static async device(device = {}, devices = [], bUserInput = false) {
    const output = {
      valid: false,
      errors: [],
    };

    // user input is name and type and validate the device types via the enum.
    // the name of the device is unique for the devices. add a number to the end if one already exists.
    // iphone6_1; don't be too cute here.

    output.valid = (output.errors.length === 0);
    return output;
  }

  static async devices(devices = []) {
    const output = {
      valid: false,
      errors: [],
    };

    // validate devices;
    await h.asyncForEach(devices, async (device) => {
      const check = await Validate.device(device, devices);
      if (!check.valid) {
        output.errors.push(...check.errors);
      }
    });

    output.valid = (output.errors.length === 0);
    return output;
  }

  static async profileSchema(profile = {}, bUserInput = false) {
    const output = {
      valid: false,
      errors: [],
    };

    // TODO for later; can ignore for now. use for tighter control of db.

    output.valid = (output.errors.length === 0);
    return output;
  }

  static async profile(profile = {}, profiles = [], bUserInput = false) {
    const output = {
      valid: false,
      errors: [],
    };

    output.valid = (output.errors.length === 0);
    return output;
  }

  static async profiles(profiles = []) {
    const output = {
      valid: false,
      errors: [],
    };

    // validate profiles
    await h.asyncForEach(profiles, async (profile) => {
      const check = await Validate.profile(profile, profiles);
      if (!check.valid) {
        output.errors.push(...check.errors);
      }
    });

    output.valid = (output.errors.length === 0);
    return output;
  }

  static settingIsInStore(field, store) {
    const settings = _.get(stores, store);
    return settings[field] === true;
  }

  static settingsAreInStore(fields = {}, store) {
    const settings = _.get(stores, store);

    const extras = Object.keys(fields).filter(field => !(field in settings));
    return extras.length < 1;
  }

  static requireUserTokenFields(user = {}) {
    const {
      accountId,
      userId,
      username,
      contacts,
      agreementVersion,
      contacts: [{
        email,
        firstName,
        lastName,
        displayName,
        talent,
      }],
    } = user;
  }
}
