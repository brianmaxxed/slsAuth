import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/PaymentIn';

s.schemaRuleTests('PaymentIn', TestObject, rules);
