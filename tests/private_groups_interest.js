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

var Container = require('../lib/api/container');
var Content = require('../lib/api/content');
var Group = require('../lib/api/group');
var User = require('../lib/api/user');

var Login = require('./lib/login');

/**
 * This test generates a user session that represents a user / student generally browsing public content and users associated to a
 * private group. This entails:
 *
 *      *   The user will start out by logging in, view their memberships, access a private group
 *      *   The user will spend roughly 5 - 10s reading group profiles
 *      *   The user will then view the library of that group, then access some public content in the group library
 *      *   When a user views a content item that is available from a group, there will be typically be delays of 15 - 30s to
 *          accommodate reading of that content
 *      *   The user will generally return to the group for more content / users as that is the focal point of the test
 *      *   The user will also browse the group's members, and access public users from the list
 *
 *  **Note:**   The motivation for this test is to put weight on private group access, in lieu of not being able to do this in
 *              study_group_content.js
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('private_groups_interest', probability);

    var userId = '%%_current_user_id%%';
    var username = '%%_private_groups_user_username%%';
    var password = '%%_private_groups_user_password%%';
    var privGroup0 = '%%_private_groups_access_depth0_0%%';
    var privGroup1 = '%%_private_groups_access_depth0_1%%';
    var privGroup2 = '%%_private_groups_access_depth0_2%%';
    var privGroup3 = '%%_private_groups_access_depth1_0%%';
    var pubContent0 = '%%_public_content_0%%';
    var pubContent1 = '%%_public_content_1%%';
    var pubContent2 = '%%_public_content_2%%';
    var pubContent3 = '%%_public_content_3%%';
    var pubUser0 = '%%_public_users_0%%';
    var pubUser1 = '%%_public_users_1%%';
    var pubUser2 = '%%_public_users_2%%';
    var pubUser3 = '%%_public_users_3%%';

    Login.visitLoginRedirect(session, username, password);
    session.think(3);

    User.memberships(session, userId);
    session.think(5);

    // view a private group
    Group.activity(session, privGroup0, {'pageLoad': true});
    session.think(8, true);

    // Scroll activities of the group
    Group.activityScroll(session, privGroup0);
    session.think(8, true);

    Group.activityScroll(session, privGroup0);
    session.think(8, true);

    // go back and view another
    User.memberships(session, userId, {'pageLoad': true});
    session.think(4);

    Group.activity(session, privGroup1, {'pageLoad': true});
    session.think(5, true);

    // Load the library of the group
    Group.contentLibrary(session, privGroup1);
    session.think(5);

    // read a content item and first page of comments
    Content.profile(session, pubContent0);
    session.think(30, true);

    // scroll the next page of comments and read
    Content.profileScroll(session, pubContent0);
    session.think(10, true);

    // scroll and read a second time
    Content.profileScroll(session, pubContent0);
    session.think(10, true);

    // go back and view another content item
    Group.contentLibrary(session, privGroup1, {'pageLoad': true});
    session.think(3);

    Content.profile(session, pubContent1, {'pageLoad': true});
    session.think(20, true);

    // read another page of comments
    Content.profileScroll(session, pubContent0);
    session.think(10, true);

    // go back and view the group members
    Group.contentLibrary(session, privGroup1, {'pageLoad': true});
    session.think(3);

    Group.members(session, privGroup1);
    session.think(5);

    // view group with access depth 1
    Group.activity(session, privGroup3, {'pageLoad': true});
    session.think(10, true);

    // View its members
    Group.members(session, privGroup3);
    session.think(4);

    // view user from that group
    User.contentLibrary(session, pubUser0, {'pageLoad': true});
    session.think(10, true);

    // view their memberships
    User.memberships(session, pubUser0);
    session.think(5);

    // view group that I'm also a member of
    Group.activity(session, privGroup2);
    session.think(6, true);

    Group.activityScroll(session, privGroup2);
    session.think(2);

    Group.activityScroll(session, privGroup2);
    session.think(8, true);

    // boring!
    Container.logout(session);

};
