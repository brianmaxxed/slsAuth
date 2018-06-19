import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestSchema from '../../../../../src/models/schemas/PaymentSchema';


// TODO:
s.schemaRuleTests('PaymentSchema', TestSchema, rules);
