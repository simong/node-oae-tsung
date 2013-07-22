/*
 * Copyright 2013 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var _ = require('underscore');

var ApiUtil = require('../lib/api/util');
var Container = require('../lib/api/container');
var Content = require('../lib/api/content');
var Group = require('../lib/api/group');
var Discussion = require('../lib/api/discussion');
var Search = require('../lib/api/search');
var User = require('../lib/api/user');

var ActivityMacros = require('./macros/activity');
var LoginMacros = require('./macros/login');

/**
 * A test that creates a group for purposes of peer collaboration and then populates it with stuff.
 */
module.exports.test = function(runner, probability) {
	probability = probability || 100;
    var session = runner.addSession('activity_browse', probability);

    // 1. Visit the landing page then log in. I'm redirected to my activity feed. I then browse the feed a little bit and notifications.

    // Log in
	var currentUser = LoginMacros.visitLogin(session, '%%_private_groups_user_username%%', '%%_private_groups_user_password%%');

	// Loads user activity just once, then loads notifications, then scrolls them once
	ActivityMacros.browse(session, true, 1);

	// Someone had commented on this user's content item. Go read a bit, but we won't reply
	ActivityMacros.checkContentComment(session, '%%_public_content_1%%');

	// Open notifications again and visit a group that the user was recently added to
	Container.notifications(session);
	session.think(7, true);

	Container.notificationsScroll(session);
	session.think(3, true);

	// View the group and have a look at the activity, libraries and members
	ActivityMacros.checkGroupAddMember(session, '%%_private_groups_access_depth0_0%%', 5, 2, 2, 2);

	// Go back to my activities and browse
	ActivityMacros.browse(session, true, 3);

	// There was a comment on a content item that is associated to a group I'm in. Go read it.
	ActivityMacros.checkContentComment(session, '%%_public_content_4%%', '%%_random_string_medium%%', 2);

	// Read a few more comments
	session.think(15, true);
	Content.profileScroll(session, '%%_public_content_4%%');
	session.think(15, true);

	Content.profileScroll(session, '%%_public_content_4%%');
	session.think(15, true);

	// Open up notifications, view a content item that was shared with me
	Container.notifications(session);
	session.think(5, true);

	// View content for about 15 seconds then go have a look at some comments
	Content.profile(session, '%%_public_content_7%%');
	session.think(15, true);

	// Read the first few comments then read the content item some more
	Content.profileScroll(session, '%%_public_content_7%%');
	session.think(90, true);

	// Go back to my activity page
	ActivityMacros.browse(session, true, 4, 0);

	// Content item shared with me
	ActivityMacros.checkSharedContent(session, '%%_public_content_5%%');

	// Back to my activity page
	Container.home(session);
	session.think(7, true);

	// Click on a discussion that was commented on. We will read through quite a bit of it and make a post
	Discussion.profile(session, '%%_public_discussions_2%%');
	session.think(30, true);

	Discussion.profileScroll(session, '%%_public_discussions_2%%');
	session.think(20, true);

	Discussion.profileScroll(session, '%%_public_discussions_2%%');
	session.think(5, true);

	Discussion.profileScroll(session, '%%_public_discussions_2%%');
	session.think(20, true);

	// Scroll one more page and read
	Discussion.profileScroll(session, '%%_public_discussions_2%%');
	session.think(10, true);

	// Start writing a message and post
	session.think(45, true);
	Discussion.post(session, '%%_public_discussions_2%%');

	// Go back to the top and read it over with a couple other messages again
	session.think(30, true);

	// Logout
	Container.logout(session);

};