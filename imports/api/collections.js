import { Mongo } from 'meteor/mongo';

export const StatementsCollection = new Mongo.Collection('statements');
export const StatesCollection = new Mongo.Collection('states');
