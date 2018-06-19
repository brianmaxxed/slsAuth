/* eslint import/first:0, global-require:0 */
import sourceMapSupport from 'source-map-support';
import serverless from 'serverless-http';

import env from './config/env';
import c from './config/consts';

// install the sourcemap if in debug mode, can expand on webpack sourcemap types.
if (env.debug) {
  sourceMapSupport.install({
    environment: c.NODE,
  });
}

// only use the unhandled promise error output for debugging and testing.
if (env.debug) {
  require('./utils/processEvents');
}

// place any local impoers after process events in case of unhandled promises during debugging:
import log from './utils/logger';
import { app, server, startup, shutdown } from './express';

// listen for TERM signal .e.g. kill
process.on('SIGTERM', () => { log.debug('SIGTERM'); shutdown(); });
// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', () => { log.debug('SIGINT'); shutdown(); });

// startup the http server, mongoose, redis, etc.
startup();

module.exports.handler = serverless(app);

/*
module.exports.handler = serverless(app, {
  binary: ['application/json'],
});
*/
