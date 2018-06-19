import User from './User';
import Account from './Account';
import Agreement from './Agreement';
import Blacklist from './Blacklist';

export default class Models {
  constructor() {
    this.models = Models.all;
  }

  static get all() {
    return {
      user: new User(),
      // agreement: new Agreement(),
      account: new Account(),
      blacklist: new Blacklist(),
    };
  }

  get all() {
    return Object.assign({}, this.models);
  }
}
