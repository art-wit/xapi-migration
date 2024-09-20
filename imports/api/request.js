/* eslint-disable no-console */
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import wrapFetch from 'fetch-retry';

export class Request {

  headers = {
    'X-Experience-API-Version': '1.0.3',
    'Authorization': `Basic ${Meteor.settings.xAPI.authSecret}`,
    'Content-Type': 'application/json',
  };

  bodyLimit = 1046562; // bytes

  requestCount = 0;

  method = 'POST';

  /**
   *   Wrapper of fetch and fetchRetry methods.
   *   It uses exclusively for testing needs.
  */
  get fetchRetry() {
    return wrapFetch(fetch);
  }

  /**
   *  Private
   */
  async send(body, url) {
    this.requestCount++;
    const request = {
      method: this.method,
      headers: this.headers,
      body: this.checkBodyLimit(JSON.stringify(body)),
      retryDelay: 3000,
      retries: 1,
      retryOn: async function(attempt, error, response) {
        // retry on any network error, or 4xx or 5xx status codes
        let message;
        if (response.statusText === 'No Content') {
          const responseData = await response.text();
          console.log(responseData);
        } else {
          message = (await response.json()).message;
        }

        console.log(`retrying, attempt number ${attempt + 1} ${attempt}, ${error}, ${response?.status}`);
        if (error !== null || response?.status >= 400) {
          if (message?.match(/is conflicting/)) {
            throw new Error(message);
          }
          response?.status && console.error(`\nCode: ${response.status}`);
          error && console.error(`\nError: ${error}`);
          console.log(`retrying, attempt number ${attempt + 1}`);
          return true;
        }
        return undefined;
      },
    };
    await this.fetchRetry(url, request);
  }

  checkBodyLimit(body) {
    if (body.length > this.bodyLimit) {
      throw new Error(`Too large request body (${body.length} bytes) in ${this.method} request: ${this.requestCount}. Decrease it.`);
    }
    return body;
  }

  IRLFix(irl) {
    if (irl) {
      if (irl.slice(0, 4) !== 'http') {
        return `https://${irl}`;
      }
    } else {
      return undefined;
    }
    return undefined;
  }

  url() {
    return new URL(Meteor.settings.xAPI.endPoint);
  }

}
