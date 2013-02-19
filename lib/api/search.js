/*!
 * Copyright 2012 Sakai Foundation (SF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/**
 * Load the search page with a query.
 *
 * @param {Session} session A Tsung session.
 */
var load = module.exports.load = function(session, q) {
    var opts = q ? { q: q } : null;

    var tx = session.addTransaction('general_search_load');
    tx.addRequest('GET', '/api/me');
    tx.addRequest('GET', '/api/search/general/all', opts);
};

/**
 * Perform a general search.
 *
 * @param {Session} session         A Tsung session.
 * @param {String}  resourceType    The type of resource to search (content, user, group, all)
 * @param {Object}  opts            The search options
 * @param {String}  opts.q          The search term to search (default: *)
 * @param {Number}  opts.from       The item to start from (default: 0)
 * @param {Number}  opts.size       The number of items to load (default: 10)
 * @param {String}  opts.sort       The sort direction: asc or desc (default: asc)
 */
var searchGeneral = module.exports.searchGeneral = function(session, resourceType, opts) {
    opts = opts || {};

    var tx = session.addTransaction('general_search_search');
    tx.addRequest('GET', '/api/search/general/' + resourceType, opts);
};
