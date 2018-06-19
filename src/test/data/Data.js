/* eslint quote-props:0, quotes:0, comma-dangle:0 */
import _ from 'lodash';
import uuidv4 from 'uuid/v4';
import jwt from 'jsonwebtoken';

import crypto from '../../utils/crypto';

import Account from '../../../src/models/Account';
import mc from '../utils/mongooseHelper';

import paymentMethods from './paymentMethods';
import fields from './fields';

import env from '../../config/env';
import c from '../../config/consts';
import sc from '../../config/statusCodes';
import log from '../../utils/logger';

const data = {
  newAccountId: undefined,
  paymentMethods,
  fields,
};

const tokens = {};

class Data {
  static accountInit() {
    const id = uuidv4();
    const accountId = id.toString().replace(/-/g, '');
    data.newAccountId = crypto.getHashids().encodeHex(accountId);
    log.silly('unique accountId created.', Data.accountId);
    Data.generateTokens();
    log.silly('tokens generated');
    log.silly('data ready; account setup.');

    return Data.accountId;
  }

  static async accountSetup() {
    const removed = await Account.Model.remove({ accountId: Data.accountId });
    const account = new Account.Model({
      accountId: Data.accountId,
      businessName: 'TEST',
      agreementVersion: 1.0,
      userAgreementVersion: 1.0,
      active: true,
    });

    const save = await account.save();
    return save;
  }

  static async accountRemove() {
    const removed = await Account.Model.remove({ accountId: Data.accountId });
    return removed;
  }

  static get accountId() {
    return data.newAccountId;
  }

  static get data() {
    return data;
  }

  static get tokens() {
    return tokens;
  }

  static get fields() {
    return data.fields;
  }

  static get paymentMethods() {
    return data.paymentMethods;
  }

  static get blacklistedAuthToken() {
    return {
      accountId: Data.accountId,
      type: 'authToken',
      value: 'fake-token',
      ttl: 1,
    };
  }

  static get blacklistedEmail() {
    return {
      type: 'email',
      value: 'test@testing.com',
      accountId: Data.accountId,
      ttl: 100,
    };
  }

  static get blacklistedPassword() {
    return {
      type: 'password',
      value: 'password',
      accountId: Data.accountId,
      ttl: 100,
    };
  }

  static get blacklistedUsername() {
    return {
      type: 'username',
      value: 'testing123',
      accountId: Data.accountId,
      ttl: 100,
    };
  }


  static get expiredAuthPayload() {
    return {
      "sub": "OjP8LPLVvMuk0607rKAq",
      "exp": 1422761718,
      "jti": "cd8f5f9f-e3e8-569f-87ef-f03c6cfc1111",
      "aud": "localhost",
      "deviceId": null,
      "accountId": Data.accountId,
      "type": "auth",
      "env": "development",
      "ip": "::1",
      "userAgent": "PostmanRuntime/7.1.1",
      "data": {
        "username": "bounty1",
        "email": "bounty1@someone.com",
        "firstName": "billy",
        "lastName": "bear",
        "displayName": "billy bear",
        "rememberLoggedIn": false,
        "agreementVersion": 1
      },
      "iat": 1522772159
    };
  }

  static get expiredRefreshPayload() {
    return {
      "sub": "5abb4ca95e6e6f86fbe1f59e",
      "exp": 1422725847,
      "jti": "d1479fd5-7c08-4984-a2ff-c10ef10r1111",
      "aud": "localhost",
      "type": "refresh",
      "env": "development",
      "ip": "::1",
      "userAgent": "PostmanRuntime/7.1.1",
      "accountId": Data.accountId,
      "deviceId": null,
      "iat": 1522772275,
    };
  }

  static generateTokens() {
    // token = jwt.sign(payload, env.jwtAuthSecret);
    tokens.expiredAuthToken = jwt.sign(Data.expiredAuthPayload, env.jwtAuthSecret);
    tokens.expiredRefreshToken = jwt.sign(Data.expiredRefreshPayload, env.jwtRefreshSecret);

    tokens.longLifeAuthToken = jwt.sign(Data.longLifeAuthPayload, env.jwtAuthSecret);
    tokens.longLifeRefreshToken = jwt.sign(Data.longLifeRefreshPayload, env.jwtRefreshSecret);
    tokens.validAuthToken = tokens.longLifeAuthToken;
    tokens.validRefreshToken = tokens.longLifeRefreshToken;
    tokens.invalidAuthToken = '123456';
  }

  static get expiredAuthToken() {
    return tokens.expiredAuthToken;
  }

  static get expiredRefreshToken() {
    return tokens.expiredRefreshToken;
  }

  static get validAuthToken() {
    return tokens.validAuthToken;
  }

  static get validRefreshToken() {
    return tokens.validRefreshToken;
  }

  static get invalidAuthToken() {
    return tokens.invalidAuthToken;
  }

  static get invalidUserAuthToken() {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4QTIxbVFrOTRLYzAyQmxYNllXOSIsImlhdCI6MTUyMjc4NzYwNCwiZXhwIjoxNjIyNzg3NjA0LCJqdGkiOiJjZDhmNWY5Zi1lM2U4LTU2OWYtODdlZi1mMDNjNmNmYzI5YmMiLCJhdWQiOiJsb2NhbGhvc3QiLCJhY2NvdW50SWQiOiIxMjM0NSIsImRldmljZUlkIjpudWxsLCJ0eXBlIjoiYXV0aCIsImVudiI6ImRldmVsb3BtZW50IiwiaXAiOiI6OjEiLCJ1c2VyQWdlbnQiOiJQb3N0bWFuUnVudGltZS83LjEuMSIsImRhdGEiOnsidXNlcm5hbWUiOiJib3VudHk0IiwiZW1haWwiOiJiaWxseTRAc29tZW9uZS5jb20iLCJmaXJzdE5hbWUiOiJiaWxseSIsImxhc3ROYW1lIjoiYmVhciIsImRpc3BsYXlOYW1lIjoiYmlsbHkgYmVhciIsInJlbWVtYmVyTG9nZ2VkSW4iOmZhbHNlLCJhZ3JlZW1lbnRWZXJzaW9uIjoxfX0.37lW3yy6UTK-GObmXxxzq7bTETwJIS3KCu4zF-Q7_4E';
  }

  static get validTokenHeader() {
    return {
      headers: {
        authorization: `Bearer ${tokens.validAuthToken}`,
      },
    };
  }

  static get expiredTokenHeader() {
    return {
      headers: {
        authorization: `Bearer ${tokens.expiredAuthToken}`,
      },
    };
  }

  static get invalidTokenHeader() {
    return {
      headers: {
        authorization: `Bearer ${Data.invalidAuthToken}`,
      },
    };
  }

  static get invalidProfileIdOutput() {
    return {
      id: sc.FIELD_VALIDATION_ERRORS.id,
      status: sc.FIELD_VALIDATION_ERRORS.status,
      msg: sc.FIELD_VALIDATION_ERRORS.msg,
      errors: [
        {
          error: {
            msg: 'profileId must contain 5-40 alphanumeric characters.',
            type: 'profileId',
          },
        }],
    };
  }

  static get invalidProfileNameAndIdOutput() {
    return {
      id: sc.FIELD_VALIDATION_ERRORS.id,
      status: sc.FIELD_VALIDATION_ERRORS.status,
      msg: sc.FIELD_VALIDATION_ERRORS.msg,
      errors: [
        {
          error: {
            msg: 'profileName must contain 3-20 characters',
            type: 'profileName',
          },
        },
        {
          error: {
            msg: 'profileId must contain 5-40 alphanumeric characters.',
            type: 'profileId',
          },
        }],
    };
  }

  static get invalidProfileNameOutput() {
    return {
      id: sc.FIELD_VALIDATION_ERRORS.id,
      status: sc.FIELD_VALIDATION_ERRORS.status,
      msg: sc.FIELD_VALIDATION_ERRORS.msg,
      errors: [
        {
          error: {
            msg: 'profileName must contain 3-20 characters',
            type: 'profileName',
          },
        },
      ],
    };
  }

  static get invalidUserAuthPayload() {
    return {
      "sub": "xA21mQk94Kc02BlX6YW9",
      "iat": 1522787604,
      "exp": 1622787604,
      "jti": "cd8f5f9f-e3e8-569f-87ef-f03c6cfc29bc",
      "aud": "localhost",
      "accountId": "12345",
      "deviceId": null,
      "type": "auth",
      "env": "development",
      "ip": "::1",
      "userAgent": "PostmanRuntime/7.1.1",
      "data": {
        "username": "bounty4",
        "email": "billy4@someone.com",
        "firstName": "billy",
        "lastName": "bear",
        "displayName": "billy bear",
        "rememberLoggedIn": false,
        "agreementVersion": 1
      }
    };
  }

  static get longLifeAuthPayload() {
    return {
      "sub": "Ql61qMLA0AsMqOYlv1Ay",
      "iat": 1522771822,
      "exp": 8422224371,
      "jti": "cd8f5f9f-e3e8-569f-87ef-f03c6cfc1111",
      "aud": "localhost",
      "env": "development",
      "type": "auth",
      "accountId": Data.accountId,
      "deviceId": null,
      "ip": "::1",
      "userAgent": "PostmanRuntime/7.1.1",
      "data": {
        "username": "bounty1",
        "email": "billy1@someone.com",
        "firstName": "billy",
        "lastName": "bear",
        "displayName": "billy bear",
        "rememberLoggedIn": false,
        "agreementVersion": 1
      }
    };
  }

  static get validAuthPayload() {
    return Data.longLifeAuthPayload;
  }

  static get longLifeAuthToken() {
    return tokens.longLifeAuthToken;
  }

  static get longLifeRefreshPayload() {
    return {
      "sub": "5abb4ca95e6e6f86fbe1f59e",
      "exp": 5022231571,
      "jti": "cd8f5f9f-e3e8-569f-87ef-f03c6cfr2222",
      "aud": "localhost",
      "accountId": Data.accountId,
      "deviceId": null,
      "type": "refresh",
      "env": "development",
      "ip": "::1",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0.3 Safari/604.5.6",
      "iat": 1522771941
    };
  }

  static get validRefreshPayload() {
    return Data.longLifeRefreshPayload;
  }

  static get longLifeRefreshToken() {
    return tokens.longLifeRefreshToken;
  }

  static get newUnverifiedUser() {
    return {
      userId: '1',
      accountId: Data.accountId,
      username: 'bounty1',
      password: 'tesTing!123',
      type: 'user',
      contacts: [{
        email: 'billy1@someone.com',
        firstName: 'billy',
        lastName: 'bear',
        displayName: 'Billy Bear',
      }],
      agreementVersion: 1,
    };
  }

  static get newVerifiedUser() {
    return {
      userId: '134',
      accountId: Data.accountId,
      username: 'bounty1',
      password: 'tesTing!123',
      type: 'user',
      contacts: [{
        email: 'billy1@someone.com',
        firstName: 'billy',
        lastName: 'bear',
        displayName: 'Billy Bear',
      }],
      agreementVersion: 1,
      usernameVerified: true,
    };
  }

  static get newUserGood1() {
    return {
      accountId: Data.accountId,
      userId: 'Ql61qMLA0AsMqOYlv1Ay',
      username: 'bounty1',
      password: 'tesTing!123',
      type: 'user',
      contacts: [{
        email: 'billy1@someone.com',
        firstName: 'billy',
        lastName: 'bear',
        displayName: 'Billy Bear',
      }],
      profiles: [{
        profileId: 'abcdefghijklmnop1',
        name: 'billy',
        type: 'main',
      }],
      devices: [{
        deviceId: '0123456789012c1',
        name: 'default',
        type: 'default',
        ip: '0.0.0.0',
        userAgent: 'TESTING',
        activated: true,
      }],
      agreementVersion: 1,
    };
  }

  static get newUserGood2() {
    return {
      accountId: Data.accountId,
      userId: '2',
      username: 'bounty2',
      password: 'testing',
      type: 'user',
      contacts: [{
        email: 'mary@someone.com',
        firstName: 'mary',
        lastName: 'bear',
        displayName: 'Billy Bear',
      }],
      profiles: [{
        profileId: 'abcdefghijklmnop2',
        name: 'mary',
        type: 'main'
      }],
      devices: [{
        deviceId: '0123456789012c2',
        name: 'default',
        type: 'default',
        ip: '0.0.0.0',
        userAgent: 'TESTING',
        activated: true,
      }],
      agreementVersion: 1,
    };
  }

  static get newUserGood3() {
    return {
      accountId: Data.accountId,
      userId: '3',
      username: 'bounty3',
      password: 'testing',
      type: 'user',
      contacts: [{
        email: 'steve@someone.com',
        firstName: 'steve',
        lastName: 'bear',
        displayName: 'Billy Bear',
      }],
      profiles: [{
        profileId: 'abcdefghijklmnop3',
        name: 'steve',
        type: 'main',
      }],
      devices: [{
        deviceId: '0123456789012c3',
        name: 'default',
        type: 'default',
        ip: '0.0.0.0',
        userAgent: 'TESTING',
        activated: true,
      }],
      agreementVersion: 1,
    };
  }

  static get newGoodContact1() {
    return {
      email: 'brenda@brenda.com',
      firstName: 'Brenda',
      middleName: 'A',
      lastName: 'Smith',
      displayName: 'Brenda',
      title: 'President',
      phone: '1-917-334-4443',
      timezone: 'America/Los_Angeles',
      birthdate: '11/01/1980',
      gender: 'not specified',
    };
  }

  static get newGoodContact2() {
    return {
      email: 'martha@somewhere.com',
      firstName: 'Martha',
      middleName: 'G',
      lastName: 'Glendale',
      displayName: 'Martha Glendale',
      title: 'Owner',
      phone: '1-917-334-4443',
      timezone: 'America/Los_Angeles',
      birthdate: '11/01/1980',
      gender: 'not specified',
    };
  }

  static get newGoodContact3() {
    return {
      email: 'dave@somewhere.com',
      firstName: 'Dave',
      lastName: 'Chuck',
    };
  }

  static get reqSignupFieldsArray() {
    return [
      'accountId',
      'firstName',
      'lastName',
      'email',
      'username',
      'password',
      'agreementVersion',
    ];
  }

  static get signupInvalidFields() {
    return {
      accountId: Data.accountId,
      username: 'b$',
      password: 'testing',
      email: 'billysomeone.com',
      firstName: 'Billy',
      lastName: 'Bob',
      agreementVersion: 'yes',
    };
  }

  static get signupInvalidProfanity() {
    return {
      accountId: Data.accountId,
      username: 'ass1234',
      password: 'tesTing!112',
      email: 'billy1@someone.com',
      firstName: 'dirt bag',
      lastName: 'fuck',
      agreementVersion: 1,
    };
  }

  static get signupValidFields() {
    return {
      "accountId": Data.accountId,
      "username": "bounty1",
      "password": "tesTing!123",
      "email": "billy1@someone.com",
      "firstName": "billy",
      "lastName": "bear",
      "agreementVersion": 1,
    };
  }

  static get successfulLoginPayload() {
    return {
      "status": 201,
      "data": {
        "auth": {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJRbDYxcU1MQTBBc01xT1lsdjFBeSIsImlhdCI6MTUyMjIyNDM3MSwiZXhwIjoxNjIyMjI0MzcxLCJ0eXBlIjoiYXV0aCIsImVudiI6ImRldmVsb3BtZW50IiwiZG9tYWluIjoibG9jYWxob3N0IiwiZGF0YSI6eyJ1c2VybmFtZSI6ImJvdW50eTEiLCJlbWFpbCI6ImJpbGx5MUBzb21lb25lLmNvbSIsImZpcnN0TmFtZSI6ImJpbGx5IiwibGFzdE5hbWUiOiJiZWFyIiwiZGlzcGxheU5hbWUiOiJiaWxseSBiZWFyIiwicmVtZW1iZXJMb2dnZWRJbiI6ZmFsc2UsImFncmVlbWVudFZlcnNpb24iOjF9fQ.DI4eoTZ7OwXYaLdEThUfBl7oqvmKr8iPb07qKz2V2Mg",
          "payload": {
            "sub": "Ql61qMLA0AsMqOYlv1Ay",
            "iat": 1522224371,
            "exp": 1622224371,
            "type": "auth",
            "env": "development",
            "domain": "localhost",
            "accountId": Data.accountId,
            "deviceId": null,
            "data": {
              "username": "bounty1",
              "email": "billy1@someone.com",
              "firstName": "billy",
              "lastName": "bear",
              "displayName": "billy bear",
              "rememberLoggedIn": false,
              "agreementVersion": 1
            }
          }
        }
      }
    };
  }
}

export default Data;
