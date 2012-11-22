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

var MAX_DEPTH = 3;

// we need to artificially throttle the content access row permutations a bit, it can get crazy
var MAX_PERMUTATIONS_PER_CONTENT_DEPTH = 1;

var NUM_CONTENT_DEPTH_0 = 8;
var NUM_CONTENT_DEPTH_1 = 4;
var NUM_CONTENT_DEPTH_2 = 2;

var NUM_GROUP_DEPTH_0 = 4;
var NUM_GROUP_DEPTH_1 = 1;

/**
 * Generates CSV data that associates users to private resources to which they have access.
 *
 * @param {Number}      batchNum        The current batch number
 * @param {Object}      model           The basic source data model
 * @param {String}      outputDir       The directory to output the CSV files to
 * @param {Function}    callback        Callback function, invoked when the process completes
 * @param {Object}      callback.err    An error that occurred, if any
 */
module.exports = function(batchNum, model, outputDir, callback) {
    var done = 0;
    var monitorCsv = function(err) {
        if (err) {
            return callback(err);
        }

        done++;
        if (done === 2) {
            callback();
        }
    }

    _generatePrivateGroupAccessCsv(batchNum, model, outputDir, monitorCsv);
    _generatePrivateContentAccessCsv(batchNum, model, outputDir, monitorCsv);
}

/**
 * Generate the CSV data that associates users to private groups to which they have access.
 *
 * @param {Number}      batchNum        The current batch number
 * @param {Object}      model           The basic source data model
 * @param {String}      outputDir       The directory to output the CSV files to
 * @param {Function}    callback        Callback function, invoked when the process completes
 * @param {Object}      callback.err    An error that occurred, if any
 */
var _generatePrivateGroupAccessCsv = function(batchNum, model, outputDir, callback) {
    var rows = [];
    var groups = model.groups;
    var userGroupAccessDepth = _buildUserGroupAccessDepth(model);

    // build the rows
    for (var userId in userGroupAccessDepth) {
        var groupAccessDepth = userGroupAccessDepth[userId];

        // make sure the user has enough data to be a candidate
        if (_meetsGroupDepthRequirements(groupAccessDepth)) {

            // aggregate different permutations of content and groups for the data file
            var groups0 = [];
            var groups1 = [];

            // iterate over depth 0 groups
            groupAccessDepth['0'].forEach(function(groupId0) {
                groups0.push(model.groups[groupId0].id);
                if (groups0.length === NUM_GROUP_DEPTH_0) {

                    // iterate over depth 1 groups
                    groupAccessDepth['1'].forEach(function(groupId1) {
                        groups1.push(model.groups[groupId1].id);
                        if (groups1.length === NUM_GROUP_DEPTH_1) {
                            // put together the user login info and group access by depth (0 and 1) into one row
                            var row = [model.idMapping['users'][userId], model.users[userId].userid, model.users[userId].password];
                            Array.prototype.push.apply(row, groups0);
                            Array.prototype.push.apply(row, groups1);
                            rows.push(row);

                            groups1 = [];
                        }
                    });

                    groups0 = [];
                }
            });
        }
    }

    var outputFile = outputDir + '/private_groups.csv';
    console.log('[private_groups.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
}

/**
 * Generate the CSV data that associates users to private content to which they have access.
 *
 * @param {Number}      batchNum        The current batch number
 * @param {Object}      model           The basic source data model
 * @param {String}      outputDir       The directory to output the CSV files to
 * @param {Function}    callback        Callback function, invoked when the process completes
 * @param {Object}      callback.err    An error that occurred, if any
 */
var _generatePrivateContentAccessCsv = function(batchNum, model, outputDir, callback) {
    var rows = [];
    var content = model.content;    
    var userContentAccessDepth = _buildUserContentAccessDepth(model);

    // build the rows
    for (var userId in userContentAccessDepth) {
        var contentAccessDepth = userContentAccessDepth[userId];

        // make sure the user has enough data to be a candidate
        if (_meetsContentDepthRequirements(contentAccessDepth)) {

            // aggregate different permutations of content and groups for the data file
            var content0 = [];

            // iterate over depth 0 content items
            contentAccessDepth['0'].forEach(function(contentId0) {
                content0.push(model.idMapping['content'][model.content[contentId0].id]);
                var content1 = [];

                if (content0.length === NUM_CONTENT_DEPTH_0) {
                    var permutations0 = 0;

                    // iterate over depth 1 content items
                    contentAccessDepth['1'].forEach(function(contentId1) {
                        content1.push(model.idMapping['content'][model.content[contentId1].id]);
                        var content2 = [];

                        if (content1.length === NUM_CONTENT_DEPTH_1 && permutations0 !== MAX_PERMUTATIONS_PER_CONTENT_DEPTH) {
                            permutations0++;

                            var permutations1 = 0;

                            // iterate over depth 2 content items
                            contentAccessDepth['2'].forEach(function(contentId2) {
                                content2.push(model.idMapping['content'][model.content[contentId2].id]);

                                if (content2.length === NUM_CONTENT_DEPTH_2 && permutations1 !== MAX_PERMUTATIONS_PER_CONTENT_DEPTH) {
                                    permutations1++;

                                    // put together the user login info and content access by depth (0, 1 and 2) into one row
                                    var row = [model.idMapping['users'][userId], model.users[userId].userid, model.users[userId].password];
                                    Array.prototype.push.apply(row, content0);
                                    Array.prototype.push.apply(row, content1);
                                    Array.prototype.push.apply(row, content2);
                                    rows.push(row);

                                    content2 = [];
                                }
                            });

                            content1 = [];
                        }
                    });

                    content0 = [];
                }
            });
        }
    }

    var outputFile = outputDir + '/private_content.csv';
    console.log('[private_content.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
}

/**
 * Determine whether or not the given user group depth meets the requirements needed for it to be part of a "private access" Tsung
 * Session. This will require a certain number of groups be available at different depths, so that all user sessions can be executed
 * deterministically.
 *
 * @param   {Object}    accessDepth     The access depth model of a user. @see #_buildUserGroupAccessDepth
 * @return  {Boolean}                   Whether or not the group depth model meets the requirements
 */
var _meetsGroupDepthRequirements = function(accessDepth) {
    var meetsAccessRequirements = accessDepth && accessDepth['0'] && accessDepth['1'] && accessDepth['0'].length >= NUM_GROUP_DEPTH_0
        && accessDepth['1'].length >= NUM_GROUP_DEPTH_1;

    return meetsAccessRequirements;
}

/**
 * Determine whether or not the given user content access depth model meets the requirements needed for it to be part of a
 * "private access" Tsung Session. This will require a certain number of groups be available at different depths, so that all
 * user sessions can be executed deterministically.
 *
 * @param   {Object}    accessDepth     The access depth model of a user for content. @see #_buildUserContentAccessDepth
 * @return  {Boolean}                   Whether or not the content depth model meets the requirements
 */
var _meetsContentDepthRequirements = function(accessDepth) {
    var meetsAccessRequirements = accessDepth && accessDepth['0'] && accessDepth['1'] && accessDepth['2']
        && accessDepth['0'].length >= NUM_CONTENT_DEPTH_0 && accessDepth['1'].length >= NUM_CONTENT_DEPTH_1 && accessDepth['2'].length >= NUM_CONTENT_DEPTH_2;

    return meetsAccessRequirements;
}

/**
 * Build a group access depth model that illustrates all the groups to which a user has access, and at what level of depth. The result
 * is an array of arrays of strings. The index of the outer array illustrates the membership depth, while the inner array holds the
 * groupIds to which the user is a member at the current depth.
 *
 * @param   {Object}        model   The basic content model
 * @return  {String[][]}            The group access depth model as described in the summary
 */
var _buildUserGroupAccessDepth = function(model) {
    var groups = model.groups;
    var groupAccessDepth = {};
    var userGroupAccessDepth = {};

    _.values(groups).forEach(function(group) {
        if (group.visibility === 'private') {
            groupAccessDepth[group.id] = [];
            _buildUserAccessForGroups(model, groupAccessDepth[group.id], [group.id], null, null, MAX_DEPTH);
        }
    });

    // invert the group access depth to be keyed by user
    for (var groupId in groupAccessDepth) {
        var access = groupAccessDepth[groupId];
        for (var depth = 0; depth < access.length; depth++) {
            access[depth].forEach(function(userId) {
                if (!userGroupAccessDepth[userId])
                    userGroupAccessDepth[userId] = {};
                if (!userGroupAccessDepth[userId][depth])
                    userGroupAccessDepth[userId][depth] = [];
                userGroupAccessDepth[userId][depth].push(groupId);
            });
        }
    }

    return userGroupAccessDepth;
}

/**
 * Build a content access depth model that illustrates all the content to which a user has access, and at what level of group
 * membership depth. The result is an array of arrays of strings. The index of the outer array illustrates the group depth, while
 * the inner array holds the content ids to which the user has access at the current depth.
 *
 * @param   {Object}        model   The basic content model
 * @return  {String[][]}            The content access depth model as described in the summary
 */
var _buildUserContentAccessDepth = function(model) {
    var content = model.content;
    var contentAccessDepth = {};
    var userContentAccessDepth = {};

    // we only care about private content
    _.values(content).forEach(function(contentItem) {
        if (contentItem.visibility === 'private') {
            contentAccessDepth[contentItem.id] = _buildAccessForContent(model, contentItem.id, MAX_DEPTH);
        }
    });

    // invert the content access depth to be keyed by user
    for (var contentId in contentAccessDepth) {
        var access = contentAccessDepth[contentId];
        for (var depth = 0; depth < access.length; depth++) {
            access[depth].forEach(function(userId) {
                if (!userContentAccessDepth[userId])
                    userContentAccessDepth[userId] = {};
                if (!userContentAccessDepth[userId][depth])
                    userContentAccessDepth[userId][depth] = [];
                userContentAccessDepth[userId][depth].push(contentId);
            });
        }
    }

    return userContentAccessDepth;
}

/**
 * Build the content access model for a content item. The result is an array of arrays of strings, where the index of the outer array
 * illustrates access depth, and the inner array holds the user ids that have access to the content item at that particular depth. This
 * is similar to #_buildUserContentAccessDepth, where the difference is that this model is inverted (keyed by content, users are the
 * values). This is a necessary intermediary step to generate the former. 
 *
 * @param   {Object}        model       The basic content model
 * @param   {String}        contentId   The id of the content item for which to build the model
 * @param   {Number}        maxDepth    The maximum depth we actually care about
 * @return  {String[][]}                The access depth model as described in the summary
 */
var _buildAccessForContent = function(model, contentId, maxDepth) {
    var access = [];

    // push the direct users as the first element (depth 0)
    access.push(_allUsers(model.content[contentId]));

    // push the member hierarchy for all groups
    _buildUserAccessForGroups(model, access, _allGroups(model.content[contentId]), {}, 0, maxDepth + 1);

    return access;
}

/**
 * Build the group access model for a collection of groups. The result is an array of arrays of strings, where the index of the outer
 * array illustrates access depth, and the inner array holds the user ids that have access to the group at that particular depth. This
 * is similar to #_buildUserGroupAccessDepth, where the difference is that this model is inverted (keyed by group, users are the
 * values). This is a necessary intermediary step to generate the former. The access model will be appended to the `access` array
 * parameter rather than be returned.
 *
 * @param   {Object}        model           The basic content model
 * @param   {String}        access          The group depth model will be appended to this access array, instead of being returned
 * @param   {String[]}      groupIds        The ids of the groups for which to build the model
 * @param   {Object}        visitedGroups   The groups that we've already search. This is an aggregated hashset to avoid redundant
 *                                          or infinite recursion
 * @param   {Number}        currDepth       The current depth of the recursive search
 * @param   {Number}        maxDepth        The maximum depth that we care about. We can quit when we hit it
 */
var _buildUserAccessForGroups = function(model, access, groupIds, visitedGroups, currDepth, maxDepth) {
    if (currDepth === maxDepth) {
        return;
    }

    visitedGroups = visitedGroups || {};

    _.extend(visitedGroups, groupIds);

    var nextGroups = [];
    var currUsers = [];

    _.each(groupIds, function(groupId) {
        // aggregate all users to the current depth
        currUsers = _.union(currUsers, _allUsers(model.groups[groupId]));
        nextGroups = _.union(nextGroups, _allGroups(model.groups[groupId]));
    });

    // push all users from this level of depth
    access.push(currUsers);

    // remove the groups that were already visited
    nextGroups = _.difference(nextGroups, _.keys(visitedGroups));

    // traverse deeper
    if (nextGroups.length > 0) {
        _buildUserAccessForGroups(model, access, nextGroups, visitedGroups, currDepth + 1, maxDepth);
    }

}

/**
 * Get all users (managers and viewers) from the given (group or content) item.
 *
 * @param   {Object}    item    The item, either a group or a content item.
 * @return  {String[]}          The user ids of users who have direct access to this item
 */
var _allUsers = function(item) {
    var managers = _managerUsers(item) || [];
    var viewers = _viewerUsers(item) || [];
    return _.union(managers, viewers);
}

/**
 * Get all groups (managers and viewers) from the given (group or content) item.
 *
 * @param   {Object}    item    The item, either a group or a content item.
 * @return  {String[]}          The group ids of groups who have direct access to this item
 */
var _allGroups = function(item) {
    var managers = _managerGroups(item) || [];
    var viewers = _viewerGroups(item) || [];
    return _.union(managers, viewers);
}

/**
 * Get all manager groups from the given (group or content) item.
 *
 * @param   {Object}    item    The item, either a group or a content item.
 * @return  {String[]}          The group ids of all groups that manage this item
 */
var _managerGroups = function(item) {
    if (item && item.roles && item.roles.manager) {
        return _.uniq(item.roles.manager.groups);
    }
}

/**
 * Get all viewer groups from the given (group or content) item.
 *
 * @param   {Object}    item    The item, either a group or a content item.
 * @return  {String[]}          The group ids of all groups that can view this item
 */
var _viewerGroups = function(item) {
    if (item && item.roles && item.roles.viewer) {
        return _.uniq(item.roles.viewer.groups);
    }
}

/**
 * Get all manager users from the given (group or content) item.
 *
 * @param   {Object}    item    The item, either a group or a content item.
 * @return  {String[]}          The user ids of all users that manage this item
 */
var _managerUsers = function(item) {
    if (item && item.roles && item.roles.manager) {
        return _.uniq(item.roles.manager.users);
    }
}

/**
 * Get all viewer users from the given (group or content) item.
 *
 * @param   {Object}    item    The item, either a group or a content item.
 * @return  {String[]}          The user ids of all users that can view this item
 */
var _viewerUsers = function(item) {
    if (item && item.roles && item.roles.viewer) {
        return _.uniq(item.roles.viewer.users);
    }
}

