import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/PaymentOut';

s.schemaRuleTests('PaymentOut', TestObject, rules);
