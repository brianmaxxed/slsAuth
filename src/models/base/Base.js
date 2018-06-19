/* eslint class-methods-use-this: 0 */

import express from 'express';
import _ from 'lodash';

import c from '../../config/consts';
import sc from '../../config/statusCodes';
import db from '../../config/db';
import env from '../../config/env';
import redisClient from '../../config/redisClient';
import validate from '../../utils/Validate';
import log from '../../utils/logger';

const pako = require('pako');

export default class Base {
  constructor() {
    this.M = null;
    this.query = null;
    this.seachLog = 'search_log';

    this.project = {
      default: {
        credits: 0,
        combined_credits: 0,
        movie_credits: 0,
        tv_credits: 0,
        external_ids: 0,
        production_companies: 0,
        images: 0,
        tagged_imaged: 0,
        production_countries: 0,
        reviews: 0,
        videos: 0,
        recommendations: 0,
        similar: 0,
        networks: 0,
        adult: 0,
        belongs_to_collection: 0,
        spoken_languages: 0,
        _id: 0,
      },
    };
  }

  getQuery() {

  }

  storeSearch() {
    return this.bStoreSearch || false;
  }

  getDefaultQuery() {
    return this.project.search;
  }

  async checkForFieldsInUse(fields) {
    try {
      return fields;
    } catch (e) {
      log.error('Error: ', e.stack);
    }
  }

  async model(m, schema) {
    try {
      const model = await db.model(m, schema);
      return model;
    } catch (e) {
      log.error('Error: ', e.stack);
    }
  }

  async collection(q) {
    if (q.collectionName) {
      const collection = await db.collection(q.collectionName);
      return collection;
    }
    return null;
  }

  async search(query, params) {
    const multi = (query && query.multi);
    const search = this.getDefaultSearch(multi, params);

    const q = _.assign({}, query, search, this.getQuery());

    /*
    q.project = (q.quick) ? this.project.quickSearch :
      this.project.search || {};
    */

    try {
      const results = await this.findPaged(q, params);
      return results;
    } catch (e) {
      return { error: e };
    }
  }

  getDefaultSearch(multi, reqParams) {
    const regex = (reqParams.name && reqParams.name.length === 1)
      ? [`^${reqParams.name}`, 'i'] : [`${reqParams.name}`, 'ig'];

    return {
      find: {
        name: {
          $regex: new RegExp(...regex),
        },
      },
      perPage: (multi)
        ? c.MULTI_PER_PAGE_LIMIT
        : c.PER_PAGE_LIMIT,
    };
  }

  async storeEndpointInDB(url, params) {
    if (!this.storeSearch()) {
      return null;
    }

    try {
      const collection = db.collection(c.LOG_ENDPOINT_COLLECTION);
      const results = await collection.updateOne(
        { endpoint: url },
        {
          $set: { endpoint: url },
          $inc: { count: 1 },
        },
        { upsert: true },
      );

      return results;
    } catch (e) {
      return { error: e };
    }
  }

  async find(query, data, params) {
    let r;

    try {
      r = await db.collection(query.collectionName)
        .find(query.find, query.project).sort(query.sort).limit(query.limit || data.perPage)
        .skip((data.page - 1) * data.perPage);
    } catch (e) {
      return { error: e };
    }

    return r;
  }

  async findPaged(query, params, req) {
    const reqUrl = (query.multi)
      ? `${req.originalUrl.replace((query.quick) ? '/quick' : '/multi', query.search.path)}`
      : req.originalUrl;
    const data = {};
    let r;
    let packedUrl;
    const q = _.assign({}, query);

    if (!q.project) {
      q.project = (q.quick) ? this.project.quickSearch :
        this.project.search || {};
    }

    try {
      data.name = q.search.path.replace('/', '');
      data.page = validate.checkPageParam(q, params);
      if (data.page !== false) {
        data.perPage = q.perPage || c.PER_PAGE_LIMIT;
        packedUrl = validate.packEndpoint(reqUrl);
        const cached = await redisClient.getz(packedUrl);

        if (cached === null) {
          r = await this.find(q, data, params);
          [data.totalResults, data.results] = await Promise.all([r.count(), r.toArray()]);

          redisClient.setz(packedUrl, data, env.redis.keyTtl);
        } else {
          data.totalResults = cached.totalResults;
          data.results = cached.results;
        }
      } else {
        return { status: sc.INVALID_PAGE.status, msg: sc.INVALID_PAGE.msg };
      }

      this.storeEndpointInDB(packedUrl, params);
      return validate.formatPagedPayload(data, params);
    } catch (e) {
      return { error: e };
    }
  }

  async findPopular(query, params) {
    const q = _.assign({}, query, this.getQuery());

    try {
      return await this.findPaged(q, params);
    } catch (e) {
      return { error: e };
    }
  }

  async findTopRated(query, params) {
    const sort = {
      sort: {
        vote_count: -1,
        vote_average: -1,
      },
    };

    const q = _.assign({}, query, sort, this.query);

    try {
      return await this.findPaged(q, params);
    } catch (e) {
      return { error: e };
    }
  }

  async findUpcoming(query, params) {
    const sort = {
      find: { // pull this out somewhere good.
        status: {
          $in: ['In Production', 'Post Production'],
        },
      },
      project: null,
      sort: {
        release_date: 1,
      },
    };

    const q = _.assign({}, query, sort, this.query);

    try {
      return await this.findPaged(q, params);
    } catch (e) {
      return { error: e };
    }
  }

  async findNowPlaying(query, params) {
    const sort = {
      sort: {
        vote_count: -1,
        vote_average: -1,
      },
    };

    const q = _.assign({}, query, sort, this.query);

    try {
      return await this.findPaged(q, params);
    } catch (e) {
      return { error: e };
    }
  }

  async findOne(query, params, req) {
    let { slug } = params;
    const findOne = {
      find: {
        id: parseInt(slug, 10),
      },
    };
    const q = _.assign({}, query, findOne, this.getQuery());
    let r;
    let packedUrl;

    if (slug && slug.split) {
      const [id, ...rest] = slug.split('-');
      slug = id;
    }

    try {
      packedUrl = validate.packEndpoint(req.originalUrl);
      const cached = await redisClient.getz(packedUrl, true);

      if (cached === null) {
        const collection = this.model ? this.model : db.collection(q.collectionName);
        r = await collection.findOne(q.find, q.project);
        redisClient.setz(packedUrl, r, env.redis.keyTtl);
      } else {
        r = (cached === '')
          ? null
          : cached;
      }

      this.storeEndpointInDB(packedUrl, params);
      return validate.formatPayload(r, params);
    } catch (e) {
      return { error: e };
    }
  }
}
