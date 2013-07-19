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

var _ = require('underscore');

/**
 * Generates the edit_groups.csv file that provides groups that can be edited.
 *
 * Each row will have a groupid, a user who can manage the group, the managing user's password, a member of the group, and a non-member of the group. That way the managing user can be used to remove the member and add the non-member
 */
module.exports = function(batchNum, model, csvWriter, callback) {
    var rows = [];
    var users = _.keys(model.users);
    var randomUser = function() {
        return users[Math.floor(Math.random()*users.length)];
    };

    for (var id in model.groups) {
        var group = model.groups[id];
        var manager = group.roles.manager.users[0];
        if (manager) {
            var password = model.users[manager].password;
            var member = group.roles.member.users[0];
            if (member) {
                var nonmember = randomUser();
                while (group.roles.member.users.indexOf(nonmember) !== -1 ||
                    group.roles.manager.users.indexOf(nonmember) !== -1) {
                        nonmember = randomUser();
                }
                rows.push([model.idMapping.groups[group.id], model.idMapping.users[manager], password, model.idMapping.users[member], model.idMapping.users[nonmember]]);
            }
        }
    }

    csvWriter.write('edit_groups', rows, callback);
};
