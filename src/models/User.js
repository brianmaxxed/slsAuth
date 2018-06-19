/* eslint class-methods-use-this: 0, max-len: 0, valid-typeof:0, no-empty-function:0 */
import _ from 'lodash';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import uuidv4 from 'uuid/v4';
import detect from 'mobile-detect';

import UserSchema from './schemas/UserSchema';
import UserBase from './base/UserBase';
import Blacklist from './Blacklist';
import Account from './Account';
import c from '../config/consts';
import sc from '../config/statusCodes';
import models from './consts/models';
import profanity from '../utils/profaneWords';
import h, { statusObject, errorObject } from '../utils/helper';
import Validate from '../utils/Validate';
import Agreement from '../models/Agreement';
import crypto from '../utils/crypto';
import Auth from '../utils/Auth';
import Email from '../utils/Email';
import env from '../config/env';
import log from '../utils/logger';
import deviceTypes from '../models/enums/deviceTypes';

export default class User extends UserBase {
  static get Model() {
    return mongoose.model(models.user, UserSchema);
    // need to do some automated testing on this method for all models.
  }

  get Model() {
    return User.Model;
    // need to do some automated testing on this method for all models.
  }

  async ping(req = {}) {
    try {
      // TODO: get rid of returning actual data later, use for now.
      // TODO: limit to 10, and other limits.

      const u = await User.Model.find({}, { username: 1, _id: 0 }).limit(30).lean();

      return { status: sc.SUCCESS.status, data: { message: u } };
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async login(req = {}) {
    try {
      const fields = Object.assign({}, _.get(req, 'body', {}));
      const required = ['username', 'password', 'accountId'];
      if (!this.hasRequired(fields, required)) {
        return errorObject(sc.INVALID_AUTH_CREDENTIALS);
      }

      if (typeof _.get(fields, 'rememberLoggedIn', false) !== c.BOOLEAN) {
        return errorObject(sc.REMEMBERED_LOGGED_IN_INVALID);
      }

      const rememberLoggedIn = fields.rememberLoggedIn === true;
      delete fields.rememberLoggedIn;

      const extra = Object.keys(fields).filter(field => !required.includes(field));
      if (extra.length > 0) return errorObject(sc.NO_EXTRA_FIELDS);

      // username might contain an email as alternate login id.
      if (fields.username.indexOf('@') !== -1) {
        fields.email = fields.username;
        delete fields.username;
      }

      const blacklisted = await Blacklist.check(fields.accountId, fields, c.LEAN);
      if (blacklisted) return blacklisted;

      const validateFields = this.validateRequiredFields(fields);
      if (!validateFields.valid) return validateFields;

      const { password } = fields;
      delete fields.password;

      // email is on the contact object.
      if (fields.email) {
        fields['contacts.0.email'] = { $eq: fields.email };
        delete fields.email;
      }

      // make sure the user is valid and not disabled somehow.
      const user = await User.Model.findValidUser(fields, c.LEAN);
      if (!user) return errorObject(sc.INVALID_AUTH_CREDENTIALS);
      // TODO: need to check cookie if there is a device...
      const device = _.get(user, 'devices.[0]');
      if (!device) return errorObject(sc.INVALID_DEVICE_CREDENTIALS);

      const previousLoginAttemptTime = device.lastLoginAttemptTime || 0;
      device.lastLoginAttemptTime = moment().unix();

      if (user.disabled) return errorObject(sc.DISABLED_ACCOUNT);

      // a user that is locked out cannot login.
      if (this.isUserLocked(device)) {
        device.lockedUntil = undefined;

        await this.updateUserDeviceDocument(user.accountId, user.userId, device);
        return errorObject(sc.ACCOUNT_IS_LOCKED);
      }

      if (device.loginAttempts >= c.MAX_LOGIN_ATTEMPTS) {
        device.lockedUntil = moment().unix() + c.LOCK_TIME;

        await this.updateUserDeviceDocument(user.accountId, user.userId, device);
        return errorObject(sc.ACCOUNT_NOW_LOCKED);
      }

      const p = await crypto.comparePassword(password, user.password);

      device.loginAttempts = _.isNumber(device.loginAttempts) ? device.loginAttempts : 0;
      if (!p) {
        if (previousLoginAttemptTime - device.lastLoginAttemptTime < c.LAST_LOGIN_CHECK_TIME) {
          device.loginAttempts += 1;
        } else {
          device.loginAttempts = 1;
        }
        await this.updateUserDeviceDocument(user.accountId, user.userId, device);
        return errorObject(sc.INVALID_AUTH_CREDENTIALS);
      }

      device.rememberLoggedIn = (rememberLoggedIn) ? true : undefined;

      const { device: updatedDevice, tokens } = await this.updateUserDeviceInfo(req, user, device);
      await this.updateUserDeviceDocument(user.accountId, user.userId, updatedDevice);

      return {
        id: sc.SUCCESSFUL_LOGIN.id,
        status: sc.SUCCESSFUL_LOGIN.status,
        msg: sc.SUCCESSFUL_LOGIN.msg,
        data: {
          auth: tokens.auth,
        },
      };
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async logout(req = {}) {
    try {
      // TODO: remove refreshToken from user collection; remove refreshToken from redis
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const { user } = authed;
      user.devices[0].refreshToken = undefined;
      // TODO: devices
      await this.updateUserDeviceDocument(user.accountId, user.userId, user.devices[0]);
      return statusObject(sc.SUCCESSFUL_LOGOUT);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async myAccount(req = {}) {
    try {
      // need to return user object given an authenticated user viewing own account.
      // later need to retrieve account info if an authenticated user is an admin
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      // const authz = await Auth.isAuthz(req);

      // need to refine what is viewable by myAccount or any account as I fill up user data.
      // probably need to pull back all data and only update what has changed
      // and send projection to the findValidUser and setup default getters off user model.
      return statusObject(sc.SUCCESS, authed);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async account(req = {}) {
    try {
      // need to return user object given an authenticated user viewing own account.
      // later need to retrieve account info if an authenticated user is an admin
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      // const authz = await Auth.isAuthz(req);
      // need to find the user by the id passed.
      return statusObject(sc.SUCCESS, authed.payload);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async signup(req = {}) {
    try {
      if (Auth.hasAuthHeader(req)) return errorObject(sc.ALREADY_AUTHENTICATED);

      const fields = _.get(req, 'body', {});
      if (!this.hasRequired(fields, [
        'accountId',
        'email',
        'username',
        'firstName',
        'lastName',
        'password',
        'agreementVersion',
      ])) {
        return errorObject(sc.NEED_ALL_REQUIRED_FIELDS);
      }

      if (!Account.validAccount(fields.accountId)) return errorObject(sc.INVALID_APP_ACCOUNT);

      fields.displayName = `${fields.firstName} ${fields.lastName}`;

      if (profanity.profanityUsed(fields.firstName, fields.lastName, fields.displayName, fields.username)) {
        return errorObject(sc.PROFANITY_REJECT_NAME);
      }

      // TODO put blacklist into redis
      const blacklisted = await Blacklist.check(fields.accountId, { email: fields.email, username: fields.username, password: fields.password }, c.LEAN);
      if (blacklisted) {
        return blacklisted;
      }

      const validateFields = this.validateRequiredFields(fields);
      if (!validateFields.valid) return validateFields;

      const fieldsInUse = await this.checkForRequiredFieldsNotInUse(fields.accountId, { email: fields.email, username: fields.username });
      if (fieldsInUse !== true) return fieldsInUse;

      const user = new User.Model(fields);
      user.type = 'user';

      user.contacts = [
        {
          email: fields.email,
          firstName: fields.firstName,
          lastName: fields.lastName,
          displayName: fields.displayName,
          emailVerify: Auth.getVerifyToken(6, 'email').code,
        },
      ];

      user.devices = [{
        deviceId: uuidv4(),
        name: 'default',
        type: _.keyBy(deviceTypes).default,
        ip: Auth.getClientIp(req),
        userAgent: Auth.getUserAgent(req),
        activated: true,
      }];

      user.profiles = [{
        profileId: uuidv4(),
        name: fields.displayName,
        type: 'main',
        preferences: [],
      }];

      // const agreement = Agreement.getCurrentVersion();
      user.agreementVersion = 1;
      user.accountId = fields.accountId;
      user.userId = crypto.getHashids().encodeHex(user._id);
      const { hash } = await crypto.hashPassword(fields.password);
      user.password = hash;

      const results = await user.save();

      return {
        id: sc.SIGNUP_COMPLETE.id,
        status: sc.SIGNUP_COMPLETE.status,
        msg: sc.SIGNUP_COMPLETE.msg,
        data: {},
      };
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // user methods list

  /*
    get /user/list
    need auth headers
    lists the users. there needs to be a limit to the number of docs returned
    it needs to modern paginate and be within a payload. how to do that?

    use userId in token to get validUser. always check findValidUser
    if id is in params then user needs to be authed if it's not their userId.
    should I re-route /user/:id with own id? probably not i guess.
  */

  async getUsers(req = {}) { // TODO: NOT GOING TO DO YET; NEED AUTHZ
    try {
      // do later.
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
    return statusObject(sc.SUCCESSFUL_UPDATE, req.auth);
  }

  /*
    get /user/:id
    need auth headers
    lists the users. there needs to be a limit to the number of docs returned
    it needs to modern paginate and be within a payload. how to do that?

    use userId in token to get validUser. always check findValidUser
    if id is in params then user needs to be authed if it's not their userId.
    should I re-route /user/:id with own id? probably not i guess.
  */
  async getUser(req = {}) { // TODO: DONE. NEED UT
    try {
      const authed = this.isAuthZ(req, 'user');
      if (!authed) return errorObject(authed);

      const userId = req.params.id; // TODO: how to validate this?
      const u = await this.returnUserData(req, userId);
      return u;
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get /user
    need auth headers
    lists the users. there needs to be a limit to the number of docs returned
    it needs to modern paginate and be within a payload. how to do that?

    use userId in token to get validUser. always check findValidUser
    if id is in params then user needs to be authed if it's not their userId.
    should I re-route /user/:id with own id? probably not i guess.
  */
  async getThisUser(req = {}) { // TODO: DONE. NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const u = await this.getSecureUserData(authed.user);
      return statusObject(sc.SUCCESSFUL_UPDATE, u);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // user methods list
  /*
    patch   /username

    check user name on the token and needs auth.
    i shouldn't even do the other route right now. just the user itself.
  */
  async updateUsername(req = {}) { // TODO: DONE. NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['email', 'newEmail']);
      if (!validation.valid) return validation;

      if (!this.hasRequired(req.body, ['email', 'newEmail'])) {
        return errorObject(sc.NEED_ALL_REQUIRED_FIELDS);
      }

      const { email, newEmail } = req.body;

      let idx = authed.user.findIndex(contact => contact.email === email);
      if (idx < 0) return errorObject(sc.OLD_EMAIL_NOT_FOUND);
      idx = authed.user.findIndex(contact => contact.email === newEmail);
      if (idx >= 0) return errorObject(sc.NEW_EMAIL_IN_USE);

      const { user } = authed;
      // refresh tokens and update device info.
      const { device, tokens } = await this.updateUserDeviceInfo(req, user, user.devices[0]);
      user.devices[0] = device;
      const updated = await user.save();

      return statusObject(sc.SUCCESSFUL_UPDATE, tokens.auth);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // user methods list
  /*
    patch  /username/resend/:type

    check user name on the token and needs auth.
    type is one thing for now email, but it can be sms or email
    put the param on the body. maybe. it's more self explanatory on url though.
    user will get the user name sent to their email
    can be display too.
    TODO: EMAIL.
  */

  async resendUsername(req = {}) { // TODO: DONE: EMAIL UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: resend username to given email account
      // const out = Email.resendUsername(authed.user);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    patch /offline

    take userid off the auth token and set user to offline.
    front-end and authz will take care of this later.
    just have the setting work for now and unit test.
    technically this should be allowed to set offline and then comeback online.
    an offline user can still login their account should just not be visible

  */
  async setOffline(req = {}) { // TODO: DONE; NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      authed.user.offline = true;
      // this requires a logout to the user; so device refreshtoken removed.
      const { accountId, userId, devices } = authed.user;
      // TODO: check this below worked.
      devices.forEach((device, index) => {
        authed.user.devices[index].refreshToken = undefined;
      });
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.UPDATE_COMPLETED_WITH_LOGOUT);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    patch /delete

    update the user now. if they delete their account then this shouldn't be used in the
    username and email search or any dupe search. it is marked for deletion.
    i could just delete it, but I like softDelete better for now. may change quickly

    take userid from auth and set the setting to delete.

  */
  async setSoftDelete(req = {}) { // TODO: DONE NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      authed.user.softDelete = true;
      // this requires a logout to the user; so device refreshtoken removed.
      // TODO: check this below worked.
      authed.user.devices.forEach((device, index) => {
        authed.user.devices[index].refreshToken = undefined;
      });
      const updated = await authed.user.save();
      // log.dir(updated);

      // it's up to the device to remove the auth token.
      return statusObject(sc.UPDATE_COMPLETED_WITH_LOGOUT);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // password methods

  /*
    post /password/resend/:type
    type is email, display or sms, right now I just do email.
    // given username or email send a link to change password.

  */
  async resendPassword(req = {}) { // TODO: DONE NEED UT
    try {
      const verify = Validate.hasOnlyOne(req.params, ['email', 'username']);
      if (!verify.valid) return errorObject(verify);
      const { field, value } = verify.field;

      const validation = Validate.check(req, ['accountId', field], 'params');
      if (!validation.valid) return errorObject(validation);

      const { accountId } = req.params;

      const query = (field === 'username') ?
        { accountId, username: value } :
        {
          accountId,
          $and: [
            {
              $or: [
                { 'contact.email': value },
                { 'contact.altEmail': value },
              ],
            },
          ],
        };

      const user = await User.Model.find(query).lean(c.LEAN);
      // log.dir(user);

      // not much to do but try to send the email and send the response.
      // const out = await Email.resendPassword(user, value);
      return statusObject(sc.SUCCESS);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    To reset the current password (in case user forget the password)
    this would allow user to type in a new password and verify password to confirm.
    NOTE: when you reset a password you are going to get a new password sent to email or on scren or phone.
    aand you must change password on next login. that uses the newPassword when trying to login
    that has to be done before a login can happen.
    toggle user.mustChangePassword to true.

    delete  /password
    must have valid auth.
   */
  async resetPassword(req = {}) { // TODO: DONE NEED UT
    try {
      const verify = Validate.hasOnlyOne(req.params, ['email', 'username']);
      if (!verify.valid) return errorObject(verify);
      const { field, value } = verify.field;

      const validation = Validate.check(req, ['accountId', field], 'params');
      if (!validation.valid) return errorObject(validation);

      const { accountId } = req.params;

      const query = (field === 'username') ?
        { accountId, username: value } :
        {
          accountId,
          $and: [
            {
              $or: [
                { 'contact.email': value },
                { 'contact.altEmail': value },
              ],
            },
          ],
        };

      const user = await User.Model.find(query);
      // you have user so send email to them... TODO
      // log.dir(user);

      // not much to do but try to send the email and send the response.
      // const out = await Email.resendPassword(user, value);
      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put   /password
     To up the password (if user knows is old password and new password)
     put /password
     take old password and test it against the auth token and verify the new password is valid.
     the update the pass.
  */
  async updatePassword(req = {}) { // TODO: DONE NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['password', 'newPassword']);
      if (!validation.valid) return errorObject(validation);

      const { password, newPassword } = req.body;

      const sameOld = await crypto.comparePassword(password, authed.user.password);
      const sameNew = await crypto.comparePassword(newPassword, authed.user.password);

      if (!sameOld) return errorObject(sc.OLD_PASSWORD_MUST_MATCH);
      if (sameNew) return errorObject(sc.NEW_PASSWORD_CANNOT_BE_SAME);

      const { salt, hash } = await crypto.hashPassword(newPassword);
      authed.user.password = hash;
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    post /password/verify
    verify password can be initaited by front end or backend.
    but there can be a field on the backend that forces a mustVerifyPassword
    where the auth isn't enough. maybe there is a password token for a few minutes.
    i don't know yet. and not everything needs the mustVerifyPassword,
    if some kine of timeout or token expires this can always be saved to the db at any time.

    once verified undefine mustVerifyPassword
  */
  async verifyPassword(req = {}) { // TODO: DONE NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['password']);
      if (!validation.valid) return validation;

      const same = await crypto.comparePassword(req.body.password, authed.user.password);

      if (!same) return errorObject(sc.PASSWORD_NOT_VERIFIED);

      return statusObject(sc.PASSWORD_VERIFIED);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // contact methods

  /*
    adds a contact to the user object.
    what are the fields you can enter?

    are the fields correct?
    push a new contact to the contact lists
    save

    don't worry about how many contacts are there. no limit at the moment.

  */
  async addContact(req = {}) { // TODO: DONE NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['email']);
      if (!validation.valid) return errorObject(validation);

      const { email } = req.body;
      const { contacts = [] } = authed.user;

      if (contacts.length >= c.MAX_USER_CONTACTS) return errorObject(sc.CONTACT_LIMIT_REACHED);

      const idx = contacts.findIndex(contact => contact.email === email);
      if (idx >= 0) return errorObject(sc.NEW_EMAIL_IN_USE);

      const contact = req.body;
      const check = await this.checkContactInfo(req, contact);
      if (!check.valid) return check.errors;

      if (!contact.displayName) {
        contact.displayName = `${contact.firstName} ${contact.lastName}`;
      }
      authed.user.contacts.push(contact);
      const updated = await authed.user.save();

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async updateContact(req = {}) { // TODO: DONE NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['email']);
      if (!validation.valid) return errorObject(validation);

      const { email } = req.body;
      const { contacts } = authed.user;

      const idx = contacts.filter(contact => contact.email === email);
      if (idx < 0) return errorObject(sc.EMAIL_NOT_FOUND);
      const contact = authed.user.contacts[idx];

      const check = await this.checkContactInfo(req.body, contact);
      if (!check.valid) return errorObject(check);

      authed.user.contacts[idx] = Object.assign({}, contact, check.data);
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // add route and the method comments.
  async getContact(req = {}) { // TODO: DONE NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['email'], 'params');
      if (!validation.valid) return errorObject(validation);

      const { email } = req.params;
      const { contacts } = authed.user;

      const idx = contacts.findIndex(contact => contact.email === email);
      if (idx < 0) return errorObject(sc.EMAIL_NOT_FOUND);

      return statusObject(sc.SUCCESS, authed.user.contacts[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async deleteContact(req = {}) { // TODO: DONE NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['email'], 'body');
      if (!validation.valid) return errorObject(validation);

      const { email } = req.body;
      const { contacts } = authed.user;

      if (contacts.length === 1 && contacts[0].email === email) {
        return errorObject(sc.CANT_DELETE_PRIMARY_CONTACT);
      }

      const idx = contacts.findIndex(contact => contact.email === email);
      if (idx < 0) return errorObject(sc.EMAIL_NOT_FOUND);

      const { user } = authed;
      const updated = await User.Model.updateOne(
        { accountId: user.accountId, userId: user.userId },
        { $pull: { contacts: { email } } },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }


  // contact methods
  async updateEmail(req = {}) { // TODO: DONE UT; EMAIL.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['email', 'newEmail'], 'body');
      if (!validation.valid) return validation;

      const { contacts } = authed.user;
      const { email, newEmail } = req.body;

      let [oldIdx, newIdx] = [-1, -1];
      contacts.forEach((contact, index) => {
        if (contact.email === email) oldIdx = index;
        if (contact.email === newEmail) newIdx = index;
      });

      if (oldIdx < 0) return errorObject(sc.OLD_EMAIL_NOT_FOUND);
      if (newIdx >= 0) return errorObject(sc.NEW_EMAIL_IN_USE);

      const { accountId, userId } = authed.user;
      const contact = contacts[oldIdx];

      contact.email = newEmail;
      contact.emailVerified = undefined;
      contact.verifyCode = Auth.getVerifyToken(6, 'email').code;
      authed.user.contacts[oldIdx] = contact;

      const updated = await authed.user.save();

      // TODO: email:
      // const emailSent = await Email.sendEmailCode(authed.user);
      // log.dir(emailSent);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async getAllContacts(req = {}) { // TODO: DONE NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.contacts || []);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async verifyEmailViaLink(req = {}) { // TODO: DONE; UT
    try {
      return await this.verifyEmail(req, 'params');
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async verifyEmail(req = {}, type = 'body') {
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const emailType = _.has(req[type], 'altEmail') ? 'altEmail' : 'email';
      const emailVerifyType = _.has(req[type], 'altEmail') ? 'altVerifyCode' : 'verifyCode';
      const emailVerified = _.has(req[type], 'altEmail') ? 'altVerified' : 'emailVerified';

      const validation = Validate.check(req, [emailType, 'verifyCode'], type);
      if (!validation.valid) return errorObject(validation);

      const { verifyCode } = req[type];
      const email = req[type][emailType];
      const { contacts } = authed.user;

      const idx = contacts.findIndex(contact => contact[emailType] === email);
      const contact = contacts[idx] || [];

      if (idx < 0) errorObject(sc.EMAIL_NOT_FOUND);
      if (contact[emailVerified]) return errorObject(sc.EMAIL_ALREADY_VERIFIED);
      if (!contact[emailVerifyType]) return errorObject(sc.NO_VERIFY_CODE_IN_USE);
      if (verifyCode !== contact[emailVerifyType]) return errorObject(sc.INVALID_VERIFY_CODE);

      const set = { $set: {} };
      const field = `contacts.$.${emailVerified}`;
      set.$set[field] = true;

      const updEmail = `contacts.${emailType}`;

      const query = {
        accountId: authed.user.accountId,
        userId: authed.user.userId,
        [updEmail]: email,
      };

      const updated = await User.Model.updateOne(
        query,
        set,
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async resendEmailVerifyCode(req = {}, type = 'body') { // TODO: DONE; UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const emailType = _.has(req[type], 'altEmail') ? 'altEmail' : 'email';
      const emailVerifyType = _.has(req[type], 'altEmail') ? 'altVerifyCode' : 'verifyCode';
      const emailVerified = _.has(req[type], 'altEmail') ? 'altVerified' : 'emailVerified';

      const validation = Validate.check(req, [emailType, 'verifyCode'], type);
      if (!validation.valid) return errorObject(validation);

      const { verifyCode } = req[type];
      const email = req[type][emailType];
      const { contacts } = authed.user;

      const idx = contacts.findIndex(contact => contact[emailType] === email);
      const contact = contacts[idx] || {};

      if (idx < 0) errorObject(sc.EMAIL_NOT_FOUND);
      if (contact[emailVerified]) return errorObject(sc.EMAIL_ALREADY_VERIFIED);
      if (!contact[emailVerifyType]) return errorObject(sc.NO_VERIFY_CODE_IN_USE);
      if (verifyCode !== contact[emailVerifyType]) return errorObject(sc.INVALID_VERIFY_CODE);

      // resend the email
      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // profile methods

  /*
    post  /profile
    create all neccessary fields for a profile.
    it should really make the default device the one the user is using when the profile is added.
    because if it's not added on addProfile it needs to be when the user logins in and uses that profile.
    i felt this earlier when writing code. code is clean it should work.'

    add device and update devices are different endpoints remember that and methods.
    just use the device methods here, so that means they can't be married to the res object returning or front end errors.
  */
  async addProfile(req = {}) { // TODO: DONE. NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: // need other profanity checks etc.
      const validation = Validate.check(req, ['profileName']);
      if (!validation.valid) return errorObject(validation);

      const { profileName } = req.body;
      const { profiles } = authed.user;

      const idx = profiles.findIndex(p => p.name === profileName);
      if (idx >= 0) return errorObject(sc.PROFILE_NAME_IN_USE);

      if (authed.user.profiles.length >= c.MAX_USER_PROFILES) {
        return errorObject(sc.PROFILE_LIMIT_REACHED);
      }

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $push: {
            profiles: {
              profileId: uuidv4().toString().replace(/-/g, ''),
              name: profileName,
              type: 'main',
            },
          },
        },
      );

      // log.dir(update);
      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // TODO: add route;
  async getProfile(req = {}) { // TODO: DONE. NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['profileId'], 'params');
      if (!validation.valid) return errorObject(validation);

      const { profileId } = req.params;
      const { profiles } = authed.user;

      const idx = profiles.findIndex(p => p.profileId === profileId);
      if (idx < 0) return errorObject(sc.PROFILE_ID_NOT_FOUND);

      return statusObject(sc.SUCCESSFUL_UPDATE, profiles[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put   /profile/:id

    TODO: right now this is just the profile name.
    update all neccessary fields for a profile.

    add device and update devices are different endpoints remember that and methods.
    just use the device methods here, so that means they can't be married to the res object returning or front end errors.

  */
  async updateProfile(req = {}) { // TODO: DONE; NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      if (authed.user.profiles.length >= c.MAX_USER_PROFILES) {
        return errorObject(sc.PROFILE_LIMIT_REACHED);
      }

      // TODO: // need other profanity checks etc.
      const validation = Validate.check(req, ['profileId', 'profileName']);
      if (!validation.valid) return errorObject(validation);

      const { profileId, profileName } = req.body;
      const { profiles } = authed.user;

      const query = {
        accountId: authed.user.accountId,
        userId: authed.user.userId,
        'profiles.profileId': profileId,
      };

      const set = {
        $set: {
          'profiles.$.name': profileName,
        },
      };

      const update = await User.Model.updateOne(query, set);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    delete /profile/:id

    straight up delete a profile. make sure its the under the userid and accountid.

  */
  async deleteProfile(req = {}) { // TODO: DONE. NEED REFACTOR.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: // need other profanity checks etc.
      const validation = Validate.check(req, ['profileId']);
      if (!validation.valid) return errorObject(validation);

      const { profileId } = req.body;
      const { profiles } = authed.user;

      const idx = profiles.findIndex(p => p.profileId === profileId);
      if (idx === 0) return errorObject(sc.CANT_DELETE_PRIMARY_PROFILE);
      if (idx < 1) return errorObject(sc.SPECIFY_PROFILE_ID);

      const changed = profiles.filter(p => p.profileId !== profileId);

      authed.user.profiles = changed;
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get /profiles

    get the list of profiles for this userid  (including accountId). how does that look after?
    TODO: shouldn't I limit the devices returned in the profiles?
    TODO: seems can become a security issue with some of the device data.

  */
  async getAllProfiles(req = {}) { // TODO: DONE. NEED TESTING.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: later watch out for profile fields I shouldn't send back.
      return statusObject(sc.SUCCESS, authed.user.profiles || []);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // profile device methods

  /*
    post    /device
    add a device to a profile. keep in mind the max. put a constant im. netflix allows different amounts based on level.
    get userid from token
    keep in mind the limits of devices (what are they?)
    and should this be generic? somebody needs to add the device when they're using it
    but they also may be able to do add one or update one in advance.
    epix I think allows that.
  */
  async addDevice(req = {}) { // TODO: DONE; UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const deviceType = h.getDeviceType(req);

      const device = {
        deviceId: await this.getUniqueId(User, authed.user, 'devices.deviceId'),
        name: 'default', // TODO: add a device name, based on device; later.
        type: deviceType.type,
        ip: deviceType.ip,
        userAgent: deviceType.userAgent,
        activated: true,
      };

      authed.user.devices.push(device);
      const updated = await authed.user.save();

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      log.error(e.stack);
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put   /device/:id
    this updates a particular device id through a particular profile id for a userid
    keep in mind the limits of devices (what are they?)
    and should this be generic? somebody needs to add the device when they're using it
    but they also may be able to do add one or update one in advance.
    epix I think allows that.
  */
  async updateDevice(req = {}) { // TODO: DONE; UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['deviceId', 'name']);
      if (!validation.valid) return errorObject(validation);
      const { name, deviceId } = req.body;
      const idx = authed.user.devices.findIndex(d => d.deviceId === deviceId);
      if (idx < 0) return errorObject(sc.SPECIFY_DEVICE_ID);

      authed.user.devices[idx].name = name;
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE, this.securePayload(updated));
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
      delete /profile/:id/device/:id

      delete a device off a profile id. i think only the main profile should be able to do this.
      but hey. doesn't have to be there the first day.

  */
  async deleteDevice(req = {}) { // TODO: DONE; UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['deviceId']);
      if (!validation.valid) return errorObject(validation);

      const { deviceId } = req.body;
      const { devices } = authed.user;
      const idx = devices.findIndex(device => device.deviceId === deviceId);
      if (idx < 0) return errorObject(sc.SPECIFY_DEVICE_ID);

      const updated = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $pull: { devices: { deviceId } },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get /profile/:id/device/:id
    returns the profile device data based on userid and account id
    and valid profile id and device id.
  */
  async getDevice(req = {}) { // TODO: DONE. NEED TESTING.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['deviceId'], 'params');
      if (!validation.valid) return errorObject(validation);

      const { deviceId } = req.params;
      const { devices } = authed.user;
      const idx = devices.findIndex(device => device.deviceId === deviceId);
      if (idx < 0) return errorObject(sc.SPECIFY_DEVICE_ID);

      return statusObject(sc.SUCCESS, devices[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }
  /*
    get /profile:id/devices
    returns all of a profile's devices via the profile id.
    really need to finalize on these ids and if I use them or hashes. it will shake out after this.
    return an array.
  */
  async getAllDevices(req = {}) { // TODO: DONE. NEED TESTING.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      return statusObject(sc.SUCCESS, authed.user.devices);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get   /profile:id/devices/loggedin
    returns all logged in devices for a particular profile. need to test this real good with integration testing. I can do that.
    returns an array of profiles or empty array
    what is the dropping off point for a device? when someome queries this, I can delete in active stuff
    and add to the history.
  */
  async getLoggedinDevices(req = {}) { // TODO: DONE. NEED TESTING.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const { devices } = authed.user;
      const loggedIn = devices.filter(device => device.loggedIn === true);

      return statusObject(sc.SUCCESS, loggedIn);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    post /devices/logout-all-except/:id
    the id should be in the body. it's here now so I know it's the parameter.
    how am I going to logout these devices? if they have a token?
    you can blacklist the auth token and remove the refresh token.
    but can I do this without blacklisting auth tokens?
    I can also invalidate endpoint caches at some point. make a note.

    TODO: seems like when you have to hit the DB, you should check if user is logged in.
    TODO: or check during certain times. fudge it for now.
    the device id list is the only one not logged out.
    what does it mean to be an active logged in user?

    I added forced logout to the userSchema
  */
  async logoutDevicesExcept(req = {}) { // TODO: DONE. NEED TESTING.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['deviceId']);
      if (!validation.valid) return errorObject(validation);

      const { deviceId } = req.body;
      const devices = Object.assign([], authed.user.devices);
      const idx = devices.findIndex(device => device.deviceId === deviceId);
      if (idx < 0) return errorObject(sc.SPECIFY_DEVICE_ID);

      const changed = new Map();
      delete devices[idx];

      devices.forEach((d, index) => {
        // TODO: these fields should be in a universal method somewhere:
        authed.user.devices[index].forceLogout = true;
        authed.user.devices[index].loggedIn = undefined;
        authed.user.devices[index].refreshToken = undefined;
        authed.user.devices[index].rememberLoggedIn = undefined; // TODO: look into this logically overall.
        if (!changed.has(d.deviceId)) changed.set(d.deviceId, d);
      });

      const updated = await authed.user.save();
      // TODO: throw an error if not saved!!! check updated object. do for all project.
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE, h.mapToArray(changed));
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    post /devices/logout-all
    logout all devices for a user account.
    how am I going to logout all these devices? if they have a token?
    you can blacklist the auth token and remove the refresh token.
    but can I do this without blacklisting auth tokens?
    I can also invalidate endpoint caches at some point. make a note.

    the device id list is the only one not logged out.
    what does it mean to be an active logged in user?

    I added forced logout to the userSchema
  */
  async logoutAllDevices(req = {}) { // TODO: DONE. NEED TESTING.]
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const { devices } = authed.user;

      const changed = new Map();
      devices.forEach((d) => {
        if (!devices.includes(d.deviceId)) {
          const d1 = d;
          // TODO: these fields should be in a universal method somewhere:
          d1.forceLogout = true;
          d1.loggedIn = undefined;
          d1.refreshToken = undefined;
          d1.rememberLoggedIn = undefined; // TODO: look into this logically overall.
          devices[d.deviceId] = Object.assign({}, d1);
          if (!changed.has(d1.deviceId)) changed.set(d1.deviceId, d1);
        }
      });

      authed.user.devices = devices;
      const updated = await authed.user.save();

      // TODO: throw an error if not saved!!! check updated object. do for all project.
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE, h.mapToArray(changed));
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    patch '/device/:id/activate/:code
    get these :ids out of url and onto body.
    what does it mean to activate a device?
    If you hit the url with the code at the end then the device
    statuses as activated. what does that mean?
  */
  async activateDevice(req = {}) { // TODO: DONE. NEED TESTING.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['deviceId', 'activationCode']);
      if (!validation.valid) return errorObject(validation);

      const { deviceId, activationCode } = req.body;

      const { devices } = authed.user;
      const idx = devices.findIndex(device => device.deviceId === deviceId);
      if (idx < 0) return errorObject(sc.SPECIFY_DEVICE_ID);

      const device = authed.user.devices[idx];

      if (device.activated) return errorObject(sc.DEVICE_ALREADY_ACTIVATED);
      if (device.activationCode !== activationCode) return errorObject(sc.INVALID_DEVICE_ACTIVATION_CODE);

      authed.user.devices[idx].activated = true;
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // subscription methods
  /*
    post /subscription

  */

  async addSubscription(req = {}) { // TODO: DONE; NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: // need other profanity checks etc.
      const validation = Validate.check(req, ['serviceId', 'trial']);
      if (!validation.valid) return errorObject(validation);

      const { serviceId, trial = false } = req.body;
      const { accountId, userId, subscriptions = [] } = authed.user;

      let idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      if (idx >= 0) return errorObject(sc.SERVICE_ID_IN_USE);

      const update = await User.Model.updateOne(
        { accountId, userId },
        {
          $push: {
            subscriptions: {
              subscriptionId: uuidv4().toString().replace(/-/g, ''),
              serviceId,
              name: 'TEST',
              type: 'Basic-Monthly',
              trial,
            },
          },
        },
      );

      const user = await User.Model.findOne({ accountId, userId }).lean();
      // log.dir(user);
      idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      return statusObject(sc.SUCCESSFUL_UPDATE, user.subscriptions[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put /subscription/:id
    updates a subscription for the user account whatever that means.
    what does that mean?

  */
  async updateSubscription(req = {}) { // TODO: DONE; NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: // need other profanity checks etc.
      const validation = Validate.check(req, ['serviceId', 'trial']);
      if (!validation.valid) return errorObject(validation);

      const { serviceId, trial = false } = req.body;
      const { accountId, userId, subscriptions = [] } = authed.user;

      const idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      if (idx < 0) return errorObject(sc.SUBSCRIPTION_ID_NOT_FOUND);

      // TODO: need a has not changed status code when value is same.
      authed.user.subscriptions[idx].trial = trial;
      const updated = await authed.user.save();

      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.toObject().subscriptions[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    patch /subscription/cancel/:id
    cancel a subscription. might mean to just get rid of the subscription object.
    there should always be a history at some point though.

  */
  async pauseSubscription(req = {}) { // TODO: DONE; NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['serviceId']);
      if (!validation.valid) return errorObject(validation);

      const { serviceId, trial = false } = req.body;
      const { accountId, userId, subscriptions = [] } = authed.user;

      const idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      if (idx < 0) return errorObject(sc.SUBSCRIPTION_ID_NOT_FOUND);

      const subscription = subscriptions[idx];
      if (subscription.cancelled) return errorObject(sc.SUBSCRIPTION_ALREADY_CANCELLED);
      if (subscription.paused) return errorObject(sc.SUBSCRIPTION_ALREADY_PAUSED);

      authed.user.subscriptions[idx].paused = true;
      const updated = await authed.user.save();

      // log.dir(updated);
      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.toObject().subscriptions[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    patch /subscription/cancel/:id
    cancel a subscription. might mean to just get rid of the subscription object.
    there should always be a history at some point though.

  */
  async cancelSubscription(req = {}) { // TODO: DONE; NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['serviceId']);
      if (!validation.valid) return errorObject(validation);

      const { serviceId, trial = false } = req.body;
      const { accountId, userId, subscriptions = [] } = authed.user;

      const idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      if (idx < 0) return errorObject(sc.SUBSCRIPTION_ID_NOT_FOUND);

      const subscription = subscriptions[idx];
      if (subscription.cancelled) return errorObject(sc.SUBSCRIPTION_ALREADY_CANCELLED);

      authed.user.subscriptions[idx].cancelled = true;
      authed.user.subscriptions[idx].paused = false;
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.toObject().subscriptions[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    patch /subscription/resume/:id
    resume a canceled or paused subscription
    a cancelled subscription will try to remember what was had.
    but i think do it like netflix and just have them start the wizard over again
    whatever that means.


  */
  async resumeSubscription(req = {}) { // TODO: DONE; NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: // need other profanity checks etc.
      const validation = Validate.check(req, ['serviceId']);
      if (!validation.valid) return errorObject(validation);

      const { serviceId, trial = false } = req.body;
      const { accountId, userId, subscriptions = [] } = authed.user;

      const idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      if (idx < 0) return errorObject(sc.SUBSCRIPTION_ID_NOT_FOUND);

      const subscription = subscriptions[idx];

      if (!subscription.cancelled && !subscription.paused) {
        return errorObject(sc.SUBSCRIPTION_ALREADY_RESUMED);
      }

      authed.user.subscriptions[idx].cancelled = false;
      authed.user.subscriptions[idx].paused = false;
      const updated = await authed.user.save();
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.toObject().subscriptions[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get   /subscription
    get the subscription info for the current user.
    should only work for the main profile if the setting is on.
    there's only one subscription for an account right now.
  */
  async getSubscription(req = {}) { // TODO: NEXT. NOT DONE
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['serviceId'], 'params');
      if (!validation.valid) return errorObject(validation);

      const { serviceId } = req.params;
      const { subscriptions = [] } = authed.user;

      const idx = subscriptions.findIndex(s => s.serviceId === serviceId);
      if (idx < 0) return errorObject(sc.SUBSCRIPTION_ID_NOT_FOUND);

      return statusObject(sc.SUCCESS, subscriptions[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    gets all the subscriptions a user has.
  */

  async getAllSubscriptions(req = {}) { // TODO: DONE. NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const { subscriptions = [] } = authed.user;

      return statusObject(sc.SUCCESS, subscriptions);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // parental controls methods

  async updateParentalControl(req = {}) { // TODO: DONE. NEED UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const [key, ...extra] = Object.keys(req.body || {});
      if (!key) return errorObject(sc.SPECIFY_ONE_SETTING);
      if (extra.length > 0) return errorObject(sc.INVALID_SETTINGS);

      const validation = Validate.settingIsInStore(key, 'user.parentalControls');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      if (typeof req.body[key] !== 'boolean') return errorObject(sc.INVALID_SETTING_VALUE);

      const parentalControls = {};
      parentalControls[key] = req.body[key];

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            parentalControls,
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }
  /*
    //  put   /parental-controls/:userId

    can update all the PC as an array of settings for a particular userId
    userId comes from the token.

  */
  async updateParentalControls(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.settingsAreInStore(req.body, 'user.parentalControls');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      const keys = Object.keys(req.body || {});
      const parentalControls = {};

      const invalid = keys.filter((field) => {
        parentalControls[field] = req.body[field];
        return typeof req.body[field] !== 'boolean';
      });

      if (invalid.length > 0) return errorObject(sc.INVALID_SETTINGS);

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            parentalControls,
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }
  /*
    patch   /parental-controls/enable
    enable parental controls as a whole on the root of the object.
  */
  async enableParentalControls(req = {}) { // TODO: DONE; UT
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const enabled = _.get(req, 'body.enabled');
      if (typeof enabled !== 'boolean') return errorObject(sc.NOT_A_BOOLEAN);

      const updated = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            parentalControls: { enabled },
          },
        },
      );
      // log.dir(updated);

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get   /parental-controls',
    gets the entire list of parental controls as an array.
  */
  async getAllParentalControls(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.parentalControls || []);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get   /parental-controls',
    gets the entire list of parental controls as an array.
  */
  async getParentalControl(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const setting = _.get(req, 'params.setting');
      if (!setting) return errorObject(sc.SPECIFY_ONE_SETTING);
      const validation = Validate.settingIsInStore(setting, 'user.parentalControls');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      const parentalControls = authed.user.parentalControls || {};
      return statusObject(sc.SUCCESS, parentalControls[req.params.setting] || false);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put   /settings
    update all the settings with an object or array of settings.

  */
  async updateSetting(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const [key, ...extra] = Object.keys(req.body || {});
      if (!key) return errorObject(sc.SPECIFY_ONE_SETTING);
      if (extra.length > 0) return errorObject(sc.INVALID_SETTINGS);

      const validation = Validate.settingIsInStore(key, 'user.settings');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      if (typeof req.body[key] !== 'boolean') return errorObject(sc.INVALID_SETTING_VALUE);

      const settings = {};
      settings[key] = req.body[key];

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            settings,
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put /privacy/:id
    updates the whole privacy object based on the default fields/settings used.
  */
  async updateSettings(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.settingsAreInStore(req.body, 'user.settings');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      const settings = {};

      const invalid = Object.keys(req.body || {}).filter((field) => {
        settings[field] = req.body[field];
        return typeof req.body[field] !== 'boolean';
      });

      if (invalid.length > 0) return errorObject(sc.INVALID_SETTINGS);

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            settings,
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get /setting/:setting
    gets one setting by setting id for a particular userId/accountId

  */
  async getSetting(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const setting = _.get(req, 'params.setting');
      if (!setting) return errorObject(sc.SPECIFY_ONE_SETTING);
      const validation = Validate.settingIsInStore(setting, 'user.settings');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      const settings = authed.user.settings || {};
      return statusObject(sc.SUCCESS, settings[setting] || false);

      // const setting = this.getProperty('settings', authed.user, req.params.setting);
      // if (!setting.valid) return errorObject(setting.error);
      // return statusObject(sc.SUCCESSFUL_UPDATE, setting.data);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get   /settings
    get all the settings off the settings object for a userId.
    return an array of elements or empty.

  */
  async getAllSettings(req = {}) { // TODO: DONE. NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.settings || []);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  async updatePrivacySetting(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const [key, ...extra] = Object.keys(req.body || {});
      if (!key) return errorObject(sc.SPECIFY_ONE_SETTING);
      if (extra.length > 0) return errorObject(sc.INVALID_SETTINGS);

      const validation = Validate.settingIsInStore(key, 'user.privacy');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      if (typeof req.body[key] !== 'boolean') return errorObject(sc.INVALID_SETTING_VALUE);

      const privacy = {};
      privacy[key] = req.body[key];

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            privacy,
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put /privacy/:id
    updates the whole privacy object based on the default fields/settings used.
  */
  async updatePrivacySettings(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.settingsAreInStore(req.body, 'user.privacy');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      const keys = Object.keys(req.body);
      const privacy = {};

      const invalid = keys.filter((field) => {
        privacy[field] = req.body[field];
        return typeof req.body[field] !== 'boolean';
      });

      if (invalid.length > 0) return errorObject(sc.INVALID_SETTINGS);

      const update = await User.Model.updateOne(
        {
          accountId: authed.user.accountId,
          userId: authed.user.userId,
        },
        {
          $set: {
            privacy,
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get  /privacy/:id
    get a particular privacy settings.
    might not need this.
  */
  async getPrivacySetting(req = {}) { // TODO: DONE; UT;
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const setting = _.get(req, 'params.setting');
      if (!setting) return errorObject(sc.SPECIFY_ONE_SETTING);
      const validation = Validate.settingIsInStore(setting, 'user.privacy');
      if (!validation) return errorObject(sc.INVALID_SETTINGS);

      const privacy = authed.user.privacy || {};
      return statusObject(sc.SUCCESS, privacy[req.params.setting] || false);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get  /privacy
    returns the privacy object wrapped in an array, empty array if it doesn't exist.

  */
  async getAllPrivacySettings(req = {}) { // TODO: DONE, NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      return statusObject(sc.SUCCESS, authed.privacy || []);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  // paymentMethod methods; only 1 for now.
  /*
    post payment-method
    adds a paymentMethod object to the user model.
    since there is only one I can either give an error back if one exits. and I should
    or delete and create a new. do not delete a paymentMethod if it is already there.s

  */
  async addPaymentMethod(req = {}) { // TODO: NOT DONE.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['type', 'firstName', 'middleName', 'lastName']);
      if (!validation.valid) return errorObject(validation);

      const {
        type, firstName, middleName, lastName,
      } = req.body;

      const paymentMethods = authed.user.paymentMethods || [];
      const { accountId, userId } = authed.user;

      // passed so we can add the contact. can make sure we don't add too many.
      if (paymentMethods.length >= c.MAX_USER_PAYMENT_METHODS) return errorObject(sc.PAYMENT_METHODS_LIMIT_REACHED);

      const updated = await User.Model.updateOne(
        { accountId, userId },
        {
          $push: {
            paymentMethods: {
              paymentId: uuidv4().toString().replace(/-/g, ''),
              type,
              firstName,
              middleName,
              lastName,
              default: (paymentMethods.length === 0),
              enabled: true,
            },
          },
        },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    put payment-method
    updates the paymentMethod object.
    not sure how yet. just whole object updated probably.
    might have to do individual fields too.
  */
  async updatePaymentMethod(req = {}) {
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const fields = ['paymentId', 'firstName', 'middleName', 'lastName', 'enabled'];

      const validation = Validate.check(req, fields);
      if (!validation.valid) return errorObject(validation);

      if (!this.hasRequired(req.body, ['paymentId'])) {
        return errorObject(sc.NEED_ALL_REQUIRED_FIELDS);
      }

      const { paymentId } = req.body;
      const paymentMethods = authed.user.paymentMethods || [];

      const idx = paymentMethods.findIndex(p => p.paymentId === paymentId);
      if (idx < 0) return errorObject(sc.PAYMENT_ID_NOT_FOUND);

      const extra = Object.keys(req.body).filter((field) => {
        authed.user.paymentMethods[idx][field] = req.body[field];
        return !fields.includes(field);
      });

      if (extra.length > 0) return errorObject(sc.NO_EXTRA_FIELDS);

      const updated = await authed.user.save();
      // log.dir(updated);
      // TODO: do I need to do something with the update authed?
      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    setDefaultPaymentMethod
    sets the default property of paymentMethds to true for paymentId, sets others to false.
  */
  async setDefaultPaymentMethod(req = {}) {
    try {
      const authed = await this.getFreshAuthedUserDetails(req);
      if (!authed.valid) return errorObject(authed.error);

      const fields = ['paymentId'];

      const validation = Validate.check(req, fields);
      if (!validation.valid) return errorObject(validation);

      if (!this.hasRequired(req.body, fields)) {
        return errorObject(sc.NEED_ALL_REQUIRED_FIELDS);
      }

      Object.keys(req.body).forEach((field) => {

      });

      const extra = Object.keys(req.body).filter(field => !fields.includes(field));
      if (extra.length > 0) return errorObject(sc.NO_EXTRA_FIELDS);

      const { paymentId } = req.body;
      const paymentMethods = authed.user.paymentMethods || [];

      const idx = paymentMethods.findIndex(p => p.paymentId === paymentId);
      if (idx < 0) return errorObject(sc.PAYMENT_ID_NOT_FOUND);

      paymentMethods.forEach((field, index) => {
        authed.user.paymentMethods[index].default = (idx === index);
      });

      const updated = await authed.user.save();
      // log.dir(updated);
      // TODO: do I need to do something with the update authed?
      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    delete /payment-method
    deletes the current payment method

  */
  async deletePaymentMethod(req = {}) { // TODO: DONE, NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['paymentId']);
      if (!validation.valid) return errorObject(validation);

      const { paymentId } = req.body;
      const paymentMethods = authed.user.paymentMethods || [];
      const { accountId, userId } = authed.user;

      const idx = paymentMethods.findIndex(p => p.paymentId === paymentId);
      if (idx < 0) return errorObject(sc.PAYMENT_ID_NOT_FOUND);

      const updated = await User.Model.updateOne(
        { accountId, userId },
        { $pull: { paymentMethods: { paymentId } } },
      );

      return statusObject(sc.SUCCESSFUL_UPDATE);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get /payment-method
    returns the current payment method in an array or empty array if it doesn't exist.

  */
  async getPaymentMethod(req = {}) { // TODO: DONE, NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      const validation = Validate.check(req, ['paymentId'], 'params');
      if (!validation.valid) return errorObject(validation);

      const { paymentId } = req.params;
      const paymentMethods = authed.user.paymentMethods || [];

      const idx = paymentMethods.findIndex(p => p.paymentId === paymentId);
      if (idx < 0) return errorObject(sc.PAYMENT_ID_NOT_FOUND);

      // TODO: this CAN AND SHOULD BE A METHOD TO GET THE TYPE YOU WANT OFF USER OBJECT.

      // this should only have an index for the contact to delete and it can't be zero.
      // TODO:: const checked = checkUserObject('paymentMethods', ['paymentMethods']);
      // TODO: const checked = checkUserObject('paymentMethods', ['paymentMethods']);
      //

      return statusObject(sc.SUCCESS, paymentMethods[idx]);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }

  /*
    get /payment-methods/list
    returns the current payment method in an array or empty array if it doesn't exist.

  */

  async getAllPaymentMethods(req = {}) { // TODO: DONE, NEED UT.
    try {
      const authed = await this.getFreshAuthedUserDetails(req, c.LEAN);
      if (!authed.valid) return errorObject(authed.error);

      // TODO: later watch out for payment fields I shouldn't send back.
      return statusObject(sc.SUCCESSFUL_UPDATE, authed.user.paymentMethods || []);
    } catch (e) {
      return h.unhandledErrorObject(e);
    }
  }
}
