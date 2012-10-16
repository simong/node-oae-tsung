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
var Content = require('../lib/api/content');
var Group = require('../lib/api/group');
var User = require('../lib/api/user');

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

    var userId = '%%_private_groups_user_id%%';
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

    User.login(session, username, password);
    session.think(3);

    User.myMemberships(session, userId);
    session.think(5);

    // view a private group
    Group.profile(session, privGroup0);
    session.think(8, true);

    // go back and view another
    User.myMemberships(session, userId);
    session.think(4);

    Group.profile(session, privGroup1);
    session.think(5, true);

    Group.library(session, privGroup1);
    session.think(5);

    // read a content item
    Content.profile(session, pubContent0);
    session.think(20, true);

    // go back and view another content item
    Group.library(session, privGroup1);
    session.think(3);

    Content.profile(session, pubContent1);
    session.think(20, true);

    // go back and view members
    Group.library(session, privGroup1);
    session.think(3);

    Group.members(session, privGroup1);
    session.think(5);

    // view group with access depth 1
    Group.profile(session, privGroup3);
    session.think(10, true);

    Group.members(session, privGroup3);
    session.think(4);

    // view user from that group
    User.profile(session, pubUser0);
    session.think(10, true);

    User.library(session, pubUser0);
    session.think(3);

    User.myMemberships(session, pubUser0);
    session.think(5);

    // view group that I'm also a member of
    Group.profile(session, privGroup2);
    session.think(9, true);

    // boring!
    User.logout(session);

}