import winston from 'winston';
import fs from 'fs';
import util from 'util';

import env from '../config/env';
import c from '../config/consts';

winston.emitErrs = true;

const tsFormat = () => (new Date()).toLocaleTimeString();

const transports = [
  new winston.transports.Console({
    level: (env.debug) ? env.debugLevel : c.LOGGER.WARN,
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: tsFormat,
  }),
];

const log = new winston.Logger({
  transports,
  exitOnError: false,
});

if (log.dir) {
  log.warn('overwriting a logger native method!');
  // throw new Error('overwriting a logger native method!');
}

log.dir = obj => console.log(util.inspect(obj, { showHidden: false, depth: null, colors: true }));

module.exports = log;

module.exports.stream = {
  write(message, encoding) {
    log.info(message);
  },
};

/*
  winston logger methods:
    log.debug('Debugging info');
    log.verbose('Verbose info');
    log.info('Hello world');
    log.warn('Warning message');
    log.error('Error info');
    log.silly('Silly info');
*/
