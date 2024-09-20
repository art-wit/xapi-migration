/* eslint-disable no-console */
import { omit, merge } from 'lodash';
import { StatesCollection } from './collections';

import { Request } from './request';

export class State extends Request {

  async pushAll() {
    while (this.count() !== 0) {
      const states = StatesCollection.find({}, {
        limit: 100,
        sort: { updated: -1 },
      }).fetch();
      for (const state of states) {
        // eslint-disable-next-line no-await-in-loop
        await this.push(state);
      }
    }
  }

  async push(state) {
    const body = this.xAPI(state);
    await this.send(body, this.urlString(state));
    console.log(`${new Date().toLocaleString()} Pushed to LL: 1 of ${this.count()} states`);
    /*
      Remove successfully sent state here
    */
    this.remove(state);
    console.log('Sate removed');
  }

  remove(state) {
    StatesCollection.remove(state._id);
  }

  count() {
    const counting = StatesCollection.estimatedDocumentsCount();
    return Future.fromPromise(counting).wait();
  }

  xAPI(state) {
    const fixedState = this.convertToIRL(state);
    return omit(fixedState, ['_id']);
  }

  urlString(state) {
    const url = this.url();
    url.pathname += '/activities/state';
    url.searchParams.append('activityId', state.activityId);
    url.searchParams.append('stateId', state.stateId);
    url.searchParams.append('agent', JSON.stringify(state.agent));
    url.searchParams.append('registration', state.registration);
    return url.href;
  }

  convertToIRL(state) {
    const homePage = this.IRLFix(state?.agent?.account?.homePage);

    return merge(
      state,
      homePage && {
        agent: {
          account: {
            homePage,
          },
        },
      },
    );
  }

}
