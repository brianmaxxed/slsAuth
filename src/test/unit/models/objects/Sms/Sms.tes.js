import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/Sms';


s.schemaRuleTests('Sms', TestObject, rules);
