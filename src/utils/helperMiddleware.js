import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import env from '../config/env';

export default [
  bodyParser.json(),
  jwt({ secret: env.jwtAuthSecret, credentialsRequired: false }),
  bodyParser.text({ type: 'application/graphql' }),
  (req, res, next) => {
    if (req.is('application/graphql')) {
      req.body = {
        query: req.body,
      };
    }
    next();
  },
];
