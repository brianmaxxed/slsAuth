import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/Address';

s.schemaRuleTests('Address', TestObject, rules);
