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
var fs = require('fs');
var querystring = require('querystring');
var util = require('util');
var exec = require('child_process').exec;
var mu = require('mu2');

mu.root = __dirname + '/../templates';

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

    var that = {};

    /**
     * Adds a client that will be used to drive traffic from.
     * @param {String}  host            A hostname
     * @param {Boolean} useControllerVM Whether to use the Erlang VM
     * @param {Number}  maxUsers        The maximum number of users that this test should create.
     */
    that.addClient = function(host, useControllerVM, maxUsers) {
        clients.push({'host': host, 'useControllerVM': useControllerVM, 'maxUsers': maxUsers});
    };

    /**
     * Adds a server that will be tested.
     * @param {String} host The hostname of the server to test.
     * @param {Number} port The port the server is running on. (Defaults to 80 if empty)
     */
    that.addServer = function(host, port) {
        port = port || 80;
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
    }

    /**
     * Adds a random string generator to the model
     * @param {String} name     The name of the variable in the test
     * @param {Number} length   The length of the string (default: 64)
     */
    that.addRandomStringGenerator = function(name, length) {
        length = length || 64;
        dynvarStrings.push({ name: name, length: length });
    }

    /**
     * Adds a random number generator to the model
     * @param {String} name     The name of the variable in the test
     * @param {Number} start    The lower bound of the number
     * @param {Number} end      The upper bound of the number
     */
    that.addRandomNumberGenerator = function(name, start, end) {
        dynvarNumbers.push({ name: name, start: start, end: end });
    }

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
    }

    /**
     * @return {Object} The uploadable files.
     */
    that.getUploadableFiles = function() {
        return uploadableFiles;
    }

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

        var json = {
            "dtdlocation": config.dtdLocation || '/opt/local/share/tsung/tsung-1.0.dtd',
            "loglevel": config.logLevel,
            "version": config.version,
            "dumptraffic": config.dumpTraffic,
            "tsungStats": tsungStats,
            "client": clients,
            "server": servers,
            "arrivalphase": phases,
            "fileserver": fileServers,
            "dynvarstring": dynvarStrings,
            "dynvarnumber": dynvarNumbers,
            "session": sessions
        };

        var xml = '';
        mu.compileAndRender('tsung.mustache', json)
            .on('data', function (data) {
                xml += data.toString();
            })
            .on('end', function() {
                callback(xml);
            });
    };


    /**
     * Converts the Tsung model into something that can be used by Mustache to template the Tsung XML file. This
     * permamently modifies the state of the model.
     */
    var _convertModelForMustache = function() {

        // transform the fileserver variables
        for (var i = 0; i < fileServers.length; i++) {
            var fileServer = fileServers[i];
            var varNames = [];
            for (var j = 0; j < fileServer.vars.length; j++) {
                varNames.push({name: fileServer.vars[j]});
            }
            fileServer.vars = varNames;
        }

        // transform the sessions so they hold variable data
        for (var i = 0; i < sessions.length; i++) {
            var session = sessions[i]

            // bind the dynamic data to each session
            session.fileserver = fileServers;
            session.dynvarstring = dynvarStrings;
            session.dynvarnumber = dynvarNumbers;
            session.uploadablefiles = uploadableFiles;

            // encode and flatten the querystrings for all request contents
            for (var j = 0; j < session.actions.length; j++) {
                var action = session.actions[j];
                if (action.hasOwnProperty('requests')) {
                    for (var k = 0; k < action.requests.length; k++) {
                        action.requests[k].formatContent(session);
                    }
                }
            }
        }

        // generate the stats model so it can be reported in the tsung.xml file
        tsungStats = {
            weightedAverageRequestsPerSecond: 0,
            weightedAverageSessionLength: 0,
            maxSessionLength: 0
        };

        sessions.forEach(function(session) {
            var thinkTime = 0;
            var numRequests = 0;
            session.actions.forEach(function(action) {
                if (action.hasOwnProperty('seconds')) {
                    thinkTime += action.seconds;
                } else if (action.hasOwnProperty('requests')) {
                    numRequests += action.requests.length;
                }
            });

            // aggregate stats onto the session
            session.requests = numRequests;
            session.totalThink = thinkTime;
            session.requestsPerSecond = numRequests/thinkTime;

            // aggregate how many requests per second this session will contribute with its portion of 100 concurrent users
            tsungStats.weightedAverageRequestsPerSecond += (session.probability/100)*session.requestsPerSecond;
            tsungStats.weightedAverageSessionLength += (session.probability/100)*session.totalThink;
            tsungStats.maxSessionLength = Math.max(tsungStats.maxSessionLength, session.totalThink);
        });
    }

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
        that.actions.push({'seconds': seconds, 'isRandom': isRandom});
    };

    return that;
};

var Transaction = function(name) {
    var that = {};
    that.name = name;
    that.requests = [];

    /**
     * Add a request to this transaction.
     * @param {String}          method          An HTTP Method
     * @param {String}          url             The absolute path to fire the request to
     * @param {Object|String}   [data]          An optional data object or string if you're POSTing data. Passing in an object will result in a regular POST, passing in a string will assume it's a path to a file which holds a proper multipart request.
     */
    that.addRequest = function(method, url, subst, data) {
        data = data || {};
        var request = new Request(method, url, subst, data);
        that.requests.push(request);
        return request;
    };

    return that;
};

var Request = function(method, url, data) {
    var that = {};
    that.method = method;
    that.url = url;
    that.data = data;
    that.variables = [];

    /**
     * Allows capturing of some response data in a variable.
     * @param {String} name       The variable name.
     * @param {String} type       The variable type.
     *                            One of `json`, `xpath`, `regexp`, `re`, `psql`
     * @param {String} expression A valid expression to capture data.
     */
    that.addDynamicVariable = function(name, type, expression) {
        that.variables.push(new DynamicRequestVariable(name, type, expression));
    };

    that.formatContent = function(session) {
        that.subst = (that.url.indexOf('%%_') > 0 || (that.data && JSON.stringify(that.data).indexOf('%%_') > 0) || that.variables.length > 0);

        if (method === 'POST') {
            if (typeof data === 'object') {
                that.contents = {
                    "content": querystring.stringify(that.data, '&amp;')
                };

                // % signs are the only one we convert back as that is what Tsung relies on.
                that.contents.content = that.contents.content.replace(/%25%25/g, '%%');
            } else if (typeof data === 'string') {
                var path = session.uploadablefiles[data].path;
                var boundary = session.uploadablefiles[data].boundary;
                var contentType = 'multipart/form-data; boundary=' + boundary;
                that.from_file = {
                    "path": path,
                    "type": contentType
                };
            }
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
