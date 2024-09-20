import { State } from './state';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  StatesCollection,
} from '/imports/api/collections';

describe('State - Unit tests', () => {

  beforeEach(() => {
    sinon.replace(State.prototype, 'send', sinon.fake());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#pushAll', () => {

    it('should invokes this.push method for Each State sent', async () => {
      const fakePush = sinon.fake();
      const collectionCount = 666;
      sinon.stub(StatesCollection, 'find')
        .returns(Object.assign([], { count: sinon.stub()
          .onFirstCall().returns(1).returns(0),
        fetch: () => new Array(collectionCount).fill(0) }));
      sinon.replace(State.prototype, 'push', fakePush);
      const state = new State();
      await state.pushAll();
      expect(state.push.callCount).to.be.equal(collectionCount);
    });

  });

  describe('#push', () => {

    async function launchPush(data) {
      data = data || {
        _id: 666,
        contentString: '666',
      };
      const state = new State();
      await state.push(data);
      return state;
    }

    it('should invokes this.xAPI method ONCE', async () => {
      sinon.replace(State.prototype, 'xAPI', sinon.fake.returns({}));
      const state = await launchPush();
      sinon.assert.calledOnce(state.xAPI);
    });

    it('should invokes send method ONCE', async () => {
      const state = await launchPush();
      sinon.assert.calledOnce(state.send);
    });

    it('should invokes urlString method ONCE', async () => {
      sinon.replace(State.prototype, 'urlString', sinon.fake());
      const state = await launchPush();
      sinon.assert.calledOnce(state.urlString);
    });

  });

  describe('#xAPI', () => {

    it('should removes ONLY field: _id', () => {
      const state = new State();
      const fieldsForExlude = {
        _id: 666,
        contentString: 777,
      };
      const data = {
        test: 'testValue',
        ...fieldsForExlude,
      };
      const xAPIData = state.xAPI(data);
      expect(xAPIData).to.be.an('object');
      expect(xAPIData).to.not.have.own.property('_id');
      expect(xAPIData).to.have.own.property('contentString');
      expect(xAPIData).to.have.own.property('test');
    });

  });

  describe('#urlString', () => {

    it('returns correct string url', () => {
      const data = {
        agent: '666',
        stateId: '777',
        activityId: '888',
      };
      const state = new State();
      const url = state.urlString(data);
      expect(url).to.be.a('string');
      expect(url).to.has.string('agent=%22666%22');
      expect(url).to.has.string('stateId=777');
      expect(url).to.has.string('activityId=888');
      expect(url).to.has.string('activities/state');
      expect(url).to.has.string('data/xAPI');
    });

  });

});
