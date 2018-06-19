import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: false });

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['hello'],
  items: { hello: { type: 'string' } },
};
