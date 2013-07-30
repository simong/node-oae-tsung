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
var util = require('util');

/**
 * Load the activity dashboard for a user or group
 *
 * @param  {String}     type            The type of activity dashboard to load. Either user or group
 * @param  {Session}    session         A Tsung session.
 * @param  {String}     resourceId      The id of the resource whose activity feed to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not this transaction happened with a fresh page load. Default: `false`
 * @return {Object}                     An object containing field `nextStart` which determines what value can be used for the `start` parameter in future activityScroll requests
 */
var activity = module.exports.activity = function(type, session, resourceId, opts) {
    opts = opts || {};

    // E.g. txId: 'group_activity', 'group_activity_load', 'user_activity', 'user_activity_load'
    var txId = type + '_activity';
    if (opts.pageLoad) {
        txId += '_load';
    }

    var tx = session.addTransaction(txId);
    if (opts.pageLoad) {
        addResourcePageLoadRequests(type, tx, resourceId);
    }

    return {'nextStart': _activitiesRequest(type, tx, resourceId, null)};
};

/**
 * Scroll activities downward on the bottom of the activity page
 *
 * @param  {String}     type        The type of resource whose activities to scroll. Either user or group
 * @param  {Session}    session     A Tsung session
 * @param  {String}     resourceId  The id of the group whose activities we're scrolling
 * @param  {String}     [start]     The starting activity from which to scroll. If `null`, will start from the beginning. If `undefined` will start from previously expected start value
 * @return {Object}                 An object containing field `nextStart` which determines what value can be used for the `start` parameter in future activityScroll requests
 */
var activityScroll = module.exports.activityScroll = function(type, session, resourceId, start) {
    // E.g., 'user_activity_scroll'
    var tx = session.addTransaction(type + '_activity_scroll');
    return {'nextStart': _activitiesRequest(type, tx, resourceId, start)};
};

/**
 * Load a content or discussion library, depending on the provided `libraryType`.
 *
 * @param  {String}     resourceType    The type of resource for which to load the library. Either user or group
 * @param  {String}     libraryType     The type of library to load. Either content or discussion
 * @param  {Session}    session         The Tsung user session
 * @param  {String}     resourceId      The id of the resource whose library to load
 * @param  {Object}     [opts]          Optional parameters
 * @param  {Boolean}    [opts.pageLoad] Whether or not this transaction happened with a fresh page load. Default: `false`
 * @return {Object}                     An object with property `nextStart`, which specifies the `start` value that can be used for subsequent scroll requests for this type of library
 */
var library = module.exports.library = function(resourceType, libraryType, session, resourceId, opts) {
    opts = opts || {};

    // E.g., txId: 'user_discussion_library', 'group_content_library_load', ...
    var txId = util.format('%s_%s_library', resourceType, libraryType);
    if (opts.pageLoad) {
        txId += '_load';
    }

    var tx = session.addTransaction(txId);
    if (opts.pageLoad) {
        addResourcePageLoadRequests(resourceType, tx, resourceId);
    }

    return {'nextStart': _libraryRequest(resourceType, libraryType, tx, resourceId, null)};
};

/**
 * Scroll a content or discussion library, depending on the provided `type`.
 *
 * @param  {String}     resourceType    The type of resource for which to scroll the library. Either user or group
 * @param  {String}     libraryType     The type of library to scroll. Either content or discussion
 * @param  {Session}    session         The Tsung user session
 * @param  {String}     resourceId      The id of the resource whose library to scroll
 * @param  {String}     [start]         The starting item from which to scroll. If `null`, will start from the beginning. If `undefined` will start from previously expected start value
 * @return {Object}                     An object with property `nextStart`, which specifies the `start` value that can be used for subsequent scroll requests for this type of library
 */
var libraryScroll = module.exports.libraryScroll = function(resourceType, libraryType, session, resourceId, start) {
    // E.g., tx id: 'group_content_library_scroll', 'user_discussion_library_scroll', ..
    var tx = session.addTransaction(util.format('%s_%s_library_scroll', resourceType, libraryType));
    return {'nextStart': _libraryRequest(resourceType, libraryType, tx, resourceId, start)};
};

/**
 * Search a content or discussion library, depending on the provided `type`.
 *
 * @param  {String}     resourceType    The type of resource for which to search the library. Either user or group
 * @param  {String}     libraryType     The type of library to search for the resource. Either content or discussion
 * @param  {Session}    session         The Tsung user session
 * @param  {String}     resourceId      The id of the resource whose library to search
 * @param  {String}     [q]             The search query. Default: *
 * @return {Object}                     An object with field `scroll` which is a function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var librarySearch = module.exports.librarySearch = function(resourceType, libraryType, session, resourceId, q) {
    var tx = session.addTransaction(util.format('%s_%s_library_search', resourceType, libraryType));

    var searchType = util.format('%s-library', libraryType);
    var searchOpts = {'limit': 12};
    if (q) {
        searchOpts.q = q;
    }

    return addSearchRequests(session, tx, searchType, [resourceId], searchOpts);
};

/**
 * Load a resource profile of the given `type`
 *
 * @param  {String}     type        The type of resource profile, one of content or discussion
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  The id of the resource whose profile to load
 * @return {Object}                 An object with field `nextStart`, whose value indicates the `start` parameter that can be used for future `messagesScroll` requests
 */
var profile = module.exports.profile = function(type, session, resourceId) {
    var tx = session.addTransaction(util.format('%s_profile_load', type));
    addResourcePageLoadRequests(type, tx, resourceId);
    return {'nextStart': addResourceMessagesRequests(type, tx, resourceId, null)};
};

/**
 * Scroll the messages of a resource
 *
 * @param  {String}     type        The type of resource whose messages to scroll. One of content or discussion
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  The id of the resource whose messages to scroll
 * @param  {String}     [start]     From where to start scrolling messages. If `null`, will start from the beginning. If `undefined` will start from previously expected start value
 * @return {Object}                 An object with field `nextStart`, whose value indicates the `start` parameter that can be used for future `messagesScroll` requests
 */
var messagesScroll = module.exports.messagesScroll = function(type, session, resourceId, start) {
    var tx = session.addTransaction(util.format('%s_messages_scroll', type));
    return {'nextStart': addResourceMessagesRequests(type, tx, resourceId, start)};
};

/**
 * Post a message to a resource
 *
 * @param  {String}     type        The type of resource to which to post the message. One of content or discussion
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  The id of the resource to which to post the message
 * @param  {String}     [body]      The body of the message. Defaults to a random long string
 * @param  {String}     [replyTo]   The `created` timestamp of the message being replied to, if any
 * @return {Object}                 An object containing field `created`, whose value is the created timestamp of the message
 */
var messagesPost = module.exports.messagesPost = function(type, session, resourceId, body, replyTo) {
    body = body || '%%_random_string_long%%';
    var opts = {'body': body};
    if (replyTo) {
        opts.replyTo = replyTo;
    }

    var messageCreatedVar = util.format('%s_message_created', type);

    var tx = session.addTransaction(util.format('%s_post_message', type));
    var req = tx.addRequest('POST', util.format('/api/%s/%s/messages', type, resourceId), opts);
    req.addDynamicVariable(messageCreatedVar, 'json', '$.created');
    return {'created': '%%' + messageCreatedVar + '%%'};
};

/**
 * Load the manage access pane of a resource
 *
 * @param  {String}     type        The type of resource. One of discussion, content, group
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  the id of the resource whose access to manage
 * @return {Object}                 An object containing field `nextStart`, whose value you can use in subsequent requests to membersScroll
 */
var manageAccess = module.exports.manageAccess = function(type, session, resourceId) {
    var tx = session.addTransaction(util.format('%s_manage_access', type));
    return {'nextStart': addResourceMembersRequests(type, tx, resourceId)};
};

/**
 * Scroll the members of a resource
 *
 * @param  {String}     type        The type of resource whose members to scroll. One of discussion, content, group
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  The id of the resource whose members to scroll
 * @param  {String}     [start]     From where to start scrolling members. If `null`, will start from the beginning. If `undefined` will start from previously expected start value
 * @return {Object}                 An object with field `nextStart`, whose value indicates the `start` parameter that can be used for future `membersScroll` requests
 */
var membersScroll = module.exports.membersScroll = function(type, session, resourceId, start) {
    var tx = session.addTransaction(util.format('%s_members_scroll', type));
    return {'nextStart': addResourceMembersRequests(type, tx, resourceId, start)};
};

/**
 * Perform the "update" command in the manage access pane for a resource
 *
 * @param  {String}     type            The type of resource. One of discussion, content, group
 * @param  {Session}    session         The Tsung session
 * @param  {String}     resourceId      The id of the resource whose access to update
 * @param  {String}     [visibility]    The new visibility of the resource. Default: visibility will not be updated
 * @param  {Object}     [members]       The changes to apply to the members. The key is the memberId and the value is assigned role, or `false` to remove them. Default: Members will not be updated
 */
var manageAccessUpdate = module.exports.manageAccessUpdate = function(type, session, resourceId, visibility, members) {
    var tx = session.addTransaction(util.format('%s_manage_access_update', type));

    // Update the visibility if specified
    if (visibility) {
        tx.addRequest('POST', util.format('/api/%s/%s', type, resourceId), {'visibility': visibility});
    }

    // Update the members if specified
    if (members) {
        tx.addRequest('POST', util.format('/api/%s/%s/members', type, resourceId), members);
    }
};

/**
 * Perform the "update" command in the details pane for a resource
 *
 * @param  {String}     type        The type of resource to update
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  The id of the resource to update
 * @param  {Object}     fields      The fields to update
 */
var detailsUpdate = module.exports.detailsUpdate = function(type, session, resourceId, fields) {
    var tx = session.addTransaction(util.format('%s_details_update', type));
    tx.addRequest('POST', util.format('/api/%s/%s', type, resourceId), fields);
};

/**
 * Search for a user or group to add as a member / share with some resource. If `iterations` is specified, this method will
 * actually append a number of transactions onto the session for each type-ahead transaction while the user types. The default
 * is 3 which seems like a reasonable average after some testing. In general, it might be a good idea to include 1 iteration
 * per 2 characters you would expect the user to type into the search field.
 *
 * The method will also insert thinktimes as necessary to simulate the delays in searches that may go according
 * user typing.
 *
 * @param  {Session}    session         The Tsung session
 * @param  {String}     [q]             The search term that represents the final value typed by the user. Default: %%_search_term_30%%
 * @param  {Number}     [iterations]    The number of typing iterations the user should go through while typing. Default: 3
 */
var searchMemberAutosuggest = module.exports.searchMemberAutosuggest = function(session, q, iterations) {
    q = q || '%%_search_term_30%%';
    iterations = iterations || 3;

    var opts = null;
    var tx = null;

    for (var i = 1; i <= iterations; i++) {

        // For each iteration, we use the same query "q" value. We can't *actually* chop it up into sections because we don't know what it is
        // until runtime. This should be good enough.
        opts = {
            'limit': 10,
            'q': q,
            'resourceTypes': ['user', 'group'],
            'includeExternal': true
        };

        tx = session.addTransaction('search_share_autosuggest');
        tx.addRequest('GET', '/api/search/general', opts);

        // A mean of 1 second thinktime is too much. Lets do 1 thinktime for every 2 iterations and make it somewhat randomized.
        // Also do not put a think after the last search.
        if ((i % 2) === 0 && i !== iterations) {
            session.think(1, true);
        }
    }
};

/**
 * Share a resource with one or more others
 *
 * @param  {String}     type        The type of resource being shared. One of discussion or content
 * @param  {Session}    session     The Tsung session
 * @param  {String}     resourceId  The id of the resource being shared
 * @param  {String[]}   memberIds   The ids of the members with which to share the resource
 */
var share = module.exports.share = function(type, session, resourceId, memberIds) {
    // If it's a content item, we assign "viewers" as the parameters. For others (e.g., discussions) it is "members"
    var shareRole = (type === 'content') ? 'viewers' : 'members';
    var shareOpts = {};
    shareOpts[shareRole] = memberIds;

    var tx = session.addTransaction(util.format('%s_share', type));
    tx.addRequest('POST', util.format('/api/%s/%s/share', type, resourceId), shareOpts);
};

/**
 * Add the common requests required when listing members of a resource (e.g., discussion, content, group)
 *
 * @param  {String}         type            The type of resource, one of discussion, content, group
 * @param  {Transaction}    tx              The transaction to which to bind the requests
 * @param  {String}         resourceId      The id of the resource for which to request members
 * @param  {String}         [start]         On which element to start listing members. Default: lists from the start
 * @return {String}                         The value that can be used for the `start` parameter to scroll subsequent members requests of this type
 */
var addResourceMembersRequests = module.exports.addResourceMembersRequests = function(type, tx, resourceId, start) {
    var nextPageTokenVar = util.format('%s_members_scroll_next_start', type);

    var opts = {'limit': 8};
    if (start) {
        opts.start = start;
    } else if (start === undefined) {
        opts.start = '%%_' + nextPageTokenVar + '%%';
    }

    var membersRequest = tx.addRequest('GET', util.format('/api/%s/%s/members', type, resourceId), opts);
    membersRequest.addDynamicVariable(nextPageTokenVar, 'json', '$.results[7].profile.id');
    return '%%_' + nextPageTokenVar + '%%';
};

/**
 * Add the common requests required when viewing the profile of some resource (e.g., user, discussion, content, group...)
 *
 * @param  {String}         type                The type of resource, one of user, discussion, content, group
 * @param  {Transaction}    tx                  The transaction to which to bind the requests
 * @param  {String}         resourceId          The id of the resource to load
 * @param  {Object}         [opts]              Optional parameters
 * @param  {Boolean}        [opts.hasMessages]  Whether or not the resource being loaded has messages on the main resource page. Default: `false`
 * @param  {Object}                             If the resource has messages, will be an object with field `nextStart` whose value can be used for subsequent `addResourceMessagesRequests` invocations for this resource
 */
var addResourcePageLoadRequests = module.exports.addResourcePageLoadRequests = function(type, tx, resourceId) {
    var req = tx.addRequest('GET', '/api/me');
    req.addDynamicVariable('current_user_signature_signature', 'json', '$.signature.signature');
    req.addDynamicVariable('current_user_signature_expires', 'json', '$.signature.expires');
    req.addDynamicVariable('current_user_tenant_alias', 'json', '$.tenant.alias');
    tx.push = true;
    tx.addRequest('GET', util.format('/api/%s/%s', type, resourceId));
};

/**
 * Add the common requests required when viewing the messages of a resource (e.g., discussion, content)
 *
 * @param  {String}         type        The type of resource whose messages to request. One of content or discussion
 * @param  {Transaction}    tx          The transaction to which to bind the requests
 * @param  {String}         resourceId  The id of the resource whose messages to request
 * @param  {String}         [start]     The starting point of the messages. Default: Starts from beginning
 * @return {String}                     The value that can be used for the `start` parameter to scroll subsequent messages requests of this type
 */
var addResourceMessagesRequests = module.exports.addResourceMessagesRequests = function(type, tx, resourceId, start) {
    var nextPageTokenVar = util.format('%s_messages_scroll_next_start', type);
    var opts = {'limit': 10};
    if (start) {
        opts.start = start;
    } else if (start === undefined) {
        opts.start = '%%_' + nextPageTokenVar + '%%';
    }

    var messagesRequest = tx.addRequest('GET', util.format('/api/%s/%s/messages', type, resourceId), opts);
    messagesRequest.addDynamicVariable(nextPageTokenVar, 'json', '$.results[9].threadKey');
    return '%%_' + nextPageTokenVar + '%%';
};

/**
 * Add the requests associated to a fresh page load of the general search page
 *
 * @param  {Transaction}    tx  The Tsung transaction on which to bind the request
 */
var addSearchPageLoadRequests = module.exports.addSearchPageLoadRequests = function(tx) {
    tx.addRequest('GET', '/api/me');
};

/**
 * Add a search request to the given transaction
 *
 * @param  {Session}        session         A Tsung session
 * @param  {Transaction}    tx              The transaction to which to bind the search request
 * @param  {String}         type            The search type (e.g., general)
 * @param  {String[]}       [params]        The params according to the particular search type. Default: No params
 * @param  {Object}         [opts]          Any additional options that can be used by the search type
 * @return {Object}                         An object with field `scroll` which is a function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var addSearchRequests = module.exports.addSearchRequests = function(session, tx, type, params, opts) {
    opts = opts || {};
    opts.limit = opts.limit || 12;

    var url = util.format('/api/search/%s', type);
    if (params && params.length > 0) {
        url += util.format('/%s', params.join('/'));
    }

    tx.addRequest('GET', url, opts);

    return {'scroll': _scroller(session, type, params, opts)};
};

/**
 * Create an activity request on the transaction.
 *
 * @param  {String}         type            The type of resource whose activity feed to load, either group or user
 * @param  {Transaction}    tx              The transaction on which to create the request
 * @param  {String}         resourceId      The id of the group whose activity feed to request
 * @param  {String}         [start]         The starting point of the page of activities. If `null`, will start from the beginning. If `undefined` will start from previously expected start value
 * @return {String}                         The value that can be used to reference the next `start` value for the next page of activities
 * @api private
 */
var _activitiesRequest = function(type, tx, resourceId, start) {
    var nextPageTokenVar = type + '_activity_scroll_next_start';
    var opts = {'limit': 10};
    if (start) {
        opts.start = start;
    } else if (start === undefined) {
        opts.start = '%%_' + nextPageTokenVar + '%%';
    }

    var activitiesRequest = tx.addRequest('GET', '/api/activity/' + resourceId, opts);
    activitiesRequest.addDynamicVariable(nextPageTokenVar, 'json', '$.results[9].published');
    return '%%_' + nextPageTokenVar + '%%';
};

/**
 * Create a library request on the transaction.
 *
 * @param  {String}         resourceType    The type of resource whose library to load, either group or user
 * @param  {String}         libraryType     The type of library to load. Either content or discussion
 * @param  {Transaction}    tx              The transaction on which to create the request
 * @param  {String}         libraryId       The id of the resource whose library to fetch
 * @param  {String}         [start]         The starting point of the page of library items. If `null`, will start from the beginning. If `undefined` will start from previously expected start value
 * @return {String}                         The value that can be used to reference the next `start` value for the next page of library items
 * @api private
 */
var _libraryRequest = function(resourceType, libraryType, tx, libraryId, start) {
    var nextPageTokenVar = util.format('%s_%s_library_scroll_next_start', resourceType, libraryType);
    var opts = {'limit': 12};
    if (start) {
        opts.start = start;
    } else if (start === undefined) {
        opts.start = '%%_' + nextPageTokenVar + '%%';
    }

    var libraryRequest = tx.addRequest('GET', util.format('/api/%s/library/%s', libraryType, libraryId), opts);
    libraryRequest.addDynamicVariable(nextPageTokenVar, 'json', '$.nextToken');
    return '%%_' + nextPageTokenVar + '%%';
};

/**
 * Returns a function that will scroll a previous search request.
 *
 * @param  {Session}    session         A Tsung session
 * @param  {String}     type            The search type (e.g., general)
 * @param  {String[]}   [params]        The params according to the particular search type. Default: No params
 * @param  {Object}     [opts]          Any additional options that can be used by the search type
 * @return {Function}                   A function that, when invoked with no params, will simply create a new transaction against the session that gets the next page of results
 */
var _scroller = function(session, type, params, opts) {
    opts.from = opts.from || 0;
    opts.limit = opts.limit || 12;
    return function() {

        // Increment the from offset to the next page
        opts = _.extend({}, opts);
        opts.from += opts.limit;

        var tx = session.addTransaction(util.format('search_%s_scroll', type.replace(/-/g, '_')));
        addSearchRequests(session, tx, type, params, opts);
    };
};
