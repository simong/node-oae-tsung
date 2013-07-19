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

var _ = require('underscore');

var Content = require('../../lib/api/content');
var Group = require('../../lib/api/group');
var Discussion = require('../../lib/api/discussion');
var User = require('../../lib/api/user');

/**
 * A content item was shared with a user, and this method will simulate the user visiting that content
 * item to see what it is about.
 *
 * @param  {Session}    session         The Tsung user session
 * @param  {String}     contentId       The id of the content item to browse
 * @param  {String[]}   [commentBodies] The bodies of comments to post. For each entry in this array, the user will post a comment
 */
var checkSharedContent = module.exports.checkSharedContent = function(session, contentId, commentBodies) {
    commentBodies = commentBodies || [];

    // Visits the content profile and reads for a bit
    Content.profile(session, contentId);
    session.think(45, true);

    // User reads 2 pages of comments
    Content.profileScroll(session, contentId);
    session.think(30, true);

    Content.profileScroll(session, contentId);
    session.think(30, true);

    _.each(commentBodies, function(body) {
        // Pause to think and write the comment before posting
        session.think(_getCommentThinkTime(body));
        Content.postComment(session, contentId, body);

        // Scroll once after the comment
        session.think(4, true);
        Content.profileScroll(session, contentId);
    });
};

/**
 * A content item was commented on such that the user received an activity. This method will simulate the user
 * finding the comment that was posted, and replying if specified.
 *
 * @param  {Session}    session             The Tsung user session
 * @param  {String}     contentId           The id of the content item that was commented on
 * @param  {String}     [readBody]          The body of the comment that the user should go read. If not specified, a thinktime of a reasonable average will be used to read the comment
 * @param  {Number}     [commentPageNum]    The page of the content comments to which the user must browse to find the comment. Default: 1
 * @param  {String}     [replyBody]         The body of the reply to write. If not specified, no reply will be made
 */
var checkContentComment = module.exports.checkContentComment = function(session, contentId, readBody, commentPageNum, replyBody) {
    reply = (reply === true) || false;
    commentPageNum = commentPageNum || 1;

    // User loads the content profile and immediately jumps to the comments
    Content.profile(session, contentId);
    session.think(2);

    for (var i = 1; i < commentPageNum; i++) {
        // Take some time to realize the page of comments you're looking at doesn't contain the one you're looking for, then
        // continue to scroll
        session.think(2);
        Content.profileScroll(session, contentId);
    }

    // You found the comment, read it
    session.think(_getReadTime(readBody));

    // Now type a reply if specified
    if (replyBody) {
        session.think(_getMessageTypeTime(replyBody));
        Content.postComment(session, contentId, replyBody);
    }
};

/**
 * A discussion was shared with someone, and this method simulates the user visiting the discussion and seeing what it is all about.
 *
 * @param  {Session}    session             The Tsung user session
 * @param  {String}     discussionId        The id of the discussion that was shared
 * @param  {Number}     [numPagesToRead]    The number of pages to read. Default: 1
 * @param  {String[]}   [messageBodies]     An array of messages to post to the discussion while checking it out. For each message posted
 */
var checkSharedDiscussion = module.exports.checkSharedDiscussion = function(session, discussionId, numPagesToRead, messageBodies) {
    numPagesToRead = numPagesToRead || 1;
    messageBodies = messageBodies || [];

    // Load the discussion profile and read the description
    Discussion.profile(session, discussionId);
    session.think(17);

    // Read the first page of messages
    session.think(30, true);

    for (var i = 1; i < numPagesToRead; i++) {
        // Load the next page and read
        Discussion.profileScroll(session, discussionId);
        session.think(30, true);
    }

    // Write the specified messages into the discussion
    _.each(messageBodies, function(body) {
        session.think(_getMessageTypeTime(body));
        Discussion.post(session, discussionId, body);
    });
};

/**
 * A discussion has received a message such that the user received an activity. This simulates the user visiting the discussion to find
 * the message that was posted, and replying if specified.
 *
 * @param  {Session}    session             The Tsung user session
 * @param  {String}     discussionId        The id of the discussion that was commented on
 * @param  {String}     [readBody]          The body of the message that the user should go read. If not specified, a thinktime of a reasonable average will be used to read the message
 * @param  {Number}     [messagePageNum]    The page of the discussion messages to which the user must browse to find the message Default: 1
 * @param  {String}     [replyBody]         The body of the reply to write. If not specified, no reply will be made
 */
var checkDiscussionMessage = module.exports.checkDiscussionMessage = function(session, discussionId, readBody, messagePageNum, replyBody) {
    reply = (reply === true) || false;
    messagePageNum = messagePageNum || 1;

    // User loads the discussion and immediately jumps to the messages
    Discussion.profile(session, discussionId);
    session.think(2);

    for (var i = 1; i < messagePageNum; i++) {
        // Take some time to realize the page of messages you're looking at doesn't contain the one you're looking for,
        // then continue to scroll
        session.think(2);
        Discussion.profileScroll(session, discussionId);
    }

    // You found the message, read it
    session.think(_getReadTime(readBody));

    // Now type a reply if specified
    if (replyBody) {
        session.think(_getMessageTypeTime(replyBody));
        Discussion.post(session, discussionId, replyBody);
    }
};

/**
 * A user has been added to a group, so they are going to visit the group and see what it is all about.
 *
 * @param  {Session}    session                 The Tsung user session
 * @param  {String}     groupId                 The id of the group to check. The id of this group *must* be the id of a group in which the user in session is a member (or manager)
 * @param  {Number}     [activityPages]         The number of pages of activities to browse on the group profile (Default: 1)
 * @param  {Number}     [libraryPages]          The number of pages of library to browse on the group profile (Default: 0)
 * @param  {Number}     [membersPages]          The number of pages of members to browse on the group profile (Default: 0)
 */
var checkGroupAddMember = module.exports.checkGroupAddMember = function(session, groupId, activityPages, libraryPages, membersPages) {
    activityPages = activityPages || 1;
    libraryPages = librarypages || 0;
    membersPages = membersPages || 0;

    var i = 0;

    // Load the group profile and activity feed, reading the activities
    Group.activity(session, groupId, {'pageLoad': true});
    session.think(7, true);

    for (i = 1; i < activityPages; i++) {
        Group.activityScroll(session, groupId);
        session.think(7, true);
    }

    // Browse the library pages if specified
    if (libraryPages) {
        Group.library(session, groupId);
        session.think(7, true);

        for (i = 1; i < libraryPages; i++) {
            Group.libraryScroll(session, groupId);
            session.think(7, true);
        }
    }

    if (membersPages) {
        Group.members(session, groupId);
        session.think(7, true);

        for (i = 1; i < libraryPages; i++) {
            Group.membersScroll(session, groupId);
            session.think(7, true);
        }
    }
};

/**
 * Determines how many seconds a user should spend thinking/typing when typing a comment with the given
 * comment body.
 *
 * @param  {String}     body    The body of the comment. May be a known variable or actual text body
 * @return {Number}             The thinktime in seconds that the user should pause before posting the comment
 * @api private
 */
var _getMessageTypeTime = function(body) {

    // "Average" length of a comment?
    var length = 80;

    if (body && body.indexOf('%%_') === 0) {
        if (body === '%%_random_string_short%%') {
            length = 13;
        } else if (body === '%%_random_string_medium%%') {
            length = 60;
        } else if (body === '%%_random_string_long%%') {
            length = 500;
        }
    } else if (body) {
        length = body.length;
    }

    // Every 2 characters = 1s for think+type ?
    session.think(Math.round(length / 2));
};


/**
 * Determines how many seconds a user should spend reading some text body
 *
 * @param  {String}     body    The body of the text. May be a known variable or actual text body.
 * @return {Number}             The thinktime in seconds that the user should pause to give time to read
 * @api private
 */
var _getReadTime = function(body) {

    // "Average" length of a comment?
    var length = 80;

    if (body && body.indexOf('%%_') === 0) {
        if (body === '%%_random_string_short%%') {
            length = 13;
        } else if (body === '%%_random_string_medium%%') {
            length = 60;
        } else if (body === '%%_random_string_long%%') {
            length = 500;
        }
    } else if (body) {
        length = body.length;
    }

    // Every 8 characters = 1s for read ?
    session.think(Math.round(length / 8));
};

