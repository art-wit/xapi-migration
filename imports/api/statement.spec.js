import { Statement } from './statement';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import { StatementsCollection } from '/imports/api/collections';

chai.use(require('chai-as-promised'));

describe('Statement - Unit tests', () => {

  beforeEach(() => {
    sinon.replace(Statement.prototype, 'send', sinon.fake());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#constructor', () => {

    it('check constructor initial params', () => {
      const statement = new Statement();
      expect(statement.batchLimit).to.be.a('number');
    });

  });

  describe('#pushAll', () => {

    beforeEach(() => {
      sinon.replace(Statement.prototype, 'push', sinon.fake());
      sinon.replace(Statement.prototype, 'xAPI', sinon.fake());
    });

    async function launchPushAll(collectionCount) {
      sinon.stub(StatementsCollection, 'find')
        .returns(Object.assign([], { count: sinon.stub()
          .onFirstCall().returns(1).returns(0),
        fetch: () => new Array(collectionCount).fill(0) }));
      const statement = new Statement();
      statement.batchLimit = 666;
      await statement.pushAll();
      return statement;
    }

    it('should invokes `push` method ONCE (in batch limit)', async () => {
      const collectionCount = 666;
      const statement = await launchPushAll(collectionCount);
      sinon.assert.calledOnce(statement.push);
    });

    it('should not invoke `xAPI` method', async () => {
      const collectionCount = 666;
      const statement = await launchPushAll(collectionCount);
      expect(statement.xAPI.callCount).to.be.equal(0);
    });

  });

  describe('#push', () => {

    async function launchPush(collectionsCount = 666) {
      const data = new Array(collectionsCount).fill(0);
      const statement = new Statement();
      statement.batchLimit = 666;
      await statement.push(data);
      return statement;
    }

    it('invokes this.xAPI method for Each Statement sent', async () => {
      const collectionsCount = 666;
      sinon.replace(Statement.prototype, 'xAPI', sinon.fake());
      const statement = await launchPush(collectionsCount);
      expect(statement.xAPI.callCount).to.be.equal(collectionsCount);
    });

    it('throws error when batch is over limit', async () => {
      const collectionsCount = 667;
      await expect(launchPush(collectionsCount)).to.be.rejected;
    });

    it('invokes send method ONCE', async () => {
      const statement = await launchPush();
      sinon.assert.calledOnce(statement.send);
    });

    it('invokes urlString method ONCE', async () => {
      sinon.replace(Statement.prototype, 'urlString', sinon.fake());
      const statement = await launchPush();
      sinon.assert.calledOnce(statement.urlString);
    });

  });

  describe('#xAPI', () => {

    it('should assigns _id field value to id field', async () => {
      const statement = new Statement();
      const data = {
        _id: 666,
      };
      const xAPIData = statement.xAPI(data);
      expect(xAPIData).to.have.own.property('id');
      expect(xAPIData.id).to.be.equal(666);
    });

    it('should removes ONLY fields: _id, user_id, module_id, xAPICourseId, registration_id, organisation_id', async () => {
      const statement = new Statement();
      const fieldsForExlude = {
        _id: 666,
        user_id: 666,
        module_id: 666,
        xAPICourseId: 666,
        registration_id: 666,
        organisation_id: 666,
      };
      const data = {
        test: 'testValue',
        ...fieldsForExlude,
      };
      const xAPIData = statement.xAPI(data);
      for (const key in fieldsForExlude) {
        if (Object.hasOwnProperty.call(fieldsForExlude, key)) {
          expect(xAPIData).to.not.have.own.property(fieldsForExlude[key]);
        }
      }
      expect(xAPIData).to.have.own.property('test');
    });

  });

  describe('#convertToIRL', () => {

    it('not overwrite fields', () => {
      const statement = new Statement();
      const IRLFields = {
        actor: {
          account: {
            homePage: 'homePage',
            test: 'testField',
          },
        },
        verb: {
          id: 'verbId',
          test: 'testField',
        },
        object: {
          id: 'objectId',
          type: 'objectType',
          test: 'testField',
        },
        context: {
          parent: [
            {
              id: 'parentId',
              test: 'testField',
            },
            {
              test: 'testField',
            },
          ],
          grouping: [
            {
              id: 'groupingId',
              test: 'testField',
            },
            {
              test: 'testField',
            },
          ],
        },
      };
      const fixedStatement = statement.convertToIRL(IRLFields);
      expect(fixedStatement).to.have.nested.property('actor.account.test');
      expect(fixedStatement).to.have.nested.property('verb.test');
      expect(fixedStatement).to.have.nested.property('object.test');
      expect(fixedStatement).to.have.nested.property('context.parent[0].test');
      expect(fixedStatement).to.have.nested.property('context.parent[1].test');
      expect(fixedStatement).to.not.have.nested.property('context.parent[1].id');
      expect(fixedStatement).to.have.nested.property('context.grouping[0].test');
      expect(fixedStatement).to.have.nested.property('context.grouping[1].test');
      expect(fixedStatement).to.not.have.nested.property('context.grouping[1].id');
    });

  });

  describe('#urlString', () => {

    it('returns correct string url', () => {
      const statement = new Statement();
      const url = statement.urlString();
      expect(url).to.be.a('string');
      expect(url).to.has.string('data/xAPI');
      expect(url).to.has.string('statements');
    });

  });

});
