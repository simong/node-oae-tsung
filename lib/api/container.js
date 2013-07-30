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

var Explore = require('./explore');
var Search = require('./search');
var User = require('./user');

/**
 * User clicks the "Home" icon in the application container. This requires that an authentication has
 * happened using `loginLocal` so that the `current_user_id` variable is set in the session.
 *
 * @param  {Session}    session     A Tsung session
 */
var home = module.exports.home = function(session) {
    // Clicking home takes the current user to their activity dashboard
    return User.activity(session, '%%_current_user_id%%', {'pageLoad': true});
};

/**
 * Open the notification feed for the current user in the top container pane.
 *
 * @param  {Session}    session     The Tsung user session
 */
var notifications = module.exports.notifications = function(session) {
	var tx = session.addTransaction('notifications');
	tx.addRequest('POST', '/api/notifications/markRead');
	_notificationsRequest(tx, null);
};

/**
 * Scroll down in the user notifications feed.
 *
 * @param  {Session}    session     A Tsung session
 * @param  {String}     start       The starting point of the scroll
 */
var notificationsScroll = module.exports.notificationsScroll = function(session) {
    var tx = session.addTransaction('notifications_scroll');
    _notificationsRequest(tx);
};

/**
 * The user clicks the center OAE logo in the top container pane
 *
 * @param  {Session}    session     The Tsung session
 */
var oae = module.exports.oae = function(session) {
    // The link simply sends them to the explore page
    return Explore.load(session);
};

/**
 * The user executes a search request from the top container pane
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     [q]         The query the user had typed in
 * @return {Object}                 An object with field `scroll` which is a function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var search = module.exports.search = function(session, q) {
    // Searching simply sends the user to the search page with the query
    return Search.search(session, q, null, {'pageLoad': true});
};

/**
 * The user logs in using a local login.
 *
 * @param  {Session}    session     A Tsung session.
 * @param  {String}     username    The username of the user logging in
 * @param  {String}     password    The password the user uses to log in
 * @return {Object}                 An object with key `id` whose value can be used for the user id of the currently authenticated user
 */
var loginLocal = module.exports.loginLocal = function(session, username, password) {
    var tx = session.addTransaction('container_login_local');
    var userIdVar = 'current_user_id';
    session.loggedIn = true;

    var req = tx.addRequest('POST', '/api/auth/login', {'username': username, 'password': password});
    req.addDynamicVariable(userIdVar, 'json', '$.id');
    return {'id': '%%_' + userIdVar + '%%'};
};

/**
 * The user logs out of the application
 *
 * @param  {Session}    session     The Tsung session
 */
var logout = module.exports.logout = function(session) {
    var tx = session.addTransaction('container_logout');
    tx.addRequest('POST', '/api/auth/logout');
};

/**
 * Request the notifications starting start the `start` parameter.
 *
 * @param  {Transaction}    tx          The transaction to which to bind the notification request
 * @param  {String}         [start]     The starting point of the notification scrolling. If `null`, will start from the most recent, otherwise will start from the last known scroll point
 * @api private
 */
var _notificationsRequest = function(tx, start) {
    var nextPageTokenVar = 'notifications_scroll_next_start';

	var opts = {'limit': 10};
	if (start) {
		opts.start = start;
	} else if (start === undefined) {
        opts.start = '%%_' + nextPageTokenVar + '%%';
    }

	var notificationsRequest = tx.addRequest('GET', '/api/notifications', opts);
    notificationsRequest.addDynamicVariable(nextPageTokenVar, 'json', '$.items[9].published');
};
