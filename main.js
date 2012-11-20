#!/usr/bin/env node

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
var path = require('path');
var readline = require('readline');
var tsung = require('./lib/tsung');
var util = require('util');
var wrench = require('wrench');
var TsungUtil = require('./lib/util');

var printErr = function(err, msg) {
    console.log(msg);
    console.log(err);
    console.log(err.stack);
}

process.on('uncaughtException', function(err) {
    printErr(err, 'Uncaught Exception');
});

var optimist = require('optimist')
        .usage('Usage: $0 -o <output dir>')

        .alias('h', 'help')
        .describe('h', 'Show this help information.')

        .alias('s', 'source-dir')
        .describe('s', 'The directory that contains the source data used to load content into the target system.')

        .alias('b', 'batches')
        .describe('b', 'If using source data, this specifies how many batches of that data should be aggregated into CSV.')
        .default('b', 1)

        .alias('o', 'output-dir')
        .describe('o', 'The directory in which the output Tsung package should be generated.')
        .default('o', util.format('./tsung-%s', new Date().getTime()))

        .alias('a', 'answers')
        .describe('a', 'A JSON file containing the answers to the interactive prompt questions.')

        .alias('d', 'dtd')
        .describe('d', 'The location of the Tsung XML DTD.')
        .default('d', '/opt/local/share/tsung/tsung-1.0.dtd')

        .alias('m', 'max-users')
        .describe('m', 'The max number of users to allow at one time.')
        .default('m', 10000);

var argv = optimist.argv;

if (argv.h) {
    return console.log(optimist.help());
}

var config = {
    'dtdLocation': argv.d,
    'logLevel': 'notice',
    'version': '1.0',
    'dumpTraffic': false
};

// parse the answers if specified
var answers = null;
if (argv.a) {
    var answersJson = fs.readFileSync(argv.a, 'utf-8');
    try {
        answers = JSON.parse(answersJson);
    } catch (err) {
        console.log('Specified answers file contains invalid JSON.');
        console.log(err);
        console.log(err.stack);
        process.exit(1);
    }
}

var outputRoot = argv.o;
var scriptsDir = argv.s;
var maxUsers = argv.m;

var suite = null;
var runner = new tsung.Tsung(config);

// Read from the commandline.
var rl = readline.createInterface({
  'input': process.stdin,
  'output': process.stdout
});

/**
 * Validate the parameters in the current session to try and pro-actively detect issues. This will throw an exception if an issue
 * is found.
 */
var validateSession = function() {
    // sanity check the specified scripts directory. If there is not atleast one batch of users, something isn't right
    var batchCheck = scriptsDir + '/users/0.txt';
    if (scriptsDir && !fs.existsSync(batchCheck)) {
        throw new Error('The source script directory does not even have one batch of users (' + batchCheck + ' does not exist).');
    }
}

/**
 * Parses all the data format files from the specified data directory. There should be a number of files with extension
 * `.format` in this directory. On the first line, the format file specifies how a CSV file (of the same name) will be
 * interpretted by Tsung. The first line of the format file will specify a comma-separated list of variable names that
 * should match the columns of the CSV file. The second line defines how the file should be traversed (`iter` or `random`).
 * The filename will be used as an internal identifier. Make sure the variable names are globally unique across all your
 * data files.
 */
var generateDataConfiguration = function() {
    try {
        var dataConfig = require('./config/data.json');
    } catch (err) {
        // no data config. this is fine I guess.
        console.log(err);
        return;
    }
        
    // file servers
    if (dataConfig.files) {
        for (var id in dataConfig.files) {
            var file = dataConfig.files[id];
            runner.addFileServer(id, util.format('data/%s.csv', id), file.vars, ',', file.order);
        }
    }

    // randomized strings
    if (dataConfig.strings) {
        for (var id in dataConfig.strings) {
            runner.addRandomStringGenerator(id, dataConfig.strings[id].length);
        }
    }

    // randomized numbers
    if (dataConfig.numbers) {
        for (var id in dataConfig.numbers) {
            runner.addRandomNumberGenerator(id, dataConfig.numbers[id].start, dataConfig.numbers[id].end);
        }
    }

    // Files that can be uploaded.
    if (dataConfig.uploadableFiles) {
        for (var id in dataConfig.uploadableFiles) {
            runner.addUploadableFile(id, dataConfig.uploadableFiles[id].path, dataConfig.uploadableFiles[id].boundary);
        }
    }
}

/**
 * Prompts the user for the test suite to run.
 *
 * @param {Function} callback Invoked when the user has set up the suite
 */
var promptSuite = function(callback) {

    if (answers && answers.suite) {
        suite = answers.suite;
        return callback();
    }

    fs.readdir(__dirname + '/suites', function(err, files) {
        if (files.length === 1) {
            suite = files[0];
            console.log('Using suite: %s', suite);
            return callback();
        }

        // we have multiple suites, choose one
        console.log('Available test suites:');
        for (var i = 0; i < files.length; i++) {
            console.log('[%s] %s', i, files[i]);
        }

        rl.question("Which suite number would you like to run? [0-" + (files.length-1) + "] ", function(answer) {
            suite = files[answer];
            console.log('Using suite: %s', suite);
            callback();
        });
    });
}

/**
 * Prompts the user for the tsung clients from which the performance test will be run.
 *
 * @param {Function} callback Invoked when the user has finished specifying their input
 */
var promptClient = function(callback) {
    if (answers && answers.clients) {
        runner.addClient(answers.clients.join(','), true, maxUsers);
        return callback();
    }

    rl.question("What clients are you driving your tests from? [hostname1,hostname2,...]? ", function(answer) {
        runner.addClient(answer, true, 10000);
        callback();
    });
}

/**
 * Prompts the user for the servers that will be tested by tsung.
 *
 * @param {Function} callback Invoked when the user has finished specifying their input
 */
var promptServer = function(callback) {
    if (answers && answers.servers) {
        for (var i = 0; i < answers.servers.length; i++) {
            var server = answers.servers[i].split(':');
            if (server.length !== 2 || !parseInt(server[1], 10)) {
                console.log('Invalid server specified: %s', server.join(':'));
                process.exit(1);
            } else {
                runner.addServer(server[0], server[1]);
            }
        }

        return callback();
    }

    rl.question("What server are you running this test against? [hostname:port] ", function(answer) {
        var server = answer.split(':');
        if (server.length !== 2 || !parseInt(server[1], 10)) {
            console.log('Please provide a valid server.');
            promptServer(callback);
        } else {
            runner.addServer(server[0], server[1]);
            rl.question('Add another server? [y/N] ', function(answer) {
                if (answer === 'y') {
                    promptServer(callback);
                } else {
                    callback();
                }
            });
        }
    });
};

/**
 * Prompts the user for the test phases that should generated by tsung.
 *
 * @param {Function}    callback    Invoked when the user has finished specifying their input
 * @param {Number}      i           The index of the current phase. If starting anew, don't specify this parameter
 */
var promptPhases = function(callback, i) {

    var validUnits = ['hour', 'minute', 'second'];

    if (answers && answers.phases) {
        var phases = answers.phases;
        for (var i = 0; i < phases.length; i++) {
            var phase = phases[i];
            var durationUnit = phase.durationUnit;
            var duration = phase.duration;
            var arrivalUnit = phase.arrivalUnit;
            var arrival = phase.arrival;

            if (!durationUnit || !_.contains(validUnits, durationUnit)) {
                console.log('Invalid duration unit: %s', durationUnit);
                process.exit(1);
            } else if (!duration || parseInt(duration) <= 0) {
                console.log('Invalid duration time: %s', duration);
                process.exit(1);
            } else if (!arrivalUnit || !_.contains(validUnits, arrivalUnit)) {
                console.log('Invalid arrivalUnit: %s', arrivalUnit);
                process.exit(1);
            } else if (!arrival || isNaN(arrival) || parseInt(arrival) < 0) {
                console.log('Invalid arrival time: %s', arrival);
                process.exit(1);
            } else {
                runner.addPhase(duration, durationUnit, arrival, arrivalUnit);
            }
        }

        return callback();
    }

    // no canned answers, continue
    i = i || 1;
    rl.question('Phase ' + i + ': In what unit should the phase time be measured? [hour, minute, second] ', function(answer) {
        if (answer === 'hour' || answer === 'minute' || answer === 'second') {
            var phaseUnit = answer;
            rl.question('Phase ' + i + ': How long should the phase take (in ' + phaseUnit +'s) ? ', function(answer) {
                var time = parseInt(answer, 10);
                if (time > 0) {
                    rl.question('Phase ' + i + ': In what unit should users be added [hour, minute, second] ? ', function(answer) {
                        if (answer === 'hour' || answer === 'minute' || answer === 'second') {
                            var usersUnit = answer;
                            rl.question('Phase ' + i + ': How many users should be added per ' + usersUnit + ' ? ', function(answer) {
                                var newUsers = parseInt(answer, 10);
                                if (newUsers > 0) {
                                    runner.addPhase(time, phaseUnit, newUsers, usersUnit);
                                    rl.question('Add another phase? [y/N] ', function(answer) {
                                        if (answer === 'y') {
                                            promptPhases(callback, i+1);
                                        } else {
                                            callback();
                                        }
                                    });
                                } else {
                                    console.log('Invalid amount');
                                    promptPhases(callback, i);
                                }
                            });
                        } else {
                            console.log('Invalid timeunit');
                            promptPhases(callback, i);
                        }
                    });
                } else {
                    console.log('Invalid amount');
                    promptPhases(callback, i);
                }
            });
        } else {
            console.log('Invalid timeunit');
            promptPhases(callback, i);
        }
    });
};

var packageTestRunner = function(xml, callback) {
    // Wipe the whole output dir if we had something in there.
    wrench.rmdirSyncRecursive(outputRoot, true);

    // output the tsung XML file
    wrench.mkdirSyncRecursive(outputRoot, 0777);
    fs.writeFile(util.format('%s/tsung.xml', outputRoot), xml, 'utf-8', function(err) {
        if (err) {
            return callback(err);
        }

        // copy the source scripts for posterity if they were specified
        if (scriptsDir) {
            var gendata = require('./lib/gendata');
            var outputScriptsDir = outputRoot + '/scripts';
            var outputDataDir = outputRoot + '/data';

            // copy the scripts to the output location
            wrench.copyDirSyncRecursive(scriptsDir, outputScriptsDir);

            // copy the uploadable files to the data dir.
            wrench.mkdirSyncRecursive(outputDataDir, 0777);
            var uploadableFiles = runner.getUploadableFiles();
            for (var key in uploadableFiles) {
                var file = uploadableFiles[key].path
                var filename = path.basename(file);
                fs.createReadStream(file).pipe(fs.createWriteStream(outputDataDir + '/' + filename));
            }

            // generate the CSV files based on the source scripts
            gendata.generateCsvData(argv.b, outputScriptsDir, outputDataDir, callback);
        }
    });
}

// fail early as aggressively as we can before the user spends time on an interactive prompt.
validateSession();
generateDataConfiguration();

// then gather user information
promptSuite(function() {
    TsungUtil.generateTestsForSuite(runner, suite, function(err) {
        if (err) {
            return printErr(err, 'Error generating tests for suite.');
        }
        promptClient(function() {
            promptServer(function() {
                promptPhases(function() {
                    rl.close();
                    runner.toXml(function(xml) {
                        packageTestRunner(xml, function(err) {
                            if (err) {
                                return printErr(err, 'Error packaging up the test runner.');
                            }
                            console.log('Test successfully generated in %s', outputRoot);
                        });
                    });
                });
            });
        });
    });
});
