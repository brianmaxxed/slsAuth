/* eslint-disable */
import mongoose from 'mongoose';
import _ from 'lodash';
import schemaTypes from './schemaTypes';
import c from '../../src/config/consts';
import log from '../../src/utils/logger';

const MongooseSchema = mongoose.Schema;

const indexTypes = [
  c.INDEX,
  c.UNIQUE,
  c.SPARSE,
];

function filterToProps(obj, arr) {
  const test = {};

  _.forOwn(obj, (values, key) => {
    const keys = Object.keys(values).filter(e => {
      return arr.includes(e);
    });
    if (keys.length > 0) {
      keys.forEach((item) => {
        test[key] = {};
        test[key][item] = values[item];
      });
    }
  });

  return test;
}

function booleanToProp(obj, newProp) {
  const test = {};

  _.forOwn(obj, (value, key) => {
    const prop = {};
    prop[newProp] = value;
    test[key] = prop;
  });

  return test;
}

function schemaRuleTests(SchemaName, TestSchema, rules, nestedObject = false) {

  describe(`${SchemaName} Rules Test`, () => {
    describe('Fields and Types', () => {
      test('should have at least one field rule', () => {
        expect(rules.fields).to.not.be.empty;
      });

      test('should be a Mongoose Schema Object', () => {
        expect(TestSchema).toBeInstanceOf(MongooseSchema);
      });

      test('should have all ordered field rules', () => {
        expect(Object.keys(TestSchema.obj)).to.have.ordered.members(Object.keys(rules.fields));
      });

      test('should have all correct field types', () => {
        //console.log(rules.fields);
        /*
          there are 4 field rule types.
          1 - false - only used for _id: false to signal there is no objectId for the schema.
          2 - Nested - for nested object structures. to be added, pretty common.
          3 - Arrays - of (anything really) to be added later, should be arrays of types.
            - this will cause this function to be moved to a helperLibrary to be recursively used.
          4 - objects without types. will be Schemas at this point, as 1,2,3 have been tested.
          5 - having an issue with arrays of subdocuments; need to review how this works.
        */

        //console.log(rules.fields);
        for (const field in rules.fields) {
          // _id is only used to turn off default objectId: _id: false
          if (field === '_id') {
            expect.toBe(TestSchema.obj[field], `${field}:`, false);
            // Nested...
          } else if (rules.fields[field] instanceof Object && nestedObject) {
            expect.isTrue(_.isEqual(TestSchema.obj[field], rules.fields[field]), `${field}:`);
            // TODO for nested objects. pass for now.

          // test for arrays of types.
          } else if (Array.isArray(rules.fields[field])) {
            if (field === 'contact') {
              console.log(rules.fields[field]);
              console.log(TestSchema.obj[field]);
            }

            if (!rules.fields[field].type) {
              //expect(TestSchema.obj[field][0]).toBeInstanceOf(MongooseSchema);
              // expect(TestSchema.obj[field]).to.be.an('array', `${field}:`);
            } else {
              expect(Array.isArray(TestSchema.obj[field])).toBe(true, `${field}:`);
            }
          // if no type property then this must be a Schema at this point.
          } else if (!rules.fields[field].type) {
            if (rules.fields[field] instanceof MongooseSchema) {
              //console.log(field, typeof TestSchema.obj[field].type, typeof rules.fields[field].type);
              expect(rules.fields[field]).toBeInstanceOf(MongooseSchema, `${field}:`);
              expect(TestSchema.obj[field]).toBeInstanceOf(MongooseSchema), `${field}:`;
            } else {
              // console.log(">>>> ", field, TestSchema.obj[field], rules.fields[field]);
              expect(TestSchema.obj[field]).toEqual(rules.fields[field], `${field}:`);
            }
          } else {
             // console.log(field, typeof TestSchema.obj[field].type, typeof rules.fields[field].type);
             // console.log(field, typeof TestSchema.obj[field].type instanceof mongoose.Schema, typeof rules.fields[field].type instanceof mongoose.Schema)
            //console.log(field, TestSchema.obj[field].type, rules.fields[field].type);
            expect(TestSchema.obj[field].type).toEqual(rules.fields[field].type, `${field}:`);
          }
        }
      });

      if (!nestedObject) {
        test('should match the required field rules', () => {
          const testFields = filterToProps(TestSchema.obj, ['required']);
          let required = rules.required;
          if (_.size(required) > 0 && typeof Object.values(required)[0] === 'boolean' ) {
            required = booleanToProp(required, 'required');
          }

          expect.isTrue(_.isEqual(testFields, required));
        });
      }

      if (!nestedObject) {
        test('should match the index rules', () => {
          const testFields = filterToProps(TestSchema.obj, indexTypes);
          expect.isTrue(_.isEqual(testFields, rules.indexes));
        });
      }
    });
  });
}

/*

enums

references

validations


*/
export default {
  schemaRuleTests,
};
