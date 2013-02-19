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
 * Logs the user in.
 * It will parse the response and expose the id of the logged in user in a
 * dynamic variable called `loggedin_user_id`
 *
 * @param  {Session}    session     A Tsung session.
 * @param  {String}     username    The name of the dynamic variable that will hold the username.
 * @param  {String}     password    The name of the dynamic variable that will hold the password.
 * @return {Object}                 An object that holds the new dynamic variables you can use in this session.
 *                                  In this case the key `id` will hold the variable that represents the principal ID
 *                                  of the currently logged in user.
 */
var login = module.exports.login = function(session, username, password) {
    // Create a new login transaction.
    var tx = session.addTransaction('login');

    // Login via POST
    var req = tx.addRequest('POST', '/api/auth/login', {'username': username, 'password': password});
    req.addDynamicVariable('loggedin_user_id', 'json', '$.id');
    
    return {
        'id': '%%_loggedin_user_id%%'
    };
};

/**
 * Loads the user profile.
 *
 * @param   {Session}   session The Tsung session
 * @param   {String}    userId  The ID variable of the user
 */
var profile = module.exports.profile = function(session, user) {
    var tx = session.addTransaction('user_profile');

    // load the basic profile, as well as the visibilities of additional sections that we can load
    tx.addRequest('GET', '/api/user/' + user);
};

/**
 * Load the library page of a user
 *
 * @param  {Session}    session A session
 * @param  {String}     user    A variable that represents the user id.
 */
var library = module.exports.library = function(session, user) {
    var tx = session.addTransaction('user_library');
    tx.addRequest('GET', '/api/me');
    tx.addRequest('GET', '/api/content/library/' + user);
};

/**
 * Loads the my memberships page for a user
 *
 * @param  {Session}    session A session
 * @param  {String}     user    A variable that represents the user id.
 */
var myMemberships = module.exports.myMemberships = function(session, user) {
    var tx = session.addTransaction('my_memberships');
    tx.addRequest('GET', '/api/me');
    tx.addRequest('GET', '/api/user/' + user + '/memberships');
};

/**
 * Logs the current user out.
 *
 * @param {Session} session A Tsung session
 */
var logout = module.exports.logout = function(session) {
    // Create a logout transaction.
    var tx = session.addTransaction('logout');

    // Logout via post.
    tx.addRequest('POST', '/api/auth/logout');
};
