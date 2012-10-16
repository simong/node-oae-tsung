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
 * This test generates a user session that represents a user / student studying content that is shared privately from within a group.
 * This organizes the test in the following way:
 *
 *      *   The user will start out by logging in, view their memberships, access a public group
 *      *   The user will then view the library of that group, then access a piece of content to which the user is associated to at
 *          a depth 1 (access depth: 1)
 *      *   When a user views a private content item that is available from a group, there will be typically be long delays for
 *          reading ("studying"). 30s to 1m ?
 *      *   In some cases, the user will digress to "related" content that will be public, but the user will spend less time
 *          reading those as they are not of particular interest. 5s to 15s ?
 *      *   Sometimes when the user returns to the group, they will return through their profile and memberships again. i.e., they
 *          didn't use the "back" button. These paths will have relatively low think times as the user knows exactly where they are
 *          going.
 *
 *  **Note:**   I think that ideally we would access a private group of depth 0 to get to the private content of depth 1, but we
 *              currently don't have test data CSV that associates a user to accessible groups *and* content. Only one or the other.
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('study_group_content', probability);

    var userId = '%%_private_content_user_id%%';
    var username = '%%_private_content_user_username%%';
    var password = '%%_private_content_user_password%%';
    var pubGroup0 = '%%_public_groups_0%%';
    var privContent0 = '%%_private_content_access_depth1_0%%';
    var privContent1 = '%%_private_content_access_depth1_1%%';
    var privContent2 = '%%_private_content_access_depth1_2%%';
    var privContent3 = '%%_private_content_access_depth1_3%%';
    var pubContent0 = '%%_public_content_0%%';
    var pubContent1 = '%%_public_content_1%%';
    var pubContent2 = '%%_public_content_2%%';
    var pubContent3 = '%%_public_content_3%%';

    User.login(session, username, password);
    session.think(3);

    User.myMemberships(session, userId);
    session.think(5);

    Group.profile(session, pubGroup0);
    session.think(2);

    Group.library(session, pubGroup0);
    session.think(3);

    // read for a bit.
    Content.profile(session, privContent0);
    session.think(45, true);

    Group.library(session, pubGroup0);
    session.think(2);

    // read another piece of private content
    Content.profile(session, privContent1);
    session.think(45, true);

    // digress to some related content
    Content.profile(session, pubContent0);
    session.think(10, true);

    Content.profile(session, pubContent1);
    session.think(10, true);

    // go back to group through their profile
    User.myMemberships(session, userId);
    session.think(2);

    Group.profile(session, pubGroup0);
    session.think(2);

    Group.library(session, pubGroup0);
    session.think(5);

    // view another private content
    Content.profile(session, privContent2);
    session.think(45, true);

    Group.library(session, pubGroup0);
    session.think(5);

    // one more
    Content.profile(session, privContent3);
    session.think(45, true);

    // digress
    Content.profile(session, pubContent2);
    session.think(10, true);

    Content.profile(session, pubContent3);
    session.think(10, true);

    // boring!
    User.logout(session);

}