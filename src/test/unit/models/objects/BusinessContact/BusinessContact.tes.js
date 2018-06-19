import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/BusinessContact';

s.schemaRuleTests('BusinessContact', TestObject, rules);
