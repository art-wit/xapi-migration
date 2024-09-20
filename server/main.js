/* eslint-disable no-console */
import { StatementsCollection, StatesCollection } from '/imports/api/collections';
import { Statement } from '../imports/api/statement';
import { State } from '../imports/api/state';

/*
Statement

object:
 - choises
 - correctResponsesPattern
 - interactionType
 - source
 - target

result:
 - duration
 - response
 - score
 - success

*/
const statement = new Statement();
const state = new State();

(async () => {
  try {
    if (StatementsCollection.find().count() || StatesCollection.find().count()) {
      await statement.pushAll();
      await state.pushAll();
      console.log('All entytyies was sent');
      process.exit();
    } else {
      console.log('The base is empty, please, restore the xAPI data and restart script.');
    }
  } catch (err) {
    console.log(`Error time: ${new Date().toLocaleString()}`);
    console.error(err);
    process.exit();
  }
})();
