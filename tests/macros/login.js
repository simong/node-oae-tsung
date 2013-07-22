/*
 * Copyright 2013 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
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
 * Utility method that simulates a user visiting the site, logging in. This does not take care of redirecting
 * the user to any target page
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     username    The local username of the user authenticating
 * @param  {String}     password    The local password of the user authenticating
 * @param  {Object}					An object with field `id`, which is the id of the user that was authenticated
 */
var visitLogin = module.exports.visitLogin = function(session, username, password) {
	Explore.load(session);
	var currentUser = Container.loginLocal(session, username, password);
	return currentUser;
};

/**
 * Utility method that simulates a user visiting the site, logging in, and being redirected to their activity feed
 *
 * @param  {Session}    session     The Tsung session
 * @param  {String}     username    The local username of the user authenticating
 * @param  {String}     password    The local password of the user authenticating
 * @param  {Object}					An object with field `id`, which is the id of the user that was authenticated
 */
var visitLoginRedirect = module.exports.visitLoginRedirect = function(session, username, password) {
	var currentUser = visitLogin(session, username, password);
	User.activity(session, currentUser.id, {'pageLoad': true});
	return currentUser;
};