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
    var session = runner.addSession('group_create_collab', probability);

    // 1. Visit the landing page then log in. I'm redirected to my activity feed. I then browse the feed a little bit and notifications.

    // Log in
	var currentUser = LoginMacros.visitLogin(session, '%%_users_username%%', '%%_users_password%%');
	
	// Have a look at my activities and notifications
	ActivityMacros.browse(session, true, 5, 3);

	// 2. I continue to create the group I came to create. It takes a little while to type in the information

	// Nothing of interest yet. Create the group we came to create.
	session.think(15, true);
	var createdGroup = Group.create(session, 'Tsung Test group_create_collab %%_random_string_short%%', 'private');
 
	// Redirected directly to members
	Group.members(session, createdGroup.id);
	session.think(4, true);


	// 3. I want to add a user that I will collaborate with in the group. Later we might open it up, but this test is just seeding the initial data

	// Open the manage access pane
	Group.manageAccess(session, createdGroup.id);
	session.think(4, true);

	// Add a user to manage the group with me
	ApiUtil.searchMemberAutosuggest(session, '%%_public_users_0%%');
	session.think(2, true);
	Group.manageAccessUpdate(session, createdGroup.id, null, {'%%_public_users_0%%': 'manager'});
	session.think(4, true);


	// 4. Now that my collaborator is in, I'll create some content to start with the group

	// Move to the content library, then open the clip and create a document
	Group.contentLibrary(session, createdGroup.id);
	session.think(10, true);

	// Creating the document takes you straight to the profile
	var createdDocument = Content.createDocument(session, 'Tsung Test %%_random_string_short%%', 'private', null, [createdGroup.id]);
	Content.profile(session, createdDocument.id);
	session.think(3, true);

	// Not ready to edit it yet. Go back
	Content.publishDocument(session, createdDocument.id);
	Group.contentLibrary(session, createdGroup.id, {'pageLoad': true});

	// Create a link
	session.think(15, true);
	var createdLink = Content.createLink(session, 'Tsung Test http://www.google.ca', 'public', 'http://www.google.ca', null, [createdGroup.id]);
	Group.contentLibrary(session, createdGroup.id);
	session.think(10, true);

	// Have a look at the activity feed
	Group.activity(session, createdGroup.id);
	session.think(10, true);

	// Refresh
	Group.activity(session, createdGroup.id, {'pageLoad': true});
	session.think(5, true);


	// 5. I added the content, now I'll create a discussion we can use

	// Visit the discussions tab
	Group.discussionLibrary(session, createdGroup.id);

	// Open the clip and create a discussion. We are redirected to its profile
	session.think(30, true);
	var createdDiscussion = Discussion.create(session, 'Tsung Test %%_random_string_short%%', '%%_random_string_medium%%', 'private', null, [createdGroup.id]);
	Discussion.profile(session, createdDiscussion.id, {'pageLoad': true});

	// I've made a mistake in the description. edit it.
	session.think(20, true);
	Discussion.detailsUpdate(session, createdDiscussion.id, {'description': 'Tsung Test Edit %%_random_string_medium%%'});
	session.think(5);

	// Go back to the group discussion library page with the back button
	Group.discussionLibrary(session, createdGroup.id, {'pageLoad': true});
	session.think(2, true);


	// 6. There are a couple items in the library we'll use for reference that exist elsewhere. We'll search for those and share them

	// Search for a couple reference content items to add to this group's library
	var scroller = Container.search(session, '%%_search_terms_30%%');
	session.think(4, true);

	scroller.scroll();
	session.think(2, true);

	// Find an item and then share it
	Content.profile(session, '%%_public_content_6%%');
	session.think(5, true);

	ApiUtil.searchMemberAutosuggest(session, '%%_search_terms_30%%');
	Content.share(session, '%%_public_content_6%%', [createdGroup.id]);

	// Search for one more and share it
	scroller = Container.search(session, '%%_search_terms_30%%');
	session.think(6, true);

	scroller.scroll();
	session.think(4, true);

	// Too much, narrow down to content
	Search.search(session, '%%_search_terms_30%%', ['content']);
	session.think(3, true);

	Content.profile(session, '%%_public_content_7%%');
	session.think(8, true);

	ApiUtil.searchMemberAutosuggest(session, '%%_search_terms_30%%');
	session.think(2, true);

	Content.share(session, '%%_public_content_7%%', [createdGroup.id]);
	session.think(2, true);

	// Going back to group to ensure it was shared. Need to go home, then memberships, then search the group
	Container.home(session);
	session.think(6, true);

	User.memberships(session, currentUser.id);
	session.think(4, true);

	User.membershipsScroll(session, currentUser.id);
	session.think(3, true);

	// Click on the group in my memberships and visit the content library to verify the content items I've added
	Group.activity(session, createdGroup.id, {'pageLoad': true});
	session.think(3, true);

	Group.contentLibrary(session, createdGroup.id);
	session.think(3, true);


	// 7. The group is created and seeded. Meanwhile I received a notification. Check it out.

	// I received a new notification, check it
	Container.notifications(session);
	session.think(4, true);

	// Have a look at the group activities
	Group.activity(session, createdGroup.id);
	session.think(7, true);

	// Go back to my home page (activity) to have a better look at the notification
	Container.home(session);
	session.think(4, true);


	// 8. Reply to the comment that I was notified about

	// Notification was on the document I seeded in the group. Lets go have a look and reply
	ActivityMacros.checkContentComment(session, createdDocument.id, '%%_random_string_medium%%', 1, '%%_random_string_short%%');


	// Back home I go, I'm about done
	Container.home(session);
	session.think(8, true);

	Container.logout(session);
};
