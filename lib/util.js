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
var util = require('util');

/**
 * Append the CSV file to the path.
 *
 * @param  {String}     path   The path to write to
 * @param  {String[][]} data   An array of arrays with strings. Each inner array will be formatted on one line as a string
 *                             of comma-seperated values.
 */
module.exports.writeCsvFile = function(path, data, callback) {
    fs.exists(path, function(exists) {
        fs.open(path, 'a', function(err, fd) {
            var lines = [];
            for (var i = 0; i < data.length; i++) {
                lines.push(data[i].join(','));
            }

            // if we are actually appending, we want to prepend a new line to avoid having 2 rows on the same row.
            var buffer = (exists) ? '\n' : '';
            buffer += lines.join('\n');
            buffer = new Buffer(buffer);

            fs.write(fd, buffer, 0, buffer.length, null, function() {
                fs.close();
            });
        });
    });
}

/**
 * Generate attach the test cases to the Tsung runner for the given suite.
 *
 * @param {Tsung}       runner          The Tsung runner to which to attache the tests
 * @param {String}      suite           The suite to run
 * @param {Function}    callback        Invoked when the process completes
 * @param {Object}      callback.err    An error that occurred, if any
 */
module.exports.generateTestsForSuite = function(runner, suite, callback) {
    parseSuite(suite, function(err, testCases) {
        if (err) {
            return callback(err);
        }

        // fix up the probabilities / weights to ensure they add up to 100
        normalizeProbabilities(testCases);
        for (var name in testCases) {
            if (testCases.hasOwnProperty(name)) {
                generateTest(runner, name, testCases[name])
            }
        }

        callback();
    });
}

/**
 * A utility function to parse a suite file and generate the testCase:weight pairs
 *
 * @param {String}      suite               The suite whose tests to parse
 * @param {Function}    callback            Invoked when the process completes
 * @param {Object}      callback.err        An error that occurred, if any
 * @param {Object}      callback.testCases  The test cases to run in the suite, along with their weight. The key of the hash is the
 *                                          test case name, and the value is the weight.
 */
var parseSuite = function(suite, callback) {
    var testCases = {};

    // TODO: the test suite file is probably better off as a JSON file that we can "require"
    fs.readFile(util.format('%s/../suites/%s', __dirname, suite), 'utf-8', function(err, data) {
        if (err) {
            return callback(err);
        }

        var lines = data.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var split = lines[i].split(',');

            if (split[0] && split[0].length > 0) {
                testCases[split[0]] = split[1] ? split[1] : 10;
            }
        }

        callback(null, testCases);
    });
}

/**
 * Generate a test by name and attach it to the given test runner.
 *
 * @param {Tsung}   runner          The runner to which the test should be attached.
 * @param {String}  name            The name of the test
 * @param {Number}  probability     The probability that this particular test case will be executed in the test
 */
var generateTest = function(runner, name, probability) {
    require(util.format('../tests/%s.js', name)).test(runner, probability);
}

/**
 * Given a hash of testCase -> weight, convert it into a hash of testCase -> probability, which is a percentage between 0 and
 * 100 of the test case occurring. The probabilities of all test cases in the batch should add up to 100.
 *
 * @param {Object} testCases The test cases object ot convert
 */
var normalizeProbabilities = function(testCases) {
    var totalWeight = 0;
    for (var name in testCases) {
        if (testCases.hasOwnProperty(name)) {
            if (!testCases[name]) {
                testCases[name] = 10;
            }
            totalWeight += parseInt(testCases[name]);
        }
    }

    for (var name in testCases) {
        if (testCases.hasOwnProperty(name)) {
            testCases[name] = Math.floor(100 * testCases[name] / totalWeight);
        }
    }

    // find what they add up to and top it up on the first one
    totalWeight = 0;
    for (var name in testCases) {
        if (testCases.hasOwnProperty(name)) {
            totalWeight += parseInt(testCases[name]);
        }
    }

    if (totalWeight < 100) {
        for (var name in testCases) {
            testCases[name] = parseInt(testCases[name]) + (100 - totalWeight);
            return;
        }
    }
}

