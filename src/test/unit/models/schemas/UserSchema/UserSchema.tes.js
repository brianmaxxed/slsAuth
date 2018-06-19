import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestSchema from '../../../../../../src/models/schemas/UserSchema';

s.schemaRuleTests('UserSchema', TestSchema, rules);
