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
var TsungUtil = require('../util');

var NUM_USERS_PER_GROUP = 3;

/**
 * Generates a group_add_users.csv file that provides group membership information that can be used to identify which users can be
 * added to a group, and which user can add them.
 */
module.exports = function(batchNum, model, outputDir, callback) {
    var rows = [];

    var groupsArray = _.values(model.groups);
    var usersArray = _.values(model.users);

    var i = 0;
    _.each(model.groups, function(group) {
        var managerId = _getManagerUserId(group);
        var manager = model.users[managerId];
        if (!manager) {
            return;
        }

        var nonMembers = [];
        while (nonMembers.length < NUM_USERS_PER_GROUP) {
            var userIndex = i % usersArray.length;
            var nonMemberUserId = usersArray[userIndex].id;
            if (!_.contains(_.union(group.roles.manager.users, group.roles.member.users), nonMemberUserId)) {
                nonMembers.push(model.idMapping.users[nonMemberUserId]);
            }

            i++;
        }

        var row = [manager.userid, manager.password, group.id];
        Array.prototype.push.apply(row, nonMembers);
        rows.push(row);
    });

    var outputFile = outputDir + '/group_add_users.csv';
    console.log('[group_add_users.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
};

var _getManagerUserId = function(item) {
    var managerUserId = null;
    _.each(item.roles.manager.users, function(userId) {
        // Don't treat users that belong in both managers and memebrs list as managers
        if (!_.contains(item.roles.member.users, userId)) {
            managerUserId = userId;
        }
    });
    return managerUserId;
};
