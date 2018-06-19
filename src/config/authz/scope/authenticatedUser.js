import _ from 'lodash';
import base from './unauthenticatedUser';


const scope = {};

scope.read = _.union(base.read, [

]);

scope.write = _.union(base.write, [

]);

scope.softDelete = _.union(base.softDelete, [

]);

scope.delete = _.union(base.delete, [

]);


export default scope;

/*

  TODO: concept of user read/write privs.
  Q: how do you differentiate a user having access to themselves vs another user profile.
  isAuthenticated then some concept of self and others.

  ex: profile.
  read:own:user:profile.
  write:own:user:profile:field1
  write:other:user:profile:field1
  write:group:user:profile:field1   (think of group as account).
  needs to be thought through. can keep it simple for now.

  seems having a directive on a field might help if that's possible.
  do the high level authz and then see if i need to get granular.
  seems for the tek site i do need granualar so do that later than sooner.


  TODO: add concent of field level authorization.
  how would that work? can be that fields are in read/write.
  nested object off read/write array.

  scope:read:user:field1
  scope:write:user:field2

ex: read: [
  fields: [

  ]
]
]
*/
