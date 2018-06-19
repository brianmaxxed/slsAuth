import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/Contact';

s.schemaRuleTests('Contact', TestObject, rules);
