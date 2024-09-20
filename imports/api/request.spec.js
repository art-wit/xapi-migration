import { expect } from 'chai';
import sinon from 'sinon';
import { Request } from './request';

describe('Request - Unit tests', () => {

  beforeEach(() => {
    sinon.stub(Request.prototype, 'fetchRetry').get(
      sinon.fake.returns(sinon.fake.resolves({ text: sinon.fake() })),
    );
    sinon.replace(console, 'debug', sinon.fake());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#constructor', () => {

    it('checks constructor initial params', () => {
      const request = new Request();
      expect(request).to.have.own.property('bodyLimit');
      expect(request).to.have.own.property('requestCount');
      expect(request.method).to.be.equal('POST');
      expect(request.requestCount).to.be.equal(0);
      expect(request.headers).to.have.own.property('Authorization');
      expect(request.headers).to.have.own.property('X-Experience-API-Version');
    });

  });

  describe('#send', () => {

    async function launchSend(data) {
      data = data || {
        _id: 666,
        contentString: '666',
      };
      const request = new Request();
      await request.send(data, undefined);
      return request;
    }

    it('should increase request count', async () => {
      const request = await launchSend();
      expect(request.requestCount).to.be.equal(1);
    });

    it('should invokes fetchRetry method ONCE', async () => {
      const request = await launchSend();
      sinon.assert.calledOnce(request.fetchRetry);
    });

    it('should invokes fetchRetry with proper params', async () => {
      const request = await launchSend();
      sinon.assert.calledOnce(request.fetchRetry);
      sinon.assert.alwaysCalledWith(
        request.fetchRetry,
        undefined,
        sinon.match({
          method: sinon.match.string,
          headers: sinon.match({
            'X-Experience-API-Version': sinon.match.string,
            'Authorization': sinon.match.string,
            'Content-Type': sinon.match.string,
          }),
        }),
      );
    });

  });

  describe('#checkBodyLimit', () => {

    it('should throws error when request body is over limit', async () => {
      const request = new Request();
      request.bodyLimit = 2; //bytes
      expect(() => request.checkBodyLimit('bbb')).to.throw(Error);
    });

    it('should throws error with proper text', async () => {
      const request = new Request();
      request.bodyLimit = 2; //bytes
      request.requestCount = 666;
      request.method = 'POST';
      expect(() => request.checkBodyLimit('bbb')).to.throw('Too large request body (3 bytes) in POST request: 666. Decrease it.');
    });

  });

});
