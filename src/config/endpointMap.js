/* eslint no-useless-escape: 0 */

/*
  endpoints are mapped to appreviated keys.
  only include the left-most part of the endpoints
  the rest of the dynamic request url will be added via code.

  regex testing:
  https://regexr.com/
  http://grainge.org/pages/authoring/regex/regular_expressions.htm

*/

const endpointMap = {
  // search endpoints
  '/a/s/mu/': /^(\/api\/search\/multi\/)(.*)/i,
  '/a/s/p/': /^(\/api\/search\/person\/)(.*)/i,
  '/a/s/m/': /^(\/api\/search\/movie\/)(.*)/i,
  '/a/s/t/': /^(\/api\/search\/tv\/)(.*)/i,
  '/a/s/s/': /^(\/api\/search\/season\/)(.*)/i,
  '/a/s/e/': /^(\/api\/search\/episode\/)(.*)/i,
  '/a/s/w/': /^(\/api\/search\/web\/)(.*)/i,
  // movies
  '/a/m': /^(\/api\/movie)\/?$/i,
  '/a/m/d/': /^(\/api\/movie\/detail\/)(.*)/i,
  '/a/m/t': /^(\/api\/movie\/top\-rated)\/?$/i,
  '/a/m/u': /^(\/api\/movie\/upcoming)\/?$/i,
  '/a/m/n': /^(\/api\/movie\/now-playing)\/?$/i,

  // tv
  '/a/t/': /^(\/api\/tv)\/?$/i,
  '/a/t/t': /^(\/api\/tv\/top\-rated)\/?$/i,
  '/a/t/d/': /^(\/api\/tv\/detail\/)(.*)/i,
  '/a/t/u': /^(\/api\/tv\/upcoming)\/?$/i,
  '/a/t/n': /^(\/api\/tv\/now-playing)\/?$/i,

  // series
  '/a/se': /^(\/api\/series)\/?$/i,
  '/a/se/t': /^(\/api\/series\/top\-rated)\/?$/i,
  '/a/se/d/': /^(\/api\/series\/detail\/)(.*)/i,
  '/a/se/u': /^(\/api\/series\/upcoming)\/?$/i,
  '/a/se/n': /^(\/api\/series\/now-playing)\/?$/i,

  // season
  '/a/ss': /^(\/api\/season)\/?$/i,
  '/a/ss/t': /^(\/api\/season\/top\-rated)\/?$/i,
  '/a/ss/d/': /^(\/api\/season\/detail\/)(.*)/i,
  '/a/ss/u': /^(\/api\/season\/upcoming)\/?$/i,
  '/a/ss/n': /^(\/api\/season\/now-playing)\/?$/i,

  // episodes
  '/a/e': /^(\/api\/episode)\/?$/i,
  '/a/e/t': /^(\/api\/episode\/top\-rated)\/?$/i,
  '/a/e/d/': /^(\/api\/episode\/detail\/)(.*)/i,
  '/a/e/u': /^(\/api\/episode\/upcoming)\/?$/i,
  '/a/e/n': /^(\/api\/episode\/now-playing)$\/?/i,

  // person
  '/a/p': /^(\/api\/person)\/?$/i,
  '/a/p/d/': /^(\/api\/person\/detail\/)(.*)/i,

  // Discover

};

const keys = Object.keys(endpointMap);
const values = Object.values(endpointMap);

export default {
  keys,
  values,
  endpointMap,
};
