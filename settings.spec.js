import { Meteor } from 'meteor/meteor';
import sinon from 'sinon';

describe('Settings - Unit tests', () => {

  it('checks required Meteor settings', () => {
    sinon.assert.match(
      Meteor.settings,
      {
        xAPI: {
          endPoint: sinon.match.string,
          authSecret: sinon.match.string,
        },
      },
    );
  });

});
