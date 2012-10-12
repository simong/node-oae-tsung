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
 * A utility function to parse a suite file and generate the testCase:probability pairs
 */
var parseSuite = function(suite, callback) {
    var testCases = {};
    fs.readFile(util.format('%s/../suites/%s', __dirname, suite), 'utf-8', function(err, data) {
        if (err) {
            return callback(err);
        }

        var lines = data.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var split = lines[i].split(',');
            testCases[split[0]] = split[1];
        }

        callback(null, testCases);
    });
}

var generateTest = function(runner, name, probability) {
    require(util.format('../tests/%s.js', name)).test(runner, probability);
}

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
            testCases[name] = 100 * testCases[name] / totalWeight
        }
    }
}