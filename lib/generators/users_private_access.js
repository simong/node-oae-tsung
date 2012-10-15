
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
var TsungUtil = require('../util');

// permutate user rows over private access
var NUM_PRIVATE_GROUP_ROWS = 10;

module.exports = function(batchNum, model, outputDir, callback) {
    var users = model.users;
    var groups = model.groups;
    var content = model.content;

    var assocPrivateMembers = {};

    // build a hash of "userId" -> "private group". The relation between the user and private group is that the user is a "member"
    // of the group.
    for (var groupId in groups) {
        var group = groups[groupId];
        if (group.visibility === 'private') {
            var members = group.roles.member.users;
            for (var i = 0; i < members.length; i++) {
                var member = members[i];
                if (!assocPrivateMembers[member]) {
                    assocPrivateMembers[member] = [groupId];
                } else {
                    assocPrivateMembers[member].push(groupId);
                }
            }
        }
    }

    // build the format for the CSV file
    var rows = [];
    for (var userId in assocPrivateMembers) {
        if (assocPrivateMembers[userId]) {
            // limit the number of permutations of private groups
            for (var i = 0; i < Math.min(NUM_PRIVATE_GROUP_ROWS, assocPrivateMembers[userId].length); i++) {
                rows.push([userId, users[userId].userid, users[userId].password, assocPrivateMembers[userId][i]]);
            }
        }
    }

    var outputFile = outputDir + '/users_private_access.csv';
    console.log('[users_private_access.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
}