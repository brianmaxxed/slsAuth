/* eslint class-methods-use-this:0 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import _ from 'lodash';
import uuidv4 from 'uuid/v4';
import rIp from 'request-ip';
import nodemailer from 'nodemailer';
import ses from 'nodemailer-ses-transport';

import env from '../config/env';
import c from '../config/consts';
import sc from '../config/statusCodes';
import verifyTokenTypes from '../models/enums/verifyTokenTypes';
import models from '../models/consts/models';
import UserSchema from '../models/schemas/UserSchema';
import BlacklistSchema from '../models/schemas/BlacklistSchema';
import crypto from '../utils/crypto';
import log from '../utils/logger';
import h from '../utils/helper';

const transporter = nodemailer.createTransport(ses({
  accessKeyId: env.mail.awsSesKey,
  secretAccessKey: env.mail.awsSesPass,
}));


/**
 *
 * Handles all authentication/authorization middleware.
 * Uses jwt auth and refresh tokens, checks blacklisting/validity via redis and mongoose models.
 *
 */
class Email {
  static async resendPassword(user = null) {
    if (!user) {
      return { sent: false, status: 200, msg: 'email not sent' };
    }

    return { sent: true, status: 200, msg: 'email sent' };
  }

  static async sendMail(mail) {
    try {
      const {
        from, to, subject, msg,
      } = mail;

      const results = await transporter.sendMail({
        from,
        to,
        subject,
        msg,
      });
    } catch (e) {
      h.unhandledErrorObject(e);
    }
  }
}

export default Email;
