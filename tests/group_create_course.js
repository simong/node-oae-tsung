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
 * A test that creates a group for a course and populates it with stuff.
 */
module.exports.test = function(runner, probability) {
	probability = probability || 100;
    var session = runner.addSession('group_create_course', probability);

    // 1. Visit the landing page then log in. I'm redirected to my activity feed. I then browse the feed a little bit and notifications.

    // Log in
	var currentUser = LoginMacros.visitLogin(session, '%%_users_username%%', '%%_users_password%%');

	ActivityMacros.browse(session, true, 4, 2);

	// 2. Create a group for a course for which we'll have interaction in OAE
	session.think(15, true);
	var createdGroup = Group.create(session, 'Tsung Test group_create_collab %%_random_string_short%%', 'private');
 
	// Redirected directly to members
	Group.members(session, createdGroup.id);
	session.think(8, true);

	// 3. Add 2 TAs to the group as managers. They will moderate for me

	// Open the manage access pane
	Group.manageAccess(session, createdGroup.id);
	session.think(4, true);

	ApiUtil.searchMemberAutosuggest(session, 'steven');
	session.think(4, true);

	ApiUtil.searchMemberAutosuggest(session, 'clare');
	session.think(3, true);

	Group.manageAccessUpdate(session, createdGroup.id, null, {
		'%%_public_users_4%%': 'manager',
		'%%_public_users_5%%': 'manager'
	});
	session.think(4, true);

	// 4. I have several existing items I'd like to share with this group from my library. I'm going to add them
	Container.home(session);
	session.think(2, true);

	// Select 3 items from the first 2 pages of my library
	User.contentLibrary(session, currentUser.id);
	session.think(2, true);

	User.contentLibraryScroll(session, currentUser.id);
	session.think(6, true);

	// Sharing with multiple at a time is done in a burst like this
	Content.share(session, '%%_public_content_9%%', [createdGroup.id]);
	Content.share(session, '%%_public_content_8%%', [createdGroup.id]);
	Content.share(session, '%%_public_content_7%%', [createdGroup.id]);
	session.think(5, true);

	// Search for another and share it
	User.contentLibrarySearch(session, currentUser.id, '%%_search_terms_30%%');
	session.think(5, true);
	Content.share(session, '%%_public_content_6%%', [createdGroup.id]);
	session.think(6, true);

	// Search one more and share it
	User.contentLibrarySearch(session, currentUser.id, '%%_search_terms_30%%');
	session.think(5, true);
	Content.share(session, '%%_public_content_3%%', [createdGroup.id]);
	session.think(6, true);

	// Go back to the group
	User.memberships(session, currentUser.id);
	session.think(5, true);
	User.membershipsSearch(session, currentUser.id, 'intro');
	session.think(2, true);
	Group.activity(session, createdGroup.id, {'pageLoad': true});
	session.think(5, true);

	// Verify group library
	Group.contentLibrary(session, createdGroup.id);
	session.think(7, true);

	// Now we have a look at the discussions, and start one
	Group.discussionLibrary(session, createdGroup.id);

	// Create a fairly large description for the discussion. This will take about 5 minutes to write
	session.think(300, true);
	var createdDiscussion = Discussion.create(session, 'group_create_course %%_random_string_short%%', '%%_random_string_long%%', 'private', null, [createdGroup.id]);
	Discussion.profile(session, createdDiscussion.id, {'pageLoad': true});

	// Re-read, it's fine
	session.think(40, true);

	// Go back to the group discussion library page with the back button
	Group.discussionLibrary(session, createdGroup.id, {'pageLoad': true});
	session.think(6, true);

	// We are now going to make the group joinable so that our students can join
	Group.detailsUpdate(session, createdGroup.id, {'joinable': 'yes'});
	session.think(7, true);

	// Go back to my home and review some activity and notifications
	Container.home(session);

	ActivityMacros.browse(session, false, 3, 2);

	Container.logout(session);
};