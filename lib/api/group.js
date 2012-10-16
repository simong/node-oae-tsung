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

/**
 * Load a group page.
 *
 * @param {Session}     session A Tsung session.
 * @param {String}      group   A variable that contains the group ID.
 */
var profile = module.exports.profile = function(session, group) {
    var tx = session.addTransaction('group_profile');
    tx.addRequest('GET', '/api/me');
    tx.addRequest('GET', '/api/group/' + group);
};

/**
 * Load the group members page
 *
 * @param {Session} session A Tsung session
 * @param {String}  group   A variable that contains the group ID.
 */
var members = module.exports.members = function(session, group) {
    var tx = session.addTransaction('group_members');
    tx.addRequest('GET', '/api/me');
    tx.addRequest('GET', '/api/group/' + group + '/members');
};

/**
 * Load the library page of a group
 *
 * @param  {Session}    session A session
 * @param  {String}     group    A variable that represents the group id.
 */
var library = module.exports.library = function(session, group) {
    var tx = session.addTransaction('group_library');
    tx.addRequest('GET', '/api/me');
    tx.addRequest('GET', '/api/content/library/' + group);
};
