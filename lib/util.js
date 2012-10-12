
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