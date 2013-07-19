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

var ApiUtil = require('./util');

/**
 * Perform a general search on the general search page.
 *
 * @param  {Session}    session             A Tsung session.
 * @param  {String}     [q]                 The search term to search (default: *)
 * @param  {String}     [resourceTypes]     The types of resources to search (content, user, group, discussion, all). Default: all
 * @param  {Object}     [opts]              Optional parameters, these influence the behaviour of the test, they are not search options
 * @param  {Boolean}    [opts.pageLoad]     Whether or not the search should be invoked with a fresh page load. Default: `false`
 * @return {Object}                         An object with field `scroll` which is a function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var search = module.exports.search = function(session, q, resourceTypes, opts) {
    opts = opts || {};

    var txId = 'search_general';
    if (opts.pageLoad) {
        txId += '_load';
    }

    var tx = session.addTransaction(txId);
    if (opts.pageLoad) {
        ApiUtil.addSearchPageLoadRequests(tx);
    }

    var searchOpts = {};

    if (q) {
        searchOpts.q = q;
    }

    if (resourceTypes && resourceTypes.length > 0) {
        searchOpts.resourceTypes = resourceTypes;
    }

    return ApiUtil.addSearchRequests(session, tx, 'general', null, searchOpts);
};

