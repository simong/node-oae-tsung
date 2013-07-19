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

var ApiUtil = require('../lib/api/util');
var Container = require('../lib/api/container');
var Content = require('../lib/api/content');
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
    var session = runner.addSession('add_content_groups', probability);

    Login.visitLoginRedirect(session, '%%_content_add_groups_manager_username%%', '%%_content_add_groups_manager_username%%', '%%_content_add_groups_manager_password%%');

    GeneralInterest.doGeneralInterestBrowseContent(session, 0);

    // Eventually come around to the group I manage
    var contentId = '%%_content_add_groups_content_id%%';
    Content.profile(session, contentId, {'pageLoad': true});
    session.think(2);

    // Manage the access of the content item
    Content.manageAccess(session, contentId);
    session.think(6);

    // Add a user
    ApiUtil.searchMemberAutosuggest(session);
    Content.manageAccessUpdate(session, contentId, null, {'%%_content_add_groups_group_0%%': 'viewer'});
    session.think(2);

    // Browse twice more
    GeneralInterest.doGeneralInterestBrowseContent(session, 2);
    GeneralInterest.doGeneralInterestBrowseContent(session, 4);

    // Go back to the content item
    Content.profile(session, contentId, {'pageLoad': true});
    session.think(4);

    // Type in 2 differe users to share with, then share
    ApiUtil.searchMemberAutosuggest(session);
    session.think(2);
    ApiUtil.searchMemberAutosuggest(session, null, 2);
    session.think(4);
    Content.share(session, contentId, ['%%_content_add_groups_group_1%%', '%%_content_add_groups_group_2%%']);
    session.think(4);

    // Browse twice more
    GeneralInterest.doGeneralInterestBrowseContent(session, 6);
    GeneralInterest.doGeneralInterestBrowseContent(session, 8);

    // Come back to my group and remove the users I've added
    Content.profile(session, contentId, {'pageLoad': true});
    session.think(4);

    // Go to the members list, scrolling through them to find them and remove them
    Content.manageAccess(session, contentId);
    session.think(4);

    Content.membersScroll(session, contentId);
    session.think(6);

    Content.membersScroll(session, contentId);
    session.think(6);

    // Update the manage access pane
    var update = {
        '%%_content_add_groups_group_0%%': false,
        '%%_content_add_groups_group_1%%': false,
        '%%_content_add_groups_group_2%%': false
    };
    Content.manageAccessUpdate(session, contentId, null, update);
    session.think(8);

    Container.logout(session);
};
