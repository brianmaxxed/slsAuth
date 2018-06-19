import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/Time';

s.schemaRuleTests('TimeSchema', TestObject, rules);
