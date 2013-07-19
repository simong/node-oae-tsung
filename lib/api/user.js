/*
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
 * Load the user activity dashboard
 *
 * @param  {Session}    session         A Tsung session.
 * @param  {String}     userId         The id of the user whose activities to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not this transaction is also a page load. Default: `false`
 */
var activity = module.exports.activity = function(session, userId, opts) {
    ApiUtil.activity('user', session, userId, opts);
};

/**
 * Scroll activities downward on the bottom of the user activity page.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     userId      The id of the user whose activities we're scrolling
 */
var activityScroll = module.exports.activityScroll = function(session, userId) {
    ApiUtil.activityScroll('user', session, userId);
};

/**
 * Load the content library page of a user
 *
 * @param  {Session}    session         A session
 * @param  {String}     userId          The id of the user whose content library to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not the transaction was a fresh page load
 */
var contentLibrary = module.exports.contentLibrary = function(session, userId, opts) {
    ApiUtil.library('user', 'content', session, userId, opts);
};

/**
 * Scroll content library items downward on the bottom of the user content library page.
 *
 * @param  {Session}    session     A Tsung user session
 * @param  {String}     userId     The id of the user whose content library to scroll
 */
var contentLibraryScroll = module.exports.contentLibraryScroll = function(session, userId) {
    ApiUtil.libraryScroll('user', 'content', session, userId);
};

/**
 * Load the discussion library page of a user
 *
 * @param  {Session}    session         A session
 * @param  {String}     userId          The id of the user whose discussion library to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not the transaction was a fresh page load
 */
var discussionLibrary = module.exports.discussionLibrary = function(session, userId, opts) {
    ApiUtil.library('user', 'discussion', session, userId, opts);
};

/**
 * Scroll discussion library items downward on the bottom of the user discussion library page.
 *
 * @param  {Session}    session     A Tsung user session
 * @param  {String}     userId     The id of the user whose discussion library to scroll
 */
var discussionLibraryScroll = module.exports.discussionLibraryScroll = function(session, userId) {
    ApiUtil.libraryScroll('user', 'discussion', session, userId);
};

/**
 * Loads the memberships page for a user
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     userId      The id of the user whose memberships to fetch
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not the transaction was a fresh page load
 */
var memberships = module.exports.memberships = function(session, userId, opts) {
    opts = opts || {};
    var txId = 'user_memberships';
    if (opts.pageLoad) {
        txId += '_load';
    }

    var tx = session.addTransaction(txId);

    // First add the requests associated to loading the resource page
    if (opts.pageLoad) {
        ApiUtil.addResourcePageLoadRequests('user', tx, userId);
    }

    // Then add the memberships requests
    _membershipsRequest(tx, userId, null);
};

/**
 * Scrolls the memberships page for a user
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     userId      The id of the user whose memberships to scroll
 */
var membershipsScroll = module.exports.membershipsScroll = function(session, userId) {
    var tx = session.addTransaction('user_memberships_scroll');
    _membershipsRequest(tx, userId);
};

/**
 * Create a memberships request on the transaction
 *
 * @param  {Transaction}    tx          The transaction on which to create the request
 * @param  {String}         userId      The id of the user whose memberships to fetch
 * @param  {String}         [start]     The starting point of the page of memberships. If `null`, will start from beginning. If `undefined` will start from last known scroll point
 */
var _membershipsRequest = function(tx, userId, start) {
    var nextPageTokenVar = 'user_memberships_scroll_next_start';
    var opts = {'limit': 12};
    if (start) {
        opts.start = start;
    } else if (start === undefined) {
        start = '%%_' + nextPageTokenVar + '%%';
    }

    var membershipsRequest = tx.addRequest('GET', '/api/user/' + userId + '/memberships', opts);
    membershipsRequest.addDynamicVariable(nextPageTokenVar, 'json', '$.results[11].id');
};

