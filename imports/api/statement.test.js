import { expect } from 'chai';
import sinon from 'sinon';
import { Statement } from './statement';
import { StatementsCollection } from './collections';

// Data sample from a real Sling LMS database
const testData = [{
  _id: 'df807982-475d-44ab-803e-e72274f9d179',
  user_id: 'AsDkXv2t5vXLyvdMA',
  module_id: 'PgavT9ZqEYyM3dkbw',
  registration_id: 'aa27d590-8720-11e7-8f5b-19cdb3ecb5cb',
  xAPICourseId: 'http://t11xBa64Kbc_course_id',
  actor: {
    objectType: 'Agent',
    account: {
      name: 'AsDkXv2t5vXLyvdMA',
      homePage: 'https://my.amsed.com.au',
    },
  },
  verb: {
    id: 'http://adlnet.gov/expapi/verbs/attempted',
    display: {
      'en-US': 'attempted',
    },
  },
  object: {
    id: 'http://t11xBa64Kbc_course_id',
    objectType: 'Activity',
    definition: {
      type: 'http://adlnet.gov/expapi/activities/course',
      name: {
        und: 'Code of Conduct for Employees of Aboriginal Health Services',
      },
      description: {
        und: '',
      },
    },
  },
  context: {
    registration: 'aa27d590-8720-11e7-8f5b-19cdb3ecb5cb',
    contextActivities: {
      parent: [
        {
          id: 'http://t11xBa64Kbc_course_id',
          objectType: 'Activity',
        },
      ],
      grouping: [
        {
          id: 'http://t11xBa64Kbc_course_id',
          objectType: 'Activity',
        },
      ],
    },
  },
  timestamp: new Date('2017-08-22T10:00:05.661Z'),
  result: {
    completion: false,
  },
  organisation_id: 'Z6sbPBXywDWdceYtY',
  stored: new Date('2017-08-22T10:00:05.709Z'),
}, {
  _id: 'c1e35c79-7695-4d80-976c-c70708f7051e',
  user_id: 'AsDkXv2t5vXLyvdMA',
  module_id: 'PgavT9ZqEYyM3dkbw',
  registration_id: 'aa27d590-8720-11e7-8f5b-19cdb3ecb5cb',
  xAPICourseId: 'http://t11xBa64Kbc_course_id',
  actor: {
    objectType: 'Agent',
    account: {
      name: 'AsDkXv2t5vXLyvdMA',
      homePage: 'https://my.amsed.com.au',
    },
  },
  verb: {
    id: 'http://adlnet.gov/expapi/verbs/experienced',
    display: {
      'en-US': 'experienced',
    },
  },
  object: {
    id: 'http://t11xBa64Kbc_course_id/5dZuRj0OQ5s',
    objectType: 'Activity',
    definition: {
      type: 'http://adlnet.gov/expapi/activities/module',
      name: {
        und: 'Title',
      },
      description: {
        und: 'Title',
      },
    },
  },
  context: {
    registration: 'aa27d590-8720-11e7-8f5b-19cdb3ecb5cb',
    contextActivities: {
      parent: [
        {
          id: 'http://t11xBa64Kbc_course_id',
          objectType: 'Activity',
        },
      ],
      grouping: [
        {
          id: 'http://t11xBa64Kbc_course_id',
          objectType: 'Activity',
        },
      ],
    },
  },
  timestamp: new Date('2017-08-22T10:00:06.063Z'),
  organisation_id: 'Z6sbPBXywDWdceYtY',
  stored: new Date('2017-08-22T10:00:06.107Z'),
}];

describe('Statement - Integration tests', () => {

  beforeEach(() => {
    sinon.stub(Statement.prototype, 'send').resolves(true);
  });

  afterEach(() => {
    sinon.restore();
  });

  function verifySendArgs(statement, [body]) {
    expect(body[0]).to.deep.include({
      actor: statement.actor,
      verb: statement.verb,
      object: statement.object,
      context: statement.context,
      timestamp: statement.timestamp,
    });
  }

  it('converts & sends a single Statement document properly', async () => {
    const [statement] = testData;
    sinon.stub(StatementsCollection, 'find')
      .returns(Object.assign([], { count: sinon.stub()
        .onFirstCall().returns(1).returns(0),
      fetch: () => [statement] }));
    const sender = new Statement();
    await sender.pushAll();
    sinon.assert.calledOnce(Statement.prototype.send);
    verifySendArgs(statement, Statement.prototype.send.firstCall.args);
  });

  it.skip('converts & sends multiple Statement documents properly', async () => {
    const sender = new Statement();
    sender.batchLimit = 1;
    sinon.stub(StatementsCollection, 'find').returns([...testData]);
    await sender.pushAll();
    sinon.assert.callCount(Statement.prototype.send, testData.length);
    Statement.prototype.send.args.forEach((args, index) => {
      verifySendArgs(testData[index], args);
    });
  });

  it('removes duplicate statement when fetchRetry returns conflicting statement error', async () => {
    // Restore Statement.send
    sinon.restore();
    sinon.replace(console, 'log', sinon.fake());
    sinon.spy(StatementsCollection, 'remove');
    const ids = testData.map(statement => StatementsCollection.insert(statement));
    const sender = new Statement();
    sinon.spy(sender, 'remove');
    sinon.stub(sender, 'fetchRetry').get(
      sinon.fake.returns(
        sinon.stub()
          .onFirstCall().rejects(new Error(`${ids[0]} is conflicting`)),
      ),
    );
    await sender.pushAll();
    sinon.assert.calledOnce(sender.remove);
    expect(StatementsCollection.find().count()).equal(0);
    sinon.restore();
    ids.map(id => StatementsCollection.remove(id));
  });

});
