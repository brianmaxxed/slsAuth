import sc from './statusCodes';

const status = {};

status[sc.SUCCESS] = {
  id: sc.SUCCESS,
  statusCode: 200,
  status: 'Success.',
};


status[sc.INVALID_PAGE] = {
  id: sc.INVALID_PAGE,
  statusCode: 400,
  status: 'Invalid page: Pages start at 1 and max at 1000. They are expected to be an integer.',
};

export default status;

/*
sc.SUCCESS: {
  id : 1,
  statusCode: 200,
  status: 'Success.'
}, {
  id: 2,
  statusCode: 501,
  status: 'Invalid service: this service does not exist.'
}, {
  id: 3,
  statusCode: 401,
  status: 'Auth failed: You do not have permissions to access the service.'
}, {
  id: 4,
  statusCode: 405,
  status: 'Invalid format: This service doesn\' t exist in that format.'},
 {
    id: 5,
    statusCode: 422,
    status: 'Invalid parameters: Your request parameters are incorrect.'
  }, {
    id: 6,
    statusCode: 404,
    status: 'Invalid id: The pre-requisite id is invalid or not found.'
  }, {
    id: 7,
    statusCode: 401,
    status: 'Invalid API key: You must be granted a valid key.'
  }, {
    id: 8,
    statusCode: 403,
    status: 'Duplicate entry: The data you tried to submit already exists.'
  }, {
    id: 9,
    statusCode: 503,
    status: 'Service offline: This service is temporarily offline, try again later.'
  }, {
    id: 1,
    statusCode: 401,
    status: 'Suspended API key: Access to your account has been suspended, contact us.'
  }, {
    id: 11,
    statusCode: 500,
    status: 'Internal error: Something went wrong, contact TMDb.'
  }, {
    id: 12,
    statusCode: 201,
    status: 'The item/record was updated successfully.'
  }, {
    id: 13,
    statusCode: 200,
    status: 'The item/record was deleted successfully.'
  }, {
    id: 14,
    statusCode: 401,
    status: 'Auth failed.'
  }, {
    id: 15,
    statusCode: 500,
    status: 'Failed.'
  }, {
    id: 16,
    statusCode: 401,
    status: 'Device denied.'
  }, {
    id: 17,
    statusCode: 401,
    status: 'Session denied.'
  }, {
    id: 18,
    statusCode: 400,
    status: 'Validation failed.'
  }, {
    id: 19,
    statusCode: 406,
    status: 'Invalid accept header.'
  }, {
    id: 20,
    statusCode: 422,
    status: 'Invalid date range: Should be a range no longer than 14 days.'
  }, {
    id: 21,
    statusCode: 200,
    status: 'Entry not found: The item you are trying to edit cannot be found.'
  }{
    id: 23,
    statusCode: 400,
    status: 'Invalid date: Format needs to be YYYY-MM-DD.'
  }, {
    id: 24,
    statusCode: 504,
    status: 'Your request to the backend server timed out. Try again.'
  }, {
    id: 25,
    statusCode: 429,
    status: 'Your request count (#) is over the allowed limit of (40).'
  }, {
    id: 26,
    statusCode: 400,
    status: 'You must provide a username and password.'
  }, {
    id: 27,
    statusCode: 400,
    status: 'Too many append to response objects: The maximum number of remote calls is 20.'
  }, {
    id: 28,
    statusCode: 400,
    status: 'Invalid timezone: Please consult the documentation for a valid timezone.'
  }, {
    id: 29,
    statusCode: 400,
    status: 'You must confirm this action: Please provide a confirm=true parameter.'
  }, {
    id: 30,
    statusCode: 401,
    status: 'Invalid username and/or password: You did not provide a valid login.'
  }, {
    id: 31,
    statusCode: 401,
    status: 'Account disabled: Your account is no longer active. Contact TMDb if this is an error.'
  }, {
    id: 32,
    statusCode: 401,
    status: 'Email not verified: Your email address has not been verified.'
  }, {
    id: 33,
    statusCode: 401,
    status: 'Invalid request token: The request token is either expired or invalid.'
  }, {
    id: 34,
    statusCode: 401,
    status: 'The resource you requested could not be found.'
  }
  */
