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
var fs = require('fs');
var querystring = require('querystring');
var util = require('util');
var exec = require('child_process').exec;

var DEFAULT_MAX_USERS = 30000;

var Tsung = module.exports.Tsung = function(config) {
    var tsungStats = {};
    var clients = [];
    var servers = [];
    var phases = [];
    var sessions = [];
    var fileServers = [];
    var dynvarStrings = [];
    var dynvarNumbers = [];
    var uploadableFiles = {};
    var monitoring = config.monitoring;

    var that = {};

    /**
     * Adds a client that will be used to drive traffic from.
     * @param {String}  host                A hostname
     * @param {Boolean} [useControllerVm]   Whether to use the Erlang VM (Default: true)
     * @param {Number}  [maxUsers]          The maximum number of users that this test should create (Default: 30000)
     */
    that.addClient = function(host, useControllerVm, maxUsers) {
        useControllerVm = (useControllerVm === false) ? false : true;
        maxUsers = (isNaN(parseInt(maxUsers, 10))) ? DEFAULT_MAX_USERS : maxUsers;
        clients.push({'host': host, 'useControllerVm': useControllerVm, 'maxUsers': maxUsers});
    };

    /**
     * Adds a server that will be tested.
     * @param {String} host The hostname of the server to test.
     * @param {Number} port The port the server is running on. (Defaults to 80 if empty)
     */
    that.addServer = function(host, port) {
        port = (!port || isNaN(port)) ? 80 : port;
        servers.push({'host': host, 'port': port});
    };

    /**
     * Adds a loading phase.
     * @param {Number} duration     How long the phase should take in `unit`.
     * @param {String} unit         The unit that the `duration` value is expressed in.
     *                              One of `hour`, `minute` or `second`.
     * @param {Number} newUsers     The amount of users that should be added per `newUserUnit`
     * @param {String} newUsersUnit One of `hour`, `minute` or `second`.)
     */
    that.addPhase = function(duration, unit, newUsers, newUsersUnit) {
        phases.push({'id': phases.length+1, 'duration': duration, 'unit': unit, 'newUsers': newUsers, 'newUsersUnit': newUsersUnit});
    };

    /**
     * Adds a file server to the Tsung model
     * @param {String}      id          A unique id for this file server
     * @param {String}      path        The path to the file when the test runs
     * @param {String[]}    vars        The variables names (in column order) in the file
     * @param {String}      delimiter   The character that delimits the columns in the file (default `,`)
     * @param {String}      order       The order in which rows will be accessed from the file (one of `iter` or `random`)
     */
    that.addFileServer = function(id, path, vars, delimiter, order) {
        delimiter = delimiter || ',';
        order = order || 'random';

        fileServers.push({
            id: id,
            path: path,
            vars: vars,
            delimiter: delimiter,
            order: order
        });
    };

    /**
     * Adds a random string generator to the model
     * @param {String} name     The name of the variable in the test
     * @param {Number} length   The length of the string (default: 64)
     */
    that.addRandomStringGenerator = function(name, length) {
        length = length || 64;
        dynvarStrings.push({ name: name, length: length });
    };

    /**
     * Adds a random number generator to the model
     * @param {String} name     The name of the variable in the test
     * @param {Number} start    The lower bound of the number
     * @param {Number} end      The upper bound of the number
     */
    that.addRandomNumberGenerator = function(name, start, end) {
        dynvarNumbers.push({ name: name, start: start, end: end });
    };

    /**
     * There is no way to let tsung dynamically select files from a
     * folder or CSV. We add all the posibilities to the runner, so API calls
     * can be slightly cleaner.
     * @param {String} name     The name of the file that should be uploaded.
     * @param {String} path     The path to the file that holds the complete multipart POST request.
     * @param {String} boundary The boundary that is used in the file.
     */
    that.addUploadableFile = function(name, path, boundary) {
        uploadableFiles[name] = { path: path, boundary: boundary};
    };

    /**
     * @return {Object} The uploadable files.
     */
    that.getUploadableFiles = function() {
        return uploadableFiles;
    };

    /**
     * Create a new session.
     * @param {String} name        The name for this session.
     * @param {Number} probability The probability that this session will be executed.
     *                             Defaults to `100` if nothing is provided.
     */
    that.addSession = function(name, probability) {
        probability = probability || 100;
        var session = new Session(name, probability);
        sessions.push(session);
        return session;
    };

    /**
     * Generate a tsung compatible file. Note that the model is mutated after this. `toXml` should be
     * called at the very end and then the model should be discarded.
     *
     * @param {Function}    callback        Called when the process completes
     * @param {String}      callback.xml    The XML representation of this model
     */
    that.toXml = function(callback) {

        _convertModelForMustache();

        var data = {
            "dtdLocation": config.dtdLocation || '/opt/local/share/tsung/tsung-1.0.dtd',
            "logLevel": config.logLevel,
            "version": config.version,
            "dumpTraffic": config.dumpTraffic,
            "tsungStats": tsungStats,
            "clients": clients,
            "servers": servers,
            "monitoring": monitoring,
            "arrivalPhases": phases,
            "fileServers": fileServers,
            "dynvarStrings": dynvarStrings,
            "dynvarNumbers": dynvarNumbers,
            "sessions": sessions
        };

        // Proces the JST template into the Tsung XML file
        var filename = __dirname + '/../templates/tsung.jst';
        fs.readFile(filename, {'encoding': 'utf8'}, function(err, template) {
            // In node 0.8.x, this will come back as a buffer (because the 2nd param would need to be 'utf8', not an object)
            if (!_.isString(template)) {
                template = template.toString();
            }

            return callback(_.template(template, data));
        });
    };

    /**
     * Converts the Tsung model into something that can be used by Mustache to template the Tsung XML file. This
     * permamently modifies the state of the model.
     */
    var _convertModelForMustache = function() {
        var i = 0;
        var j = 0;

        // Transform the sessions so they hold variable data
        _.each(sessions, function(session) {

            // Encode and flatten the querystrings for all request contents
            _.each(session.actions, function(action) {

                // An action can be a transaction or a thinktime. Only transactions contain requests.
                if (action.type === 'transaction') {

                    // Drill down into the requests
                    _.each(action.requests, function(request) {

                        // A request can be an if statement or a request
                        if (request.type === 'request') {
                            request.formatContent(session);
                        } else if (request.type === 'if') {

                            // Drill down into the requests within the if statement
                            _.each(request.requests, function(request) {
                                request.formatContent(session);
                            });
                        }
                    });
                }
            });
        });

        // generate the stats model so it can be reported in the tsung.xml file
        tsungStats = {
            weightedAverageRequestsPerSecond: 0,
            weightedAverageSessionLength: 0,
            maxSessionLength: 0,
            transactionScores: []
        };

        var transactionScore = {};
        var totalTransactionScore = 0;

        _.each(sessions, function(session) {
            var thinkTime = 0;
            var numRequests = 0;
            _.each(session.actions, function(action) {
                if (action.type === 'think') {
                    thinkTime += action.seconds;
                } else if (action.type === 'transaction') {

                    // Add the session weight to the score of this transaction
                    transactionScore[action.name] = transactionScore[action.name] || 0;
                    transactionScore[action.name] += session.probability;
                    totalTransactionScore += session.probability;

                    _.each(action.requests, function(request) {
                        if (request.type === 'request') {
                            numRequests++;
                        } else if (request.type === 'if') {
                            numRequests += request.requests.length;
                        }
                    });
                }
            });

            // Aggregate stats onto the session
            session.requests = numRequests;
            session.totalThink = thinkTime;
            session.requestsPerSecond = numRequests/thinkTime;

            // Aggregate how many requests per second this session will contribute with its portion of 100 concurrent users
            tsungStats.weightedAverageRequestsPerSecond += (session.probability/100)*session.requestsPerSecond;
            tsungStats.weightedAverageSessionLength += (session.probability/100)*session.totalThink;
            tsungStats.maxSessionLength = Math.max(tsungStats.maxSessionLength, session.totalThink);
        });

        // Normalize the transaction scores into percentages
        Object.keys(transactionScore).forEach(function(txName) {
            var score = transactionScore[txName];
            tsungStats.transactionScores.push({'name': txName, 'score': (score / totalTransactionScore) * 100});
        });
        tsungStats.transactionScores.sort(function(a, b) { return b.score - a.score; });
    };

    return that;
};

var Session = function(name, probability) {
    var that = {};
    that.actions = [];
    that.name = name;
    that.probability = probability;

    /**
     * Create a new transaction.
     *
     * @param  {String} name The name of your transaction.
     * @return {Transaction} Returns a transactions where you can attach requests on.
     */
    that.addTransaction = function(name) {
        var transaction = new Transaction(name);
        that.actions.push(transaction);
        return transaction;
    };

    /**
     * Add some thinktime.
     *
     * @param  {Number}  seconds  The number of seconds that we should wait before firing the next request.
     * @param  {Boolean} isRandom Whether or not the thinktime should be randomized.
     *                            If set to true, the thinktime will have a mean of `seconds`.
     */
    that.think = function(seconds, isRandom) {
        isRandom = isRandom || true;
        that.actions.push({'type': 'think', 'seconds': seconds, 'isRandom': isRandom});
    };

    return that;
};

var Transaction = function(name) {
    var that = {};
    that.type = 'transaction';
    that.name = name;
    that.requests = [];
    that.push = false;

    /**
     * Add a request to this transaction.
     * @param {String}          method          An HTTP Method
     * @param {String}          url             The absolute path to fire the request to
     * @param {Object|String}   [data]          An optional data object or string if you're POSTing data. Passing in an object will result in a regular POST, passing in a string will assume it's a path to a file which holds a proper multipart request.
     */
    that.addRequest = function(method, url, data) {
        data = data || {};
        var request = new Request(method, url, data);
        that.requests.push(request);
        return request;
    };

    that.addWebsocketMessage = function(message) {
        var websocketMessage = new WebsocketMessage(message);
        that.requests.push(websocketMessage);
        return websocketMessage;
    };

    that.addIfStatement = function(ifVar, ifEq) {
        var ifStatement = new IfStatement(ifVar, ifEq);
        that.requests.push(ifStatement);
        return ifStatement;
    };

    return that;
};

var messages = 0;

var WebsocketMessage = function(message) {
    messages++;
    // See https://github.com/LearnBoost/socket.io-spec
    var msgType = '3';
    try {
        JSON.parse(message);
        msgType = '4';;
    } catch (ex) {}
    var that = {};
    that.type = 'websocket';
    var str = msgType + ':' + messages + '::' + message;
    that.message = str;
    return that;
};

var IfStatement = function(ifVar, ifEq) {
    var that = {};
    that.type = 'if';
    that.ifVar = ifVar;
    that.ifEq = ifEq;
    that.requests = [];

    that.addRequest = function(method, url, data) {
        data = data || {};
        var request = new Request(method, url, data);
        that.requests.push(request);
        return request;
    };

    return that;
};

var Request = function(method, url, data, referer) {
    var that = {};
    that.type = 'request';
    that.method = method;
    that.url = url;
    that.data = data;
    that.referer = (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD' && !referer) ? '/' : referer;
    that.variables = [];
    that.subst = false;

    /**
     * Allows capturing of some response data in a variable.
     *
     * @param {String} name       The variable name.
     * @param {String} type       The variable type. One of `json`, `xpath`, `regexp`, `re`, `psql`
     * @param {String} expression A valid expression to capture data.
     */
    that.addDynamicVariable = function(name, type, expression) {
        that.variables.push(new DynamicRequestVariable(name, type, expression));
    };

    that.formatContent = function(session) {
        that.subst = (that.url.indexOf('%%_') > 0 || (that.data && JSON.stringify(that.data).indexOf('%%_') > 0) || that.variables.length > 0);

        if (typeof data === 'object') {
            // serialize the content. If we are doing variable substitutions, then '%%' needs to be deserialized
            var content = querystring.stringify(that.data, '&amp;');
            if (that.subst) {
                content = content.replace(/%25%25/g, '%%');
            }

            // for POST requests, we put the data in a content object, otherwise (GET) we append to the query string.
            if (method === 'POST') {
                that.content = content;
            } else {
                that.url = that.url + '?' + content;
            }
        } else if (typeof data === 'string' && method === 'POST') {
            var path = session.uploadablefiles[data].path;
            var boundary = session.uploadablefiles[data].boundary;
            var contentType = 'multipart/form-data; boundary=' + boundary;
            that.from_file = {
                "path": path,
                "type": contentType
            };
        }
    };

    return that;
};

var DynamicRequestVariable = function(name, type, expression) {
    var that = {};
    that.attr = '';
    that.name = name;
    that.type = type;
    that.expression = expression;
    if (type === 'json') {
        that.attr = 'jsonpath';
    } else if (type === 'xpath') {
        that.attr = 'xpath';
    } else if (type === 'regexp') {
        that.attr = 'regexp';
    } else if (type === 're') {
        that.attr = 're';
    } else if (type === 'psql') {
        that.attr = 'pgsql_expr';
    }
    return that;
};
