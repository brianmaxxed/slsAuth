import Hashids from 'hashids';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import env from '../config/env';
import log from '../utils/logger';

const hashids = new Hashids();

const getCrypto = () => crypto;

const getBcrypt = () => bcrypt;

const getHashids = () => hashids;

// eslint-disable-next-line func-names
const genRandomString = function (length, type = 'hex') {
  return crypto.randomBytes(Math.ceil(length / 2)) // length / 2
    .toString(type)/** convert to hex or base64 format */
    .slice(0, length);/** return required number of characters */
};

const generateSalt = length => crypto.randomBytes(length).toString('base64');

const generateBcryptSalt = async rounds => bcrypt.genSalt(rounds);

const hashPassword = async (password) => {
  let salt = null;
  let hash = null;
  try {
    // const salt = await bcrypt.genSalt(env.saltRounds);
    salt = await generateBcryptSalt(parseInt(env.saltRounds, env.saltRounds)); // TODO: low for cost, do 8-12.
    hash = await bcrypt.hash(password, salt);
  } catch (e) {
    log.error('Error: ', e.stack);
    return e;
  }

  return { salt, hash };
};

// eslint-disable-next-line func-names
const comparePassword = async (candidatePassword, password) => {
  try {
    const compare = await bcrypt.compare(candidatePassword, password);
    return compare;
  } catch (e) {
    log.error('Error: ', e.stack);
    return null;
  }
};

/*
  eslint-disable-next-line func-names
  const sha512 = function (str, salt) {
  const hash = crypto.createHmac('sha512', salt); // Hashing algorithm sha512
  hash.updateOne(str);
  const value = hash.digest('hex');
  return value;
};

const sha256 = (str, salt) => {
  const hash = crypto.createHmac('sha256', salt); // hashing algorithm sha256
  hash.updateOne(str);
  const value = hash.digest('hex');
  return value;
};

const sha = (str, salt, level = 'SHA') => {
  const hash = crypto.createHmac(level, salt); // Hashing algorithm sha256
  hash.updateOne(str);
  const value = hash.digest('hex');
  return value;
};
*/

export default {
  getCrypto,
  getBcrypt,
  getHashids,
  genRandomString,
  generateSalt,
  comparePassword,
  hashPassword,
  generateBcryptSalt,
  // sha512,
  // sha256,
  // sha,
};
