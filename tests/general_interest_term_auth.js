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
var User = require('../lib/api/user');
var GeneralInterest = require('./lib/general_interest_public');

/**
 * Generate a user session against the runner that similuates an authenticated user visiting the application with general interest in
 * searching / browsing a particular term / search phrase
 *
 * @param {Tsung}       runner              The Tsung runner to build the session on
 * @param {Number}      probability         The probability that this session will execute
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    var session = runner.addSession('general_interest_term_auth', probability);

    User.login(session, '%%_users_username%%', '%%_users_password%%');

    for (var i = 0; i < 2; i++) {
        GeneralInterest.doGeneralInterestBrowseSearchTerm(session, i);
    }

    User.logout(session);
}