import env from '../../config/env';
import log from '../../utils/logger';
import mc from '../utils/mongooseHelper';

module.exports = async () => {
  // const db = await mc.dropDb();

  console.log('GLOBAL JEST TEARDOWN.');
};
