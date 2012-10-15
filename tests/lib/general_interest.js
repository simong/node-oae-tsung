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
var Content = require('../../lib/api/content');
var Group = require('../../lib/api/group');
var User = require('../../lib/api/user');

/**
 * Browse public data focused around general interest of a group.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
module.exports.doGeneralInterestBrowseGroup = function(session, i) {
    var group0 = '%%_public_groups_' + i + '%%';
    var group1 = '%%_public_groups_' + (i+1) + '%%';
    var content0 = '%%_public_content_' + i + '%%';
    var content1 = '%%_public_content_' + (i+1) + '%%';
    var user0 = '%%_public_users_' + i + '%%';
    var user1 = '%%_public_users_' + (i+1) + '%%';

    // load the group profile
    Group.load(session, group0);
    session.think(4);

    // click on the group memberships
    Group.members(session, group0);
    session.think(8);

    // click on the group library
    Group.library(session, group0);
    session.think(2);

    // click on a content item and read for a bit
    Content.load(session, content0);
    session.think(45);

    // I go back to the group library and open another content item
    Group.library(session, group0);
    session.think(2);
    Content.load(session, content1);
    session.think(30);

    // I go back to the group library, then switch to its members
    Group.library(session, group0);
    session.think(1);
    Group.members(session, group0);
    session.think(6);

    // I click on a user's profile and read for a little bit
    User.profile(session, user0);
    session.think(10);

    // I go back to group members and click on another user's profile
    Group.members(session, group0);
    session.think(4);
    User.profile(session, user1);
    session.think(5);

    // I click on that user's library
    User.library(session, user1);
    session.think(3);

    // I go back to the user's profile
    User.profile(session, user1);
    session.think(3);

    // I go back to the group members
    Group.members(session, group0);
    session.think(5);

    // complete.

}

/**
 * Browse public data focused around general interest of a user.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
module.exports.doGeneralInterestBrowseUser = function(session, i) {
    var group0 = '%%_public_groups_' + i + '%%';
    var group1 = '%%_public_groups_' + (i+1) + '%%';
    var content0 = '%%_public_content_' + i + '%%';
    var content1 = '%%_public_content_' + (i+1) + '%%';
    var user0 = '%%_public_users_' + i + '%%';
    var user1 = '%%_public_users_' + (i+1) + '%%';

    // load the group profile
    User.profile(session, user0);
    session.think(4);

    // Then I view the user library
    User.library(session, user0);
    session.think(7);

    // I load a content item from the library and study it
    Content.load(session, content0);
    session.think(60);

    // I go back to the user library
    User.library(session, user0);
    session.think(6);

    // I load another content item from the library and study it
    Content.load(session, content1);
    session.think(45);

    // I go back to the user library
    User.library(session, user0);
    session.think(2);

    // I head to the user profile and read a bit about them
    // TODO: need to include 1 or 2 profile section names in public_users.csv so we can browse a user profile better
    User.profile(session, user0);
    session.think(15);

    // I view all the groups this user belongs to
    User.myMemberships(session, user0);
    session.think(7);

    // I visit a group that they belong to
    Group.load(session, group0);
    session.think(15);

    // I go back to the user memberships and load another group
    User.myMemberships(session, user0);
    session.think(2);
    Group.load(session, group1);
    session.think(8);

    // I go back to the user memberships then click to the profile
    User.myMemberships(session, user0);
    session.think(1);
    User.profile(session, user0);

}

/**
 * Browse public data focused around general interest of a content item.
 *
 * @param {Session} session The Tsung user session to perform the browsing on
 * @param {Number}  i       The iteration number to use
 */
module.exports.doGeneralInterestBrowseContent = function(session, i) {
    var group0 = '%%_public_groups_' + i + '%%';
    var group1 = '%%_public_groups_' + (i+1) + '%%';
    var content0 = '%%_public_content_' + i + '%%';
    var content1 = '%%_public_content_' + (i+1) + '%%';
    var user0 = '%%_public_users_' + i + '%%';
    var user1 = '%%_public_users_' + (i+1) + '%%';

    // load the content and read
    Content.load(session, content0);
    session.think(45);

    // Then I view the content members
    Content.members(session, content0);
    session.think(7);

    // load a group associated to the content and read a bit
    Group.load(session, group0);
    session.think(10);

    // go back to the content members
    Content.members(session, content0);
    session.think(4);

    // go back to the content profile
    Content.load(session, content0);
    session.think(15);

    // view a related content item
    Content.load(session, content1);
    session.think(30);

    // view the members of that item
    Content.members(session, content1);
    session.think(8);

    // go back to the content profile
    Content.load(session, content1);
    session.think(2);

    // go back to the content members of the first content item
    Content.members(session, content0);
    session.think(6);

    // view a user associated to the content item
    User.profile(session, user0);
    session.think(10);

    // go back to the content members
    Content.members(session, content0);
    session.think(2);

    // go back to the content profile
    Content.load(session, content0);
    session.think(25);

}
