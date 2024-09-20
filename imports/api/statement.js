/* eslint-disable no-console */
import {
  StatementsCollection,
} from '/imports/api/collections';

import { Request } from './request';
import { omit, merge, _ } from 'lodash';
import Future from 'fibers/future';

export class Statement extends Request {

  batchLimit = 850;

  async pushAll() {
    while (this.count() !== 0) {
      const statementsBatch = StatementsCollection.find({}, {
        limit: this.batchLimit,
        sort: { timestamp: -1 },
      }).fetch();
      // eslint-disable-next-line no-await-in-loop
      await this.push(statementsBatch);
    }
  }

  async push(statements) {
    if (statements.length > this.batchLimit) {
      throw new Error(`Batch is over limit. You should reduce the statements amount from ${statements.length} to: ${this.batchLimit} or increase limit.`);
    }
    const body = statements.map(statement => this.xAPI(statement));
    try {
      await this.send(body, this.urlString());
    } catch (err) {
      if (err.message.match(/is conflicting/)) {
        const id = err.message.slice(0, -15);
        StatementsCollection.remove(id);
        console.log(`Duplicate Statement: ${id} removed. ${this.count()}`);
        await this.push(statements.filter(statement => statement._id !== id));
        return;
      }
    }
    console.log(`${new Date().toLocaleString()} Pushed to LL: ${statements.length} of ${this.count()} statements`);
    /*
    Remove successfully sent statements here
    */
    this.remove(statements);
    console.log('Satement batch removed');
  }

  remove(statements) {
    statements.map(statement => StatementsCollection.remove(statement._id));
  }

  count() {
    const counting = StatementsCollection.estimatedDocumentsCount();
    return Future.fromPromise(counting).wait();
  }

  xAPI(statement) {
    const { scaled } = statement.result?.score || {};
    const fixedStatement = this.convertToIRL(statement);
    return merge(
      {},
      {
        id: fixedStatement._id,
        ...omit(fixedStatement, [
          '_id',
          'user_id',
          'module_id',
          'xAPICourseId',
          'registration_id',
          'organisation_id',
        ]),
      },
      !_.isUndefined(scaled) && {
        result: {
          score: {
            // Decimal number between -1 and 1, inclusive (null = -1)
            scaled: this.convertScaled(scaled),
          },
        },
      },
    );
  }

  convertToIRL(statement) {
    const homePage = this.IRLFix(statement?.actor?.account?.homePage);
    const verbId = this.IRLFix(statement?.verb?.id);
    const objectId = this.IRLFix(statement?.object?.id);
    const objectType = this.IRLFix(statement?.object?.type);
    const parentArr = statement?.context?.parent?.map(({ id }) => (id && { id: this.IRLFix(id) }));
    const groupingArr = statement?.context?.grouping?.map(({ id }) => (id && { id: this.IRLFix(id) }));

    return merge(
      statement,
      homePage && {
        actor: {
          account: {
            homePage,
          },
        },
      },
      verbId && {
        verb: {
          id: verbId,
        },
      },
      objectId && {
        object: {
          id: objectId,
        },
      },
      objectType && {
        object: {
          type: objectType,
        },
      },
      parentArr && {
        context: {
          parent: parentArr,
        },
      },
      groupingArr && {
        context: {
          grouping: parentArr,
        },
      },
    );
  }

  urlString() {
    const url = this.url();
    url.pathname += '/statements';
    return url.href;
  }

  convertScaled(scaled) {
    if (Number.isInteger(scaled)) {
      let validated = scaled > 1 ? 1 : scaled;
      validated = scaled < -1 ? -1 : scaled;
      return validated;
    } else {
      return -1;
    }
  }

}
