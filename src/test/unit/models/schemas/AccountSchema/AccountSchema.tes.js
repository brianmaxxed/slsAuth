import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestSchema from '../../../../../src/models/schemas/AccountSchema';

// TODO:
s.schemaRuleTests('AccountSchema', TestSchema, rules);
