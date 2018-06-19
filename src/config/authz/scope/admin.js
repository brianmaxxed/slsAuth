import _ from 'lodash';
import base from './manager';

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
