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

var _ = require('underscore');

var ApiUtil = require('../../lib/api/util');
var Container = require('../../lib/api/container');
var Content = require('../../lib/api/content');
var Group = require('../../lib/api/group');
var Discussion = require('../../lib/api/discussion');
var Search = require('../../lib/api/search');
var User = require('../../lib/api/user');

/**
 * A macro that uses search to track down a group
 *
 * @param  {Session}    session         The Tsung session
 * @param  {Boolean}    pageLoad        Whether or not the visit to the search page is a page load. Default: `true`
 * @param  {Number}     scrollPages     How many pages it takes to find the group (including the initial page load). Default: 1
 * @return {Object}                     An object with field `scroll`, which is a function that, when invoked with no parameters, will add a transaction to the session that scrolls the next page of items
 */
var searchGroup = module.exports.searchGroup = function(session, pageLoad, scrollPages) {
    return _searchResource('group', session, pageLoad, scrollPages);
};

/**
 * A macro that uses search to track down a content item
 *
 * @param  {Session}    session         The Tsung session
 * @param  {Boolean}    pageLoad        Whether or not the visit to the search page is a page load. Default: `true`
 * @param  {Number}     scrollPages     How many pages it takes to find the content item (including the initial page load). Default: 1
 * @return {Object}                     An object with field `scroll`, which is a function that, when invoked with no parameters, will add a transaction to the session that scrolls the next page of items
 */
var searchContent = module.exports.searchContent = function(session, pageLoad, scrollPages) {
    return _searchResource('content', session, pageLoad, scrollPages);
};

/**
 * A macro that uses search to track down a user
 *
 * @param  {Session}    session         The Tsung session
 * @param  {Boolean}    pageLoad        Whether or not the visit to the search page is a page load. Default: `true`
 * @param  {Number}     scrollPages     How many pages it takes to find the user (including the initial page load). Default: 1
 * @return {Object}                     An object with field `scroll`, which is a function that, when invoked with no parameters, will add a transaction to the session that scrolls the next page of items
 */
var searchUser = module.exports.searchUser = function(session, pageLoad, scrollPages) {
    return _searchResource('user', session, pageLoad, scrollPages);
};

/**
 * A macro that uses search to track down a discussion
 *
 * @param  {Session}    session         The Tsung session
 * @param  {Boolean}    pageLoad        Whether or not the visit to the search page is a page load. Default: `true`
 * @param  {Number}     scrollPages     How many pages it takes to find the discussion (including the initial page load). Default: 1
 * @return {Object}                     An object with field `scroll`, which is a function that, when invoked with no parameters, will add a transaction to the session that scrolls the next page of items
 */
var searchDiscussion = module.exports.searchDiscussion = function(session, pageLoad, scrollPages) {
    return _searchResource('discussion', session, pageLoad, scrollPages);
};

/**
 * A macro that uses search to track down a resource of some type
 *
 * @param  {String}     resourceType    The type of resource we're looking for
 * @param  {Session}    session         The Tsung session
 * @param  {Boolean}    pageLoad        Whether or not the visit to the search page is a page load. Default: `true`
 * @param  {Number}     scrollPages     How many pages it takes to find the group (including the initial page load). Default: 1
 * @return {Object}                     An object with field `scroll`, which is a function that, when invoked with no parameters, will add a transaction to the session that scrolls the next page of items
 */
var _searchResource = function(resourceType, session, pageLoad, scrollPages) {
    pageLoad = (pageLoad === true);
    scrollPages = scrollPages || 1;

    Search.search(session, '%%_search_terms_30%%', null, {'pageLoad': pageLoad});
    session.think(6, true);

    // Select the resource type out of the list of resource types
    var scroller = Search.search(session, '%%_search_terms_30%%', [resourceType]);
    session.think(3, true);

    for (var i = 1; i < scrollPages; i++) {
        scroller.scroll();
        session.think(1, true);
    }

    return scroller;
};
