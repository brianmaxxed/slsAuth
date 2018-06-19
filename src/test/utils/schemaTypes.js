import mongoose from 'mongoose';

import c from '../../../src/config/consts';

const MongooseSchema = mongoose.Schema;

const array = () => [];

const boolean = () => new MongooseSchema({ name: { type: Boolean } }).obj.name;

const date = () => new MongooseSchema({ name: { type: Date } }).obj.name;

const nested = () => c.NESTED;

const number = () => new MongooseSchema({ name: { type: Number } }).obj.name;

const schema = () => new MongooseSchema({ name: { type: String } });

const string = () => new MongooseSchema({ name: { type: String } }).obj.name;

const instances = () => {
  const Boolean = boolean();
  const Date = date();
  const Nested = nested();
  const Number = number();
  const Schema = schema();
  const String = string();

  return {
    Array, Boolean, Date, Nested, Number, Schema, String,
  };
};

const objectTypes = () => {
  const i = instances();

  return {
    Boolean: i.Boolean.type,
    Date: i.Date.type,
    Number: i.Number.type,
    Schema: i.Schema.type,
    String: i.String.type,
  };
};

export default {
  boolean,
  date,
  nested,
  number,
  schema,
  string,
  instances,
  objectTypes,
};
