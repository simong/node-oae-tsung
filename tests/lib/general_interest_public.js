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

var Container = require('../../lib/api/container');
var Content = require('../../lib/api/content');
var Group = require('../../lib/api/group');
var Search = require('../../lib/api/search');
var User = require('../../lib/api/user');

/**
 * Browse public data focused around general interest of a group.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
var doGeneralInterestBrowseGroup = module.exports.doGeneralInterestBrowseGroup = function(session, i) {
    var group0 = '%%_public_groups_' + i + '%%';
    var group1 = '%%_public_groups_' + (i+1) + '%%';
    var content0 = '%%_public_content_' + i + '%%';
    var content1 = '%%_public_content_' + (i+1) + '%%';
    var user0 = '%%_public_users_' + i + '%%';
    var user1 = '%%_public_users_' + (i+1) + '%%';

    // Load the group. It goes to the library as we'll assume we aren't a member for these groups
    Group.contentLibrary(session, group0, {'pageLoad': true});
    session.think(4);

    // Click on the group members
    Group.members(session, group0);
    session.think(8);

    // click on the group library again (it's cached though so no request happens)
    session.think(2);

    // click on a content item and read for a bit
    Content.profile(session, content0);
    session.think(45);

    // read second page of comments
    Content.profileScroll(session, content0);
    session.think(10);

    // I go back to the group library and open another content item
    session.think(2);
    Content.profile(session, content1);
    session.think(30);

    // I go back to the group library, then switch to its members
    Group.members(session, group0);
    session.think(6);

    // Scroll down
    Group.membersScroll(session, group0);
    session.think(6);

    // Scroll down
    Group.membersScroll(session, group0);
    session.think(6);

    // I click on a user's profile
    User.contentLibrary(session, user0, {'pageLoad': true});
    session.think(10);

    // I go back to group members and click on another user's profile
    session.think(4);
    User.contentLibrary(session, user1, {'pageLoad': true});
    session.think(5);

    // I click on that user's memberships
    User.memberships(session, user1);
    session.think(3);

    User.membershipsScroll(session, user1);
    session.think(7);

    // Go back to the user's library
    User.contentLibrary(session, user1, {'pageLoad': true});

    // I go back to the group members
    Group.members(session, group0);
    session.think(5);

};

/**
 * Browse public data focused around general interest of a user.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
var doGeneralInterestBrowseUser = module.exports.doGeneralInterestBrowseUser = function(session, i) {
    var group0 = '%%_public_groups_' + i + '%%';
    var group1 = '%%_public_groups_' + (i+1) + '%%';
    var content0 = '%%_public_content_' + i + '%%';
    var content1 = '%%_public_content_' + (i+1) + '%%';
    var user0 = '%%_public_users_' + i + '%%';

    // load the user
    User.contentLibrary(session, user0, {'pageLoad': true});
    session.think(7);

    User.contentLibraryScroll(session, user0);
    session.think(12);

    // I load a content item from the library and study it
    Content.profile(session, content0, {'pageLoad': true});
    session.think(60);

    // I go back to the user library
    User.contentLibrary(session, user0, {'pageLoad': true});
    session.think(6);

    // I load another content item from the library and study it
    Content.profile(session, content1, {'pageLoad': true});
    session.think(45);

    // I go back to the user library
    User.contentLibrary(session, user0, {'pageLoad': true});
    session.think(2);

    // I view all the groups this user belongs to
    User.memberships(session, user0);
    session.think(7);

    User.membershipsScroll(session, user0);
    session.think(3);

    // I visit a group that they belong to
    Group.contentLibrary(session, group0, {'pageLoad': true});
    session.think(15);

    // I go back to the user memberships and load another group
    User.memberships(session, user0, {'pageLoad': true});
    session.think(2);
    Group.contentLibrary(session, group1, {'pageLoad': true});
    session.think(8);

    // I go back to the user memberships then click to the library
    User.memberships(session, user0, {'pageLoad': true});
    session.think(1);
    User.contentLibrary(session, user0);
    session.think(5);
};

/**
 * Browse public data focused around general interest of a content item.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
var doGeneralInterestBrowseContent = module.exports.doGeneralInterestBrowseContent = function(session, i) {
    var group0 = '%%_public_groups_' + i + '%%';
    var group1 = '%%_public_groups_' + (i+1) + '%%';
    var content0 = '%%_public_content_' + i + '%%';
    var content1 = '%%_public_content_' + (i+1) + '%%';
    var user0 = '%%_public_users_' + i + '%%';

    // load the content and read
    Content.profile(session, content0);
    session.think(45);

    // reading more comments
    Content.profileScroll(session, content0);
    session.think(10);

    // reading more comments
    Content.profileScroll(session, content0);
    session.think(15);

    // load a group associated to the content and read a bit
    Group.contentLibrary(session, group0, {'pageLoad': true});
    session.think(10);

    // Look at some more
    Group.contentLibraryScroll(session, group0);

    // go back to the content item
    Content.profile(session, content0);
    session.think(15);

    // view a related content item
    Content.profile(session, content1);
    session.think(30);

    // read some more comments
    Content.profileScroll(session, content1);
    session.think(7);

    // go back to the content profile of the first content item
    Content.profile(session, content0);
    session.think(6);

    // view a user associated to the content item
    User.contentLibrary(session, user0, {'pageLoad': true});
    session.think(7);

    User.contentLibraryScroll(session, user0);
    session.think(5);

    // go back to the content profile
    Content.profile(session, content0);
    session.think(25);

};

/**
 * Browse public data focused around general interest of a search term.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
var doGeneralInterestBrowseSearchTerm = module.exports.doGeneralInterestBrowseSearchTerm = function(session, i) {
    
    var contentSingle = '%%_public_content_' + i + '%%';

    // load the general search page
    Container.search(session);
    session.think(3);

    // perform a search
    var scroller = Search.search(session, '%%_search_term_30%%');
    session.think(4);

    // browse down a page
    scroller.scroll();
    session.think(3);

    // select content as a search type
    scroller = Search.search(session, '%%_search_term_30%%', ['content']);
    session.think(6);

    scroller.scroll();
    session.think(2);

    // click an item and read a bit
    Content.profile(session, contentSingle);
    session.think(10);

    // return to the search page
    scroller = Search.search(session, '%%_search_term_30%%', ['content'], {'pageLoad': true});
    session.think(2);

    // scroll down a page
    scroller.scroll();
    session.think(4);

    // browse a content item and related content
    doGeneralInterestBrowseContent(session, i);

    // go back to search from the top
    Container.search(session, '%%_search_term_30%%');
    session.think(6);

    // switch to content again and begin to scroll
    scroller = Search.search(session, '%%_search_term_30%%', ['content']);
    session.think(1);
    scroller.scroll();
    session.think(1);
    scroller.scroll();

    // nothing of interest, switch to groups. first select group, then de-select content
    Search.search(session, '%%_search_term_30%%', ['content', 'group']);
    session.think(1);
    Search.search(session, '%%_search_term_30%%', ['group']);
    session.think(5);

    // browse a group
    doGeneralInterestBrowseGroup(session, i);

    // return to search again from the top nav
    Container.search(session, '%%_search_term_30%%');
    session.think(3);

    // switch to groups
    Search.search(session, '%%_search_term_30%%', ['group']);
    session.think(6);

    // browse another group
    doGeneralInterestBrowseGroup(session, i + 1);

    // return to search again from the top nav
    Container.search(session, '%%_search_term_30%%');
    session.think(3);

    // switch to groups and scroll
    scroller = Search.search(session, '%%_search_term_30%%', ['group']);
    session.think(2);
    scroller.scroll();
    session.think(8);

};
