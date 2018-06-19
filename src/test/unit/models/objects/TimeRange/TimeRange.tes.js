import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/TimeRange';

s.schemaRuleTests('TimeRangeSchema', TestObject, rules);
