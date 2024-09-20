import { expect } from 'chai';
import sinon from 'sinon';
import { State } from './state';
import { StatesCollection } from './collections';

// Data sample from a real Sling LMS database
const testData = [
  {
    _id: 'ajEYJCpMFst9h5JPa',
    stateId: 'resume',
    activityId: 'http://t11xBa64Kbc_course_id',
    agent: {
      objectType: 'Agent',
      account: {
        name: 'tr4phtSJojGSyc8gF',
        homePage: 'https://my.amsed.com.au',
      },
    },
    contentType: 'application/octet-stream',
    registration: 'a8afae80-5c22-11e9-b43f-db3770877bca',
    contentString: '2n246070ji1001112a0101201112~2F1A0000000000000000000000000000000000001^1^1^1^1^1^1^1^1^1^1^1^1^1^1^10v_player.5jYPOO0AVVy.5dZuRj0OQ5s1^1^00100000000002000',
    updated: new Date('2019-04-11T06:26:07.149Z'),
  },
  {
    _id: 'LFa5rDW6omaTQ3cfR',
    stateId: 'resume',
    activityId: 'http://XMspIUldQYI_course_id',
    agent: {
      objectType: 'Agent',
      account: {
        name: 'Z5ut8rNP4qTb23cTQ',
        homePage: 'https://my.amsed.com.au',
      },
    },
    contentType: 'application/octet-stream',
    registration: '17ec0d60-8b06-11e7-90c1-574db7fe124f',
    contentString: '2a2g60708090a0b0c0d0NM1001013E0101201112012120131201412015120161201013M30001^101010v_player.5WByQDx9dYN.5ZmshTuh6b81^1^0000000000000000002000',
    updated: new Date('2017-08-27T09:04:51.542Z'),
  },
  {
    _id: 'uQoHuYnrMbLTr45vW',
    stateId: 'resume',
    activityId: 'http://XMspIUldQYI_course_id',
    agent: {
      objectType: 'Agent',
      account: {
        name: 'tr4phtSJojGSyc8gF',
        homePage: 'https://my.amsed.com.au',
      },
    },
    contentType: 'application/octet-stream',
    registration: '8ad442a0-5ffa-11e9-b43f-db3770877bca',
    contentString: '2Z2i6070809091a0b0c0d0NM1001712E0101201112012120131201412015120161201712~2u1t000000000000000000000000000001^1^1^1^1^1^1^1^1^1^1^101010v_player.5f0uJ6rh0by.5rPD2hJHOYw1^1^0000000000000000002000',
    updated: new Date('2019-04-16T03:49:17.388Z'),
  },
];

describe('State - Integration tests', () => {

  beforeEach(() => {
    sinon.stub(State.prototype, 'send').resolves(true);
    sinon.replace(console, 'log', sinon.fake());
  });

  afterEach(() => {
    sinon.restore();
  });

  function verifySendArgs(state, [body, url]) {
    expect(body).to.deep.include({
      stateId: state.stateId,
      activityId: state.activityId,
      agent: state.agent,
      contentType: state.contentType,
      registration: state.registration,
      contentString: state.contentString,
      updated: state.updated,
    });
    // Based on PUT /ACTIVITIES/STATE documentation:
    // https://docs.learninglocker.net/http-xapi-states/#put-activitiesstate
    expect(url).to.include(`stateId=${encodeURIComponent(state.stateId)}`)
      .and.include(`activityId=${encodeURIComponent(state.activityId)}`)
      .and.include(`agent=${encodeURIComponent(JSON.stringify(state.agent))}`)
      .and.include(`registration=${encodeURIComponent(state.registration)}`);
  }

  it('converts & sends a single State document properly', async () => {
    const [state] = testData;
    const sender = new State();
    sinon.stub(StatesCollection, 'find')
      .returns(Object.assign([], { count: sinon.stub()
        .onFirstCall().returns(1).returns(0),
      fetch: () => [state] }));
    await sender.pushAll();
    sinon.assert.calledOnce(State.prototype.send);
    verifySendArgs(state, State.prototype.send.firstCall.args);
  });

  it('converts & sends multiple State documents properly', async () => {
    const sender = new State();
    sinon.stub(StatesCollection, 'find')
      .returns(Object.assign([], { count: sinon.stub()
        .onFirstCall().returns(1).returns(0),
      fetch: () => [...testData] }));
    await sender.pushAll();
    State.prototype.send.args.forEach((args, index) => {
      verifySendArgs(testData[index], args);
    });
  });

});
