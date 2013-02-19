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
var GeneralInterest = require('./lib/general_interest_public');
var Search = require('../lib/api/search');
var User = require('../lib/api/user');

/**
 * Generate a user session against the runner that similuates an authenticated user creating a group
 *
 * @param {Tsung}   runner          The Tsung runner to build the session on
 * @param {Number}  probability     The probability that this session will execute
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('add_content_users', probability);

    var user = User.login(session, '%%_content_add_users_manager_username%%', '%%_content_add_users_manager_password%%');

    GeneralInterest.doGeneralInterestBrowseContent(session, 0);

    // Eventually come around to the group I manage
    var contentId = '%%_content_add_users_content_id%%';
    Content.profile(session, contentId);
    session.think(2);

    // Go to the members list
    Content.members(session, contentId);
    session.think(6);

    // Add 2 users
    var update = {
        '%%_content_add_users_user_0%%': 'viewer',
        '%%_content_add_users_user_1%%': 'viewer'
    };
    Content.updateMembers(session, contentId, update);
    session.think(2);

    Content.profile(session, contentId);
    session.think(3);

    // Browse twice more
    GeneralInterest.doGeneralInterestBrowseContent(session, 2);
    GeneralInterest.doGeneralInterestBrowseContent(session, 4);

    // Go back to the group and add the 3rd member
    Content.profile(session, contentId);
    session.think(2);

    // Go to the members list
    Content.members(session, contentId);
    session.think(6);

    // Share with 3 other users
    Content.share(session, contentId, '%%_content_add_users_user_2%%');
    session.think(2);
    Content.share(session, contentId, '%%_content_add_users_user_3%%');
    session.think(2);
    Content.share(session, contentId, '%%_content_add_users_user_4%%');

    // Browse twice more
    GeneralInterest.doGeneralInterestBrowseContent(session, 6);
    GeneralInterest.doGeneralInterestBrowseContent(session, 8);

    // Come back to my group and remove the users I've added
    Content.profile(session, contentId);
    session.think(2);

    // Go to the members list
    Content.members(session, contentId);
    session.think(6);

    // Remove the users
    update = {
        '%%_content_add_users_user_0%%': false,
        '%%_content_add_users_user_1%%': false,
        '%%_content_add_users_user_2%%': false,
        '%%_content_add_users_user_3%%': false,
        '%%_content_add_users_user_4%%': false
    };
    Content.updateMembers(session, contentId, update);
    session.think(2);

    Content.profile(session, contentId);
    session.think(3);

    User.logout(session);
};
