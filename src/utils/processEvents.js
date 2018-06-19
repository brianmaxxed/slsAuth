import env from '../config/env';
import c from '../config/consts';
import log from '../../src/utils/logger';

// only use this for debugging and testing; never non-debug production.
// sometimes promise errors slip through during debugging.
if (env.debug) {
  process.on('unhandledRejection', (reason, p) => {
    log.debug('unhandledRejection...');
    let prom = '';
    if (p) {
      prom = `Unhandled Rejection at: Promise${p}`;
    }
    log.debug('reason:', prom, reason);
    // application specific logging, throwing an error, or other logic here
  });

  process.on('uncaughtException', (e) => {
    // handle the error safely
    log.error('Error: ', e.stack);
  });
}
