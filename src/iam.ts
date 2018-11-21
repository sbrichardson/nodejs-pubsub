/*!
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*!
 * @module pubsub/iam
 */

import * as arrify from 'arrify';
import {promisifyAll} from '@google-cloud/promisify';
import { PubSub } from '.';
import { CallOptions } from 'google-gax';

/**
 * @callback GetPolicyCallback
 * @param {?Error} err Request error, if any.
 * @param {object} acl The policy.
 * @param {object} apiResponse The full API response.
 */
export interface GetPolicyCallback {
  (err?: Error|null, acl?: Policy|null, apiResponse?: object): void;
}

/**
 * @callback SetPolicyCallback
 * @param {?Error} err Request error, if any.
 * @param {object} acl The policy.
 * @param {object} apiResponse The full API response.
 */
export interface SetPolicyCallback {
  (err?: Error|null, acl?: Policy|null, apiResponse?: object): void;
}

/**
 * @typedef {array} SetPolicyResponse
 * @property {object} 0 The policy.
 * @property {object} 1 The full API response.
 */
export type SetPolicyResponse = [Policy, object];

/**
 * @typedef {array} GetPolicyResponse
 * @property {object} 0 The policy.
 * @property {object} 1 The full API response.
 */
export type GetPolicyResponse = [Policy, object];

/**
 * @typedef {array} TestIamPermissionsResponse
 * @property {object[]} 0 A subset of permissions that the caller is allowed.
 * @property {object} 1 The full API response.
 */
export type TestIamPermissionsResponse = [object[], object];

/**
 * @callback TestIamPermissionsCallback
 * @param {?Error} err Request error, if any.
 * @param {object[]} permissions A subset of permissions that the caller is allowed.
 * @param {object} apiResponse The full API response.
 */
export interface TestIamPermissionsCallback {
  (err?: Error|null, permissions?: {[key: string]: boolean}|null, apiResponse?: object): void;
}

/**
 * @see https://cloud.google.com/pubsub/docs/reference/rest/v1/Policy#Expr
 */
export interface Expr {
  expression: string;
  title: string;
  description: string;
  location: string;
}

/**
 * @see https://cloud.google.com/pubsub/docs/reference/rest/v1/Policy#Binding
 */
export interface Binding {
  role: string;
  members: string[];
  condition?: Expr;
}

/**
 * @see https://cloud.google.com/pubsub/docs/reference/rest/v1/Policy
 */
export interface Policy {
  /**
   * @deprecated
   */
  version?: number;
  etag?: string;
  bindings: Binding[];
}

/**
 * [IAM (Identity and Access Management)](https://cloud.google.com/pubsub/access_control)
 * allows you to set permissions on invidual resources and offers a wider range
 * of roles: editor, owner, publisher, subscriber, and viewer. This gives you
 * greater flexibility and allows you to set more fine-grained access control.
 *
 * For example:
 *   * Grant access on a per-topic or per-subscription basis, rather than for
 *     the whole Cloud project.
 *   * Grant access with limited capabilities, such as to only publish messages
 *     to a topic, or to only to consume messages from a subscription, but not
 *     to delete the topic or subscription.
 *
 *
 * *The IAM access control features described in this document are Beta,
 * including the API methods to get and set IAM policies, and to test IAM
 * permissions. Cloud Pub/Sub's use of IAM features is not covered by any
 * SLA or deprecation policy, and may be subject to backward-incompatible
 * changes.*
 *
 * @constructor Iam
 * @mixin
 * @param {PubSub} pubsub PubSub Object.
 * @param {string} id The name of the topic or subscription.
 *
 * @see [Access Control Overview]{@link https://cloud.google.com/pubsub/access_control}
 * @see [What is Cloud IAM?]{@link https://cloud.google.com/iam/}
 *
 * @example
 * const {PubSub} = require('@google-cloud/pubsub');
 * const pubsub = new PubSub();
 *
 * const topic = pubsub.topic('my-topic');
 * // topic.iam
 *
 * const subscription = pubsub.subscription('my-subscription');
 * // subscription.iam
 */
export class IAM {
  Promise?: PromiseConstructor;
  pubsub: PubSub;
  request: typeof PubSub.prototype.request;
  id: string;

  constructor(pubsub: PubSub, id: string) {
    if (pubsub.Promise) {
      this.Promise = pubsub.Promise;
    }
    this.pubsub = pubsub;
    this.request = pubsub.request.bind(pubsub);
    this.id = id;
  }

  /**
   * Get the IAM policy
   *
   * @param {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/CallSettings.html.
   * @param {GetPolicyCallback} [callback] Callback function.
   * @returns {Promise<GetPolicyResponse>}
   *
   * @see [Topics: getIamPolicy API Documentation]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.topics/getIamPolicy}
   * @see [Subscriptions: getIamPolicy API Documentation]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.subscriptions/getIamPolicy}
   *
   * @example
   * const {PubSub} = require('@google-cloud/pubsub');
   * const pubsub = new PubSub();
   *
   * const topic = pubsub.topic('my-topic');
   * const subscription = topic.subscription('my-subscription');
   *
   * topic.iam.getPolicy(function(err, policy, apiResponse) {});
   *
   * subscription.iam.getPolicy(function(err, policy, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * topic.iam.getPolicy().then(function(data) {
   *   const policy = data[0];
   *   const apiResponse = data[1];
   * });
   */
  getPolicy(gaxOpts?: CallOptions): Promise<GetPolicyCallback>;
  getPolicy(callback: GetPolicyCallback): void;
  getPolicy(gaxOpts: CallOptions, callback: GetPolicyCallback): void;
  getPolicy(gaxOptsOrCallback?: CallOptions|GetPolicyCallback, callback?: GetPolicyCallback): Promise<GetPolicyCallback>|void {
    let gaxOpts = typeof gaxOptsOrCallback === 'object' ? gaxOptsOrCallback : {};
    callback = typeof gaxOptsOrCallback === 'function' ? gaxOptsOrCallback : callback;

    const reqOpts = {
      resource: this.id,
    };

    this.request<Policy>(
      {
        client: 'SubscriberClient',
        method: 'getIamPolicy',
        reqOpts: reqOpts,
        gaxOpts: gaxOpts,
      },
      callback!
    );
  }

  /**
   * Set the IAM policy
   *
   * @throws {Error} If no policy is provided.
   *
   * @param {object} policy The [policy](https://cloud.google.com/pubsub/docs/reference/rest/Shared.Types/Policy).
   * @param {array} [policy.bindings] Bindings associate members with roles.
   * @param {Array<object>} [policy.rules] Rules to be applied to the policy.
   * @param {string} [policy.etag] Etags are used to perform a read-modify-write.
   * @param {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/CallSettings.html.
   * @param {SetPolicyCallback} callback Callback function.
   * @returns {Promise<SetPolicyResponse>}
   *
   * @see [Topics: setIamPolicy API Documentation]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.topics/setIamPolicy}
   * @see [Subscriptions: setIamPolicy API Documentation]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.subscriptions/setIamPolicy}
   * @see [Policy]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/Policy}
   *
   * @example
   * const {PubSub} = require('@google-cloud/pubsub');
   * const pubsub = new PubSub();
   *
   * const topic = pubsub.topic('my-topic');
   * const subscription = topic.subscription('my-subscription');
   *
   * const myPolicy = {
   *   bindings: [
   *     {
   *       role: 'roles/pubsub.subscriber',
   *       members: ['serviceAccount:myotherproject@appspot.gserviceaccount.com']
   *     }
   *   ]
   * };
   *
   * topic.iam.setPolicy(myPolicy, function(err, policy, apiResponse) {});
   *
   * subscription.iam.setPolicy(myPolicy, function(err, policy, apiResponse) {});
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * topic.iam.setPolicy(myPolicy).then(function(data) {
   *   const policy = data[0];
   *   const apiResponse = data[1];
   * });
   */
  setPolicy(policy: Policy, gaxOpts?: CallOptions): Promise<SetPolicyResponse>;
  setPolicy(policy: Policy, gaxOpts: CallOptions, callback: SetPolicyCallback): void;
  setPolicy(policy: Policy, callback: SetPolicyCallback): void;
  setPolicy(policy: Policy, gaxOptsOrCallback?: CallOptions|SetPolicyCallback, callback?: SetPolicyCallback): Promise<SetPolicyResponse>|void {
    if (!(typeof policy === 'object')) {
      throw new Error('A policy object is required.');
    }

    let gaxOpts = typeof gaxOptsOrCallback === 'object' ? gaxOptsOrCallback : {};
    callback = typeof gaxOptsOrCallback === 'function' ? gaxOptsOrCallback : callback;

    const reqOpts = {
      resource: this.id,
      policy,
    };

    this.request(
      {
        client: 'SubscriberClient',
        method: 'setIamPolicy',
        reqOpts: reqOpts,
        gaxOpts: gaxOpts,
      },
      callback!
    );
  }

  /**
   * Test a set of permissions for a resource.
   *
   * Permissions with wildcards such as `*` or `storage.*` are not allowed.
   *
   * @throws {Error} If permissions are not provided.
   *
   * @param {string|string[]} permissions The permission(s) to test for.
   * @param {object} [gaxOptions] Request configuration options, outlined
   *     here: https://googleapis.github.io/gax-nodejs/CallSettings.html.
   * @param {TestIamPermissionsCallback} [callback] Callback function.
   * @returns {Promise<TestIamPermissionsResponse>}
   *
   * @see [Topics: testIamPermissions API Documentation]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.topics/testIamPermissions}
   * @see [Subscriptions: testIamPermissions API Documentation]{@link https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.subscriptions/testIamPermissions}
   * @see [Permissions Reference]{@link https://cloud.google.com/pubsub/access_control#permissions}
   *
   * @example
   * const {PubSub} = require('@google-cloud/pubsub');
   * const pubsub = new PubSub();
   *
   * const topic = pubsub.topic('my-topic');
   * const subscription = topic.subscription('my-subscription');
   *
   * //-
   * // Test a single permission.
   * //-
   * const test = 'pubsub.topics.update';
   *
   * topic.iam.testPermissions(test, function(err, permissions, apiResponse) {
   *   console.log(permissions);
   *   // {
   *   //   "pubsub.topics.update": true
   *   // }
   * });
   *
   * //-
   * // Test several permissions at once.
   * //-
   * const tests = [
   *   'pubsub.subscriptions.consume',
   *   'pubsub.subscriptions.update'
   * ];
   *
   * subscription.iam.testPermissions(tests, function(err, permissions) {
   *   console.log(permissions);
   *   // {
   *   //   "pubsub.subscriptions.consume": true,
   *   //   "pubsub.subscriptions.update": false
   *   // }
   * });
   *
   * //-
   * // If the callback is omitted, we'll return a Promise.
   * //-
   * topic.iam.testPermissions(test).then(function(data) {
   *   const permissions = data[0];
   *   const apiResponse = data[1];
   * });
   */
  testPermissions(permissions: string|string[], gaxOpts?: CallOptions): Promise<TestIamPermissionsResponse>;
  testPermissions(permissions: string|string[], gaxOpts: CallOptions, callback: TestIamPermissionsCallback): void;
  testPermissions(permissions: string|string[], callback: TestIamPermissionsCallback): void;
  testPermissions(permissions: string|string[], gaxOptsOrCallback?: CallOptions|TestIamPermissionsCallback, callback?: TestIamPermissionsCallback): Promise<TestIamPermissionsResponse>|void {
    if (!Array.isArray(permissions) && !(typeof permissions === 'string')) {
      throw new Error('Permissions are required.');
    }

    let gaxOpts = typeof gaxOptsOrCallback === 'object' ? gaxOptsOrCallback : {};
    callback = typeof gaxOptsOrCallback === 'function' ? gaxOptsOrCallback : callback;

    const reqOpts = {
      resource: this.id,
      permissions: arrify(permissions),
    };

    this.request<PermissionsResponse>(
      {
        client: 'SubscriberClient',
        method: 'testIamPermissions',
        reqOpts: reqOpts,
        gaxOpts: gaxOpts,
      },
      function(err, resp) {
        if (err) {
          callback!(err, null, resp!);
          return;
        }

        const availablePermissions = arrify(resp!.permissions);
        const permissionHash = (permissions as string[]).reduce(function(acc, permission) {
          acc[permission] = availablePermissions.indexOf(permission) > -1;
          return acc;
        }, {} as {[key: string]: boolean});
        callback!(null, permissionHash, resp!);
      }
    );
  }
}

export interface PermissionsResponse {
  permissions: string|string[];
}

/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisifyAll(IAM);
