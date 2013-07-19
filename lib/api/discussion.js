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
 * Load a discussion profile
 *
 * @param  {Session}     session    A Tsung session.
 * @param  {String}      contentId  A variable that represents a content item.
 * @return {Object}                 An object containing field `nextStart` which determines what value can be used for the `start` parameter in future profileScroll invocations
 */
var profile = module.exports.profile = function(session, discussionId) {
    return ApiUtil.profile('discussion', session, discussionId);
};

/**
 * Scroll down in a discussion profile to view more messages.
 *
 * @param  {Session}    session         A Tsung session.
 * @param  {String}     discussionId    The id of the discussion to scroll
 * @param  {String}     start           From where to start the page of discussions
 * @return {Object}                     An object containing field `nextStart` which determines what value can be used for the `start` parameter in future profileScroll invocations
 */
var profileScroll = module.exports.profileScroll = function(session, discussionId, start) {
	return ApiUtil.messagesScroll('discussion', session, discussionId, start);
};

/**
 * Open the manage access pane of a discussion
 *
 * @param  {Session}    session         The Tsung session
 * @param  {String}     discussionId    The id of the discussion whose manage access page to open
 * @return {Object}                     An object containing field `nextStart` which determines what value can be used for the `start` parameter in future membersScroll requests
 */
var manageAccess = module.exports.manageAccess = function(session, discussionId) {
    return ApiUtil.manageAccess('discussion', session, discussionId);
};

/**
 * Scroll members downward on the bottom of the discussion members (or manage access) page.
 *
 * @param  {Session}    session         A Tsung session
 * @param  {String}     discussionId    The id of the discussion whose members we're scrolling
 * @param  {String}     start           The starting member from which to scroll
 * @return {Object}                     An object containing field `nextStart` which determines what value can be used for the `start` parameter in future membersScroll requests
 */
var membersScroll = module.exports.membersScroll = function(session, discussionId, start) {
    return ApiUtil.membersScroll('discussion', session, discussionId, start);
};

/**
 * Perform the "update" command in the manage access pane for a discussion
 *
 * @param  {Session}    session         The Tsung session
 * @param  {String}     resourceId      The id of the discussion whose access to update
 * @param  {String}     [visibility]    The new visibility of the discussion. Default: visibility will not be updated
 * @param  {Object}     [members]       The changes to apply to the members. The key is the memberId and the value is assigned role, or `false` to remove them. Default: Members will not be updated
 */
var manageAccessUpdate = module.exports.manageAccessUpdate = function(session, discussionId, visibility, members) {
    return ApiUtil.manageAccessUpdate('discussion', session, groupId, visibility, members);
};

/**
 * Share a discussion with someone.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     contentId   The id of the content item to share
 * @param  {String[]}   shareWith   The ids of the members with which to share the content item
 */
var share = module.exports.share = function(session, contentId, shareWith) {
    return ApiUtil.share('content', session, contentId, shareWith);
};

/**
 * Post a message to a discussion
 *
 * @param  {Session}    session         A Tsung session
 * @param  {String}     discussionId    The id of the discussion to post to
 * @param  {String}     body            The body of the post
 * @param  {String}     [replyTo]       The created timestamp of the message to reply to
 * @return {Object}                     An object containing the parameter `created` which contains the created timestamp of the message
 */
var post = module.exports.post = function(session, discussionId, body, replyTo) {
    return ApiUtil.messagesPost('discussion', session, discussionId, body, replyTo);
};

/**
 * Update a discussion
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     contentId   The id of the discussion to update
 * @param  {Object}     fields      An object, keyed by the field name, whose value is the new field value, holding all the discussion fields to update
 */
var detailsUpdate = module.exports.detailsUpdate = function(session, discussionId, fields) {
    return ApiUtil.detailsUpdate('discussion', session, discussionId, fields);
};

/**
 * Start a discussion
 *
 * @param  {Session}    session         The Tsung session
 * @param  {String}     displayName     The displayName or Title of the discussion
 * @param  {String}     description     The description or Topic of the discussion
 * @param  {String}     visibility      The visibility of the discussion
 * @param  {String[]}   [members]       The members of the discussion
 * @return {Object}                     An object with field `id` whose value is the generated id of the discussion that was just created
 */
var create = module.exports.create = function(session, displayName, description, visibility, members) {
    var tx = session.addTransaction('discussion_create');
    var data = {
        'displayName': displayName,
        'description': description,
        'visibility': visibility
    };

    if (members) {
        data.members = members;
    }

    var request = tx.addRequest('POST', '/api/discussion/create', data);
    request.addDynamicVariable('discussion_create_id', 'json', '$.id');
    return {'id': '%%_discussion_create_id%%'};
};
