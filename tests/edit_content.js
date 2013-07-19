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
var User = require('../lib/api/user');

var GeneralInterest = require('./lib/general_interest_public');
var Login = require('./lib/login');

/**
 * Generate a user session against the runner that similuates an authenticated user editing a content item
 *
 * @param {Tsung}   runner          The Tsung runner to build the session on
 * @param {Number}  probability     The probability that this session will execute
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('edit_content', probability);

    Login.visitLoginRedirect(session, '%%_manage_resources_manager_username%%', '%%_manage_resources_manager_password%%');

    // Browse around a bit
    GeneralInterest.doGeneralInterestBrowseContent(session, 0);
    session.think(4);

    var contentId = '%%_manage_resources_content_id%%';

    // Find a group and make a couple updates
    Content.profile(session, contentId);
    session.think(3);

    var updates = {'displayName': 'displayName changed by tsung test'};
    Content.detailsUpdate(session, contentId, updates);
    session.think(5);

    updates = {'displayName': 'displayName changed a second time by tsung test'};
    Content.detailsUpdate(session, contentId, updates);
    session.think(2);

    // Come back around and edit a bit more
    updates = {'displayName': '%%_random_string_short%%'};
    Content.detailsUpdate(session, contentId, updates);
    Content.profile(session, contentId);
    session.think(5);

    Container.logout(session);
};
