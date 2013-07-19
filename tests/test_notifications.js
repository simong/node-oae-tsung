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

var Group = require('../lib/api/group');
var Notifications = require('../lib/api/notifications');
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
    var session = runner.addSession('test_notifications', probability);

    Login.localLoginDashboard(session, 'u:cam:eTz-Mlycl5', 'batch0-lynn-brentari-108', 'caroline');
    session.think(5);

    Group.profile(session, 'g:cam:PP5s6zjol5');
};
