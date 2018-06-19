import errorHandler from 'express-error-handler';
import log from '../utils/logger';

const handler = errorHandler({
  serializer(err) {
    log.debug('errorHandler called:');

    const body = {
      status: err.status,
      message: err.message,
    };
    if (errorHandler.isClientError(err.status)) {
      ['code', 'name', 'type', 'details'].forEach((prop) => {
        if (err[prop]) { body[prop] = err[prop]; }
      });
    }
    return body;
  },
});

export default handler;

/*
export default handler;
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err,
  });
});
*/
