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

var Container = require('../../lib/api/container');
var Explore = require('../../lib/api/explore');
var User = require('../../lib/api/user');


/**
 * Utility method that simulates a user visiting the site, logging in, and being redirected to their activity feed
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     username    The local username of the user authenticating
 * @param  {String}     password    The local password of the user authenticating
 * @param  {Object}					An object with field `nextStart` whose value can be used as the `start` parameter when scrolling for more activities
 */
var visitLoginRedirect = module.exports.visitLoginRedirect = function(session, username, password) {
	// Visit the main landing page
	Explore.load(session);

	// Log in
	Container.loginLocal(session, username, password);

	// Redirected to activities
	return User.activity(session, '%%_current_user_id%%', {'pageLoad': true});
};