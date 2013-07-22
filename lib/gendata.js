
var _ = require('underscore');
var colors = require('colors');
var mkdirp = require('mkdirp');
var fs = require('fs');
var util = require('util');

exports.generateCsvData = function(numberOfBatches, sourceScriptsDir, outputDir, callback) {

    // create the output directory
    mkdirp.sync(outputDir);

    // gather the generators
    var generators = [];
    var generatorNames = [];
    fs.readdirSync(__dirname+'/generators').forEach(function(file) {
        generatorNames.push(file.split('.')[0]);
        generators.push(require('./generators/' + file));
    });

    console.log('[csv] Using generators: %s'.green, JSON.stringify(generatorNames));

    /*!
     * The CSV Writer object that can be used to write the CSV files by each generator
     */
    var _csvWriter = {
        'write': function(filename, rows, callback) {
            var path = util.format('%s/%s.csv', outputDir, filename);
            fs.exists(path, function(exists) {
                fs.open(path, 'a', function(err, fd) {
                    var rejectedRows = 0;
                    var lines = [];
                    _.each(rows, function(row) {

                        // Join all the rows with , so they are CSV. Reject ones that have empty values
                        if (_.compact(row).length === row.length) {
                            lines.push(row.join(','));
                        } else {
                            rejectedRows++;
                        }
                    });

                    if (rejectedRows > 0) {
                        console.log('[%s] Rejecting %s rows because of empty columns'.yellow, filename, rejectedRows);
                    }

                    var txt = '[%s] Writing %s rows to file %s';
                    if (lines.length === 0) {
                        txt = txt.red;
                    } else {
                        txt = txt.grey;
                    }
                    console.log(txt, filename, lines.length, path);

                    // if we are actually appending, we want to prepend a new line to avoid having 2 rows on the same row.
                    var buffer = (exists) ? '\n' : '';
                    buffer += lines.join('\n');
                    buffer = new Buffer(buffer);

                    fs.write(fd, buffer, 0, buffer.length, null, function() {
                        fs.close(fd, callback);
                    });
                });
            });
        }
    };

    var _generateForBatch = function(batchNum) {
        // exit condition
        if (batchNum >= numberOfBatches) {
            return callback();
        }

        console.log('[csv] Processing batch #%s'.grey, batchNum);

        // monitor the generator completions. they can be done asynchronously as they write to different files
        var done = 0;
        var resultErr = null;
        var _monitorGenerators = function(err) {
            if (resultErr) {
                // finished early due to an error
                return;
            } else if (err) {
                resultErr = err;
                return callback(resultErr);
            } else {
                done++;
                if (done >= generators.length) {
                    // this batch complete. go to the next
                    return _generateForBatch(batchNum+1);
                }
            }
        };

        // generate the model for this batch
        var model = _buildModel(batchNum, sourceScriptsDir);

        // asynchronously kick off the generators
        generators.forEach(function(generator) {
            generator(batchNum, model, _csvWriter, _monitorGenerators);
        });
    };

    _generateForBatch(0);
};

/**
 * Build the data model from the source files that will be used to drive the CSV files.
 *
 * @param   {Number}  batchNum              The batch number to generate the model for
 * @param   {String}  sourceScriptsDir      The directory in which the source scripts live
 * @returns {Object}                        The model that is used by the generators
 */
var _buildModel = function(batchNum, sourceScriptsDir) {
    var model = {};

    var usersBatchFile = sourceScriptsDir + '/users/' + batchNum + '.txt';
    var groupsBatchFile = sourceScriptsDir + '/groups/' + batchNum + '.txt';
    var contentBatchFile = sourceScriptsDir + '/content/' + batchNum + '.txt';
    var discussionsBatchFile = sourceScriptsDir + '/discussions/' + batchNum + '.txt';
    var userIdMappingsBatchFile = sourceScriptsDir + '/generatedIds/users-' + batchNum + '.txt';
    var groupIdMappingsBatchFile = sourceScriptsDir + '/generatedIds/groups-' + batchNum + '.txt';
    var contentIdMappingsBatchFile = sourceScriptsDir + '/generatedIds/content-' + batchNum + '.txt';
    var discussionIdMappingsBatchFile = sourceScriptsDir + '/generatedIds/discussions-' + batchNum + '.txt';

    // Read the data,
    // It doesn't really matter that it happens synchronously as it's the only thing that this module does.
    console.log('[csv %s] Reading file %s'.grey, batchNum, usersBatchFile);
    var userData = fs.readFileSync(usersBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, groupsBatchFile);
    var groupData = fs.readFileSync(groupsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, contentBatchFile);
    var contentData = fs.readFileSync(contentBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, discussionsBatchFile);
    var discussionData = fs.readFileSync(discussionsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, userIdMappingsBatchFile);
    var userIdMappingsData = fs.readFileSync(userIdMappingsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, groupIdMappingsBatchFile);
    var groupIdMappingsData = fs.readFileSync(groupIdMappingsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, contentIdMappingsBatchFile);
    var contentIdMappingsData = fs.readFileSync(contentIdMappingsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s'.grey, batchNum, discussionIdMappingsBatchFile);
    var discussionIdMappingsData = fs.readFileSync(discussionIdMappingsBatchFile, 'utf8');

    console.log('[csv %s] Successfully read all script files'.green, batchNum);

    var users = {};
    var groups = {};
    var contentItems = {};
    var discussions = {};
    var idMapping = { users: {}, groups: {}, content: {}, discussions: {}};

    // build the usernames and passwords
    console.log('[csv %s] Processing users'.grey, batchNum);
    userData = userData.split('\n');
    userData.forEach(function(user) {
        user = JSON.parse(user);
        users[user.id] = user;
    });

    // Get the groups
    console.log('[csv %s] Processing groups'.grey, batchNum);
    groupData = groupData.split('\n');
    groupData.forEach(function(group) {
        group = JSON.parse(group);
        groups[group.id] = group;
    });

    // Get the content items
    console.log('[csv %s] Processing content items'.grey, batchNum);
    contentData = contentData.split('\n');
    contentData.forEach(function(contentItem) {
        contentItem = JSON.parse(contentItem);
        contentItems[contentItem.id] = contentItem;
    });

    // Get the discussions
    console.log('[csv %s] Processing discussions'.grey, batchNum);
    discussionData = discussionData.split('\n');
    discussionData.forEach(function(discussion) {
        discussion = JSON.parse(discussion);
        discussions[discussion.id] = discussion;
    });

    // Get the id mappings
    console.log('[csv %s] Processing user id mappings'.grey, batchNum);
    userIdMappingsData = userIdMappingsData.split('\n');
    userIdMappingsData.forEach(function(mapping) {
        mapping = JSON.parse(mapping);
        idMapping['users'][mapping.id] = mapping.generatedId;
    });

    console.log('[csv %s] Processing group id mappings'.grey, batchNum);
    groupIdMappingsData = groupIdMappingsData.split('\n');
    groupIdMappingsData.forEach(function(mapping) {
        mapping = JSON.parse(mapping);
        idMapping['groups'][mapping.id] = mapping.generatedId;
    });

    console.log('[csv %s] Processing content id mappings'.grey, batchNum);
    contentIdMappingsData = contentIdMappingsData.split('\n');
    contentIdMappingsData.forEach(function(mapping) {
        mapping = JSON.parse(mapping);
        idMapping['content'][mapping.id] = mapping.generatedId;
    });

    console.log('[csv %s] Processing discussion id mappings'.grey, batchNum);
    discussionIdMappingsData = discussionIdMappingsData.split('\n');
    discussionIdMappingsData.forEach(function(mapping) {
        mapping = JSON.parse(mapping);
        idMapping['discussions'][mapping.id] = mapping.generatedId;
    });

    console.log('[csv %s] Successfully processed all script files'.green, batchNum);

    model.users = users;
    model.groups = groups;
    model.content = contentItems;
    model.discussions = discussions;
    model.idMapping = idMapping;

    return model;
};
