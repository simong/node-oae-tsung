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
 * Load a content page.
 *
 * @param  {Session}     session    A Tsung session.
 * @param  {String}      contentId  A variable that represents a content item.
 */
var profile = module.exports.profile = function(session, contentId) {
    ApiUtil.profile('content', session, contentId);
};

/**
 * Scroll comments downward on the bottom of the content page.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     contentId   The id of the conten item whose comments we're scrolling
 */
var profileScroll = module.exports.profileScroll = function(session, contentId) {
    ApiUtil.messagesScroll('content', session, contentId);
};

/**
 * Open the manage access pane of a content item
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     contentId   The id of the content item whose manage access page to open
 */
var manageAccess = module.exports.manageAccess = function(session, contentId) {
    ApiUtil.manageAccess('content', session, contentId);
};

/**
 * Scroll members downward on the bottom of the content members (or manage access) page.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     contentId   The id of the content item whose members we're scrolling
 */
var membersScroll = module.exports.membersScroll = function(session, contentId) {
    ApiUtil.membersScroll('content', session, contentId);
};

/**
 * Perform the "update" command in the manage access pane for a content
 *
 * @param  {Session}    session         The Tsung session
 * @param  {String}     contentId       The id of the content whose access to update
 * @param  {String}     [visibility]    The new visibility of the content. Default: visibility will not be updated
 * @param  {Object}     [members]       The changes to apply to the members. The key is the memberId and the value is assigned role, or `false` to remove them. Default: Members will not be updated
 */
var manageAccessUpdate = module.exports.manageAccessUpdate = function(session, contentId, visibility, members) {
    ApiUtil.manageAccessUpdate('content', session, contentId, visibility, members);
};

/**
 * Share a content item with someone.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     contentId   The id of the content item to share
 * @param  {String[]}   shareWith   The ids of the members with which to share the content item
 */
var share = module.exports.share = function(session, contentId, shareWith) {
    ApiUtil.share('content', session, contentId, shareWith);
};

/**
 * Posts a comment on a content item
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     contentId   The id of the content item on which to post a comment
 * @param  {String}     [body]      The body of the comment. Defaults to a random long string
 * @param  {String}     [replyTo]   The id ('created' timestamp) of the comment to reply to
 * @return {Object}                 An object with field `created` specifying the created timestamp of the comment
 */
var comment = module.exports.comment = function(session, contentId, body, replyTo) {
    return ApiUtil.messagesPost('content', session, contentId, body, replyTo);
};

/**
 * Update a content item.
 *
 * @param  {Session}    session     A session
 * @param  {String}     contentId   The id of the content item to update
 * @param  {Object}     fields      An object, keyed by the field name, whose value is the new field value, holding all the content profile fields to update
 */
var detailsUpdate = module.exports.detailsUpdate = function(session, contentId, fields) {
    ApiUtil.detailsUpdate('content', session, contentId, fields);
};

/**
 * Create a link in the system
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     displayName The displayName of the link
 * @param  {String}     visibility  The visibility of the link
 * @param  {String}     link        The target of the link
 * @param  {String[]}   [viewers]   Users with which to share the link on creation
 * @param  {String[]}   [managers]  Users that are managers of the link on creation
 * @return {Object}                 An object with field `id` that specifies the id of the created link
 */
var createLink = module.exports.createLink = function(session, displayName, visibility, link, viewers, managers) {
    var tx = session.addTransaction('content_create_link');
    var data = {
        'resourceSubType': 'link',
        'displayName': displayName,
        'visibility': visibility,
        'link': link
    };

    if (viewers) {
        data.viewers = viewers;
    }

    if (managers) {
        data.managers = managers;
    }

    // Create a link
    var req = tx.addRequest('POST', '/api/content/create', data);
    req.addDynamicVariable('content_create_link_id', 'json', '$.id');

    return {'id': '%%_content_create_link_id%%'};
};

/**
 * Create a document in the system
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     displayName The displayName of the link
 * @param  {String}     visibility  The visibility of the link
 * @param  {String}     link        The target of the link
 * @param  {String[]}   [viewers]   User with which to share the link on creation
 * @param  {String[]}   [managers]  Users that are managers of the link on creation
 * @return {Object}                 An object with field `id` that specifies the id of the created link
 */
var createDocument = module.exports.createDocument = function(session, displayName, visibility, viewers, managers) {
    var tx = session.addTransaction('content_create_document');
    var data = {
        'resourceSubType': 'collabdoc',
        'displayName': displayName,
        'visibility': visibility
    };

    if (viewers) {
        data.viewers = viewers;
    }

    if (managers) {
        data.managers = managers;
    }

    // Create a link
    var req = tx.addRequest('POST', '/api/content/create', data);
    req.addDynamicVariable('content_create_document_id', 'json', '$.id');
    return {'id': '%%_content_create_document_id%%'};
};

/**
 * Invoked a "publish" command for a document.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     contentId   The id of the document to publish
 */
var publishDocument = module.exports.publishDocument = function(session, contentId) {
    var tx = session.addTransaction('content_publish_document');
    tx.addRequest('POST', '/api/content/' + contentId + '/publish');
};

/**
 * Create a file and upload a file body
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     fileId      The id of the file that should be uploaded. This needs to be added in the `config/data.json` file as an uploadableFile and referenced by key.
 * @return {Object}                 An object with field `id` that specifies the id of the created file
 */
var createFile = module.exports.createFile = function(session, fileId) {
    var tx = session.addTransaction('content_create_file');
    var req = tx.addRequest('POST', '/api/content/create', fileId);
    req.addDynamicVariable('content_create_file_id', 'json', '$.id');
    return {'id': '%%_content_create_file_id%%'};
};
