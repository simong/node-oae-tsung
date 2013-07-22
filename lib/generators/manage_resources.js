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
 * Generates the manage_resources.csv file that provides groups that can be edited.
 *
 * Each row will have a groupid, a user who can manage the group, the managing user's password, a member of the group, and a non-member of the group. That way the managing user can be used to remove the member and add the non-member
 */
module.exports = function(batchNum, model, csvWriter, callback) {
    var rows = [];

    // Keyed by a user id, holds all content, groups and discussions that the user manages
    var manage = {};

    _.each(model.groups, function(group) {
        _.each(group.roles.manager.users, function(userId) {
            manage[userId] = manage[userId] || {'content': [], 'groups': [], 'discussions': []};
            if (!_.contains(group.roles.member.users, userId)) {
                manage[userId].groups.push(model.idMapping.groups[group.id]);
            }
        });
    });

    _.each(model.content, function(content) {
        _.each(content.roles.manager.users, function(userId) {
            manage[userId] = manage[userId] || {'content': [], 'groups': [], 'discussions': []};
            if (!_.contains(content.roles.viewer.users, userId)) {
                manage[userId].content.push(model.idMapping.content[content.id]);
            }
        });
    });

    _.each(model.discussions, function(discussion) {
        _.each(discussion.roles.manager.users, function(userId) {
            manage[userId] = manage[userId] || {'content': [], 'groups': [], 'discussions': []};
            if (!_.contains(discussion.roles.member.users, userId)) {
                manage[userId].discussions.push(model.idMapping.discussions[discussion.id]);
            }
        });
    });

    _.each(manage, function(managed, userId) {
        var numContent = managed.content.length;
        var numGroups = managed.groups.length;
        var numDiscussions = managed.discussions.length;
        var max = Math.max(Math.max(numContent, numGroups), numDiscussions);
        if (numContent > 0 && numGroups > 0 && numDiscussions > 0) {
            var user = model.users[userId];
            for (var i = 0; i < max; i++) {
                // Grab different permutations of managed groups, content and discussions
                rows.push([user.userid, user.password, managed.groups[i % numGroups], managed.content[i % numContent], managed.discussions[i % numDiscussions]]);
            }
        }
    });

    csvWriter.write('manage_resources', rows, callback);
};
