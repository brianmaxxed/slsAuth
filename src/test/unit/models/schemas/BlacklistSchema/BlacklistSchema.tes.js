import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestSchema from '../../../../../src/models/schemas/BlacklistSchema';

s.schemaRuleTests('BlacklistSchema', TestSchema, rules);
