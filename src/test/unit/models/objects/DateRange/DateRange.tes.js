import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/DateRange';


s.schemaRuleTests('DateRange', TestObject, rules);
