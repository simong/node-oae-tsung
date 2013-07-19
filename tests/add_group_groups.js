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
var Group = require('../lib/api/group');
var Search = require('../lib/api/search');
var User = require('../lib/api/user');

var GeneralInterest = require('./lib/general_interest_public');
var Login = require('./lib/login');

/**
 * Generate a user session against the runner that similuates an authenticated user creating a group
 *
 * @param {Tsung}   runner          The Tsung runner to build the session on
 * @param {Number}  probability     The probability that this session will execute
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('add_group_groups', probability);

    Login.visitLoginRedirect(session, '%%_group_add_groups_manager_username%%', '%%_group_add_groups_manager_password%%');

    GeneralInterest.doGeneralInterestBrowseGroup(session, 0);

    // Eventually come around to the group I manage
    var groupId = '%%_group_add_groups_group_id%%';
    Group.profile(session, groupId);
    session.think(2);

    // Go to the members list
    Group.members(session, groupId);
    session.think(6);

    // Add 2 users
    var update = {
        '%%_group_add_groups_group_0%%': 'member',
        '%%_group_add_groups_group_1%%': 'member'
    };
    Group.updateMembers(session, groupId, update);
    session.think(2);

    Group.profile(session, groupId);
    session.think(3);

    // Browse twice more
    GeneralInterest.doGeneralInterestBrowseGroup(session, 2);
    GeneralInterest.doGeneralInterestBrowseGroup(session, 4);

    // Go back to the group and add the 3rd member
    Group.profile(session, groupId);
    session.think(2);

    // Go to the members list
    Group.members(session, groupId);
    session.think(6);

    // Add the 3rd user
    Group.updateMembers(session, groupId, {'%%_group_add_groups_group_2%%': 'member'});
    session.think(2);

    // Browse twice more
    GeneralInterest.doGeneralInterestBrowseGroup(session, 6);
    GeneralInterest.doGeneralInterestBrowseGroup(session, 8);

    // Come back to my group and remove the users I've added
    Group.profile(session, groupId);
    session.think(2);

    // Go to the members list
    Group.members(session, groupId);
    session.think(6);

    // Remove the users
    update = {
        '%%_group_add_groups_group_0%%': false,
        '%%_group_add_groups_group_1%%': false,
        '%%_group_add_groups_group_2%%': false
    };
    Group.updateMembers(session, groupId, update);
    session.think(2);

    Group.profile(session, groupId);
    session.think(3);

    Container.logout(session);
};
