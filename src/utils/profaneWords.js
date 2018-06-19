import log from './logger';
import c from '../config/consts';

let alwaysBad = null;
let spacedBad = null;
let comboBad = null;

const regexEscapedString = (str) => {
  const escapes = '[\\^$.|?*+()'.split('');
  let escaped = '';

  const ar = str.split('');

  ar.forEach((letter) => {
    escaped += (escaped.includes(letter))
      ? `${letter}`
      : letter;
  });

  return escaped;
};

const profanityUsed = (...params) => {
  const list = params.map(word => (typeof word === 'string' ? word.toLowerCase() : word));
  const joined = list.join(' ');

  const always = alwaysBad.filter((word) => {
    const m = new RegExp(`${regexEscapedString(word)}`).exec(joined);
    return m !== null;
  });

  if (always.length > 0) {
    return true;
  }

  const spaced = spacedBad.filter((word) => {
    const m = new RegExp(String.raw`([^a-z]|^)(${regexEscapedString(word)})([^a-z]|$)`).exec(joined);
    // log.debug(m);
    return m !== null;
  });

  if (spaced.length > 0) {
    return true;
  }

  const combo = comboBad.filter((word) => {
    const regex = word.replace(/[^a-z0-9]/g, '\\W*');
    const m = new RegExp(`\\W*${regex}`).exec(joined);
    return m !== null;
  });

  if (combo.length > 0) {
    return true;
  }

  return false;
};

alwaysBad = [
  'asshole',
  'bitch',
  'cunt',
  'fuck',
  'whore',
  'shit',
];

// alone or spaced with non-letters
spacedBad = [
  '2g1c',
  'ass',
  'nob',
  'ekrem',
  'fuk',
  'cock',
  'clit',
];

// alone or combined with non-letters
comboBad = ['dirt bag', 'blow job', 'breast lover', '2 girls 1 cup', 'barely legal'];

export default {
  profanityUsed,
};
