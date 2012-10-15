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
var GeneralInterest = require('./lib/general_interest');

/**
 * Generate a user session against the runner that similuates an anonymous user visiting the application with general interest
 * in a user.
 *
 * @param {Tsung}   runner          The Tsung runner to build the session on
 * @param {Number}  probability     The probability that this session will execute
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('general_interest_user_anon', probability);

    // perform several general interest iterations to form a realistic session length.
    // makes the total session length roughly 20min, of user having general interest in a group and cascading to others
    for (var i = 0; i < 5; i++) {
        GeneralInterest.doGeneralInterestBrowseUser(session, i);
    }
}
