import express from 'express';
import http from 'http';

import log from '../utils/logger';
import c from '../config/consts';
import sc from '../config/statusCodes';
import helper from '../utils/helper';
import Auth from '../utils/Auth';

import User from './User';
import Models from '../models/Models';

const router = express.Router();
const base = '/api/v1/en'; // hard code lang for now. make dynamic when needed.
const models = Models.all;

router.get(`${base}/ping`, (req, res, next) => {
  res.status(200).send('pinged');
});

router.use(`${base}/user`, User.routes(models.user));

// catch 404 and forward to error handler
router.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
router.use((err, req, res, next) => {
  const status = err.status ? err.status : 500;
  let msg = `${status}: ${err.message}`;

  if (!Array.isArray(msg)) {
    msg = [msg];
  }

  const response = { errors: msg };
  if (err.data) {
    response.errors = err.data;
  }

  res.status(status).send(response);
});

export default router;
