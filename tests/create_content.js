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
var User = require('../lib/api/user');

/**
 * Generate a user session against the runner that similuates an authenticated user visiting
 * his library and uploading a new file.
 *
 * @param {Tsung}   runner          The Tsung runner to build the session on
 * @param {Number}  probability     The probability that this session will execute
 */
module.exports.test = function(runner, probability) {
    probability = probability || 100;
    // Create a new session.
    var session = runner.addSession('create_content', probability);

    var user = User.login(session, '%%_users_username%%', '%%_users_password%%');

    // The user goes to his library.
    User.library(session, user.id);

    // He selects a new file to upload..
    session.think(4);

    // Create the actual file.
    Content.createFile(session, 'default');

    // That's it for now
    User.logout(session);
}
