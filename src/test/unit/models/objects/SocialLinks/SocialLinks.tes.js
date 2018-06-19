import rules from './rules';
import s from '../../../../utils/schemaHelper';
import TestObject from '../../../../../src/models/objects/SocialLinks';


const nestedObject = true;
s.schemaRuleTests('SocialLinksSchema', TestObject, rules, nestedObject);
