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
 * The splash page of a group was loaded. This is basically a page that just gives a user the opportunity to join.
 *
 * @param  {Session}    session         A Tsung session
 * @param  {String}     groupId         The id of the group whose splash page to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not this page was shown with a page load. Default: `false`
 */
var splash = module.exports.splash = function(session, groupId, opts) {
    var tx = session.addTransaction('group_splash');
    ApiUtil.addResourcePageLoadRequests('group', tx, groupId);
};

/**
 * Load the group activity dashboard
 *
 * @param  {Session}    session         A Tsung session.
 * @param  {String}     groupId         The id of the group whose activities to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not this transaction is also a page load. Default: `false`
 */
var activity = module.exports.activity = function(session, groupId, opts) {
    ApiUtil.activity('group', session, groupId, opts);
};

/**
 * Scroll activities downward on the bottom of the group activity page.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     groupId     The id of the group whose activities we're scrolling
 */
var activityScroll = module.exports.activityScroll = function(session, groupId) {
    ApiUtil.activityScroll('group', session, groupId);
};

/**
 * Load the group members page
 *
 * @param  {Session}    session         A Tsung session
 * @param  {String}     groupId         A variable that contains the group ID.
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not this transaction is also a page load. Default: `false`
 */
var members = module.exports.members = function(session, groupId, opts) {
    opts = opts || {};
    var txId = 'group_members';
    if (opts.pageLoad) {
        txId += '_load';
    }

    var tx = session.addTransaction(txId);
    if (opts.pageLoad) {
        tx.addWebsocketMessage('{"name":"register-for-feed","args":{"feed": "oae.notifications", "resourceId": "' + groupId + '", "signature": {"signature": "", "exipires": ""}}}');
        ApiUtil.addResourcePageLoadRequests('group', tx, groupId);
    }

    ApiUtil.addResourceMembersRequests('group', tx, groupId, null);
};

/**
 * Scroll members downward on the bottom of the group members (or manage access) page.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     groupId     The id of the group whose members we're scrolling
 */
var membersScroll = module.exports.membersScroll = function(session, groupId) {
    ApiUtil.membersScroll('group', session, groupId);
};

/**
 * Open the manage access pane of a group
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     groupId     the id of the group whose manage access page to open
 */
var manageAccess = module.exports.manageAccess = function(session, groupId) {
    ApiUtil.manageAccess('group', session, groupId);
};

/**
 * Perform the "update" command in the manage access pane for a group
 *
 * @param  {Session}    session         The Tsung session
 * @param  {String}     groupId         The id of the group whose access to update
 * @param  {String}     [visibility]    The new visibility of the group. Default: visibility will not be updated
 * @param  {Object}     [members]       The changes to apply to the members. The key is the memberId and the value is assigned role, or `false` to remove them. Default: Members will not be updated
 */
var manageAccessUpdate = module.exports.manageAccessUpdate = function(session, groupId, visibility, members) {
    return ApiUtil.manageAccessUpdate('group', session, groupId, visibility, members);
};

/**
 * Load the content library page of a group
 *
 * @param  {Session}    session         A Tsung session
 * @param  {String}     groupId         The id of the group whose content library to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not the transaction was a fresh page load
 */
var contentLibrary = module.exports.contentLibrary = function(session, groupId, opts) {
    ApiUtil.library('group', 'content', session, groupId, opts);
};

/**
 * Scroll content library items downward on the bottom of the group content library page.
 *
 * @param  {Session}    session     A Tsung user session
 * @param  {String}     groupId     The id of the group whose content library to scroll
 */
var contentLibraryScroll = module.exports.contentLibraryScroll = function(session, groupId) {
    ApiUtil.libraryScroll('group', 'content', session, groupId);
};

/**
 * Search the content library of the group
 *
 * @param  {Session}    session     The Tsung user session
 * @param  {String}     groupId     The id of the group whose library to search
 * @param  {String}     [q]         The search query. Default: *
 * @return {Object}                 An object with field `scroll` which is a function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var contentLibrarySearch = module.exports.contentLibrarySearch = function(session, groupId, q) {
    ApiUtil.librarySearch('group', 'content', session, groupId, q);
};

/**
 * Load the discussion library page of a group
 *
 * @param  {Session}    session         A session
 * @param  {String}     groupId         The id of the group whose discussion library to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not the transaction was a fresh page load
 */
var discussionLibrary = module.exports.discussionLibrary = function(session, groupId, opts) {
    ApiUtil.library('group', 'discussion', session, groupId, opts);
};

/**
 * Scroll discussion library items downward on the bottom of the group discussion library page.
 *
 * @param  {Session}    session     A Tsung user session
 * @param  {String}     groupId     The id of the group whose discussion library to scroll
 */
var discussionLibraryScroll = module.exports.discussionLibraryScroll = function(session, groupId) {
    ApiUtil.libraryScroll('group', 'discussion', session, groupId);
};

/**
 * Search the discussion library of the group
 *
 * @param  {Session}    session     The Tsung user session
 * @param  {String}     groupId     The id of the group whose library to search
 * @param  {String}     [q]         The search query. Default: *
 * @return {Object}                 An object with field `scroll` which is a function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var discussionLibrarySearch = module.exports.discussionLibrarySearch = function(session, groupId, q) {
    ApiUtil.librarySearch('group', 'discussion', session, groupId, q);
};

/**
 * Update the details of a group
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     groupId     The id of the group to update
 * @param  {Object}     fields      An object, keyed by the field name, whose value is the new field value, holding all the group profile fields to update
 */
var detailsUpdate = module.exports.detailsUpdate = function(session, groupId, fields) {
    return ApiUtil.detailsUpdate('group', session, groupId, fields);
};

/**
 * Create a group
 *
 * @param  {Session}    session         A session
 * @param  {String}     displayName     The group displayName to use
 * @param  {String}     visibility      The visibility for this group
 * @return {Object}                     An object with field `id` which holds the id of the group that was just created
 */
var create = module.exports.create = function(session, displayName, visibility) {
    var tx = session.addTransaction('group_create');
    var request = tx.addRequest('POST', '/api/group/create', {'displayName': displayName, 'visibility': visibility});
    request.addDynamicVariable('group_create_id', 'json', '$.id');
    return {'id': '%%_group_create_id%%'};
};

