var mkdirp = require('mkdirp');
var fs = require('fs');

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

    console.log('[csv] Using generators: %s', JSON.stringify(generatorNames));

    var _generateForBatch = function(batchNum) {
        // exit condition
        if (batchNum >= numberOfBatches) {
            return callback();
        }

        console.log('[csv] Processing batch #%s', batchNum);

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
        }

        // generate the model for this batch
        var model = _buildModel(batchNum, sourceScriptsDir);

        // asynchronously kick off the generators
        generators.forEach(function(generator) {
            generator(batchNum, model, outputDir, _monitorGenerators);
        });
    }

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
    var userIdMappingsBatchFile = sourceScriptsDir + '/generatedIds/users-' + batchNum + '.txt';
    var contentIdMappingsBatchFile = sourceScriptsDir + '/generatedIds/content-' + batchNum + '.txt';

    // Read the data,
    // It doesn't really matter that it happens synchronously as it's the only thing that this module does.
    console.log('[csv %s] Reading file %s', batchNum, usersBatchFile);
    var userData = fs.readFileSync(usersBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s', batchNum, groupsBatchFile);
    var groupData = fs.readFileSync(groupsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s', batchNum, contentBatchFile);
    var contentData = fs.readFileSync(contentBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s', batchNum, userIdMappingsBatchFile);
    var userIdMappingsData = fs.readFileSync(userIdMappingsBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s', batchNum, contentIdMappingsBatchFile);
    var contentIdMappingsData = fs.readFileSync(contentIdMappingsBatchFile, 'utf8');

    var users = {};
    var groups = {};
    var contentItems = {};
    var idMapping = { users: {}, content: {}};

    // build the usernames and passwords
    console.log('[csv %s] Processing users', batchNum);
    userData = userData.split('\n');
    userData.forEach(function(user) {
        user = JSON.parse(user);
        users[user.id] = user;
    });

    // Get the groups
    console.log('[csv %s] Processing groups', batchNum);
    groupData = groupData.split('\n');
    groupData.forEach(function(group) {
        group = JSON.parse(group);
        groups[group.id] = group;
    });

    // Get the content items
    console.log('[csv %s] Processing content items', batchNum);
    contentData = contentData.split('\n');
    contentData.forEach(function(contentItem) {
        contentItem = JSON.parse(contentItem);
        contentItems[contentItem.id] = contentItem;
    });

    // Get the id mappings
    console.log('[csv %s] Processing user id mappings', batchNum);
    userIdMappingsData = userIdMappingsData.split('\n');
    userIdMappingsData.forEach(function(mapping) {
        mapping = JSON.parse(mapping);
        idMapping['users'][mapping.id] = mapping.generatedId;
    });

    console.log('[csv %s] Processing content id mappings', batchNum);
    contentIdMappingsData = contentIdMappingsData.split('\n');
    contentIdMappingsData.forEach(function(mapping) {
        mapping = JSON.parse(mapping);
        idMapping['content'][mapping.id] = mapping.generatedId;
    });

    model.users = users;
    model.groups = groups;
    model.content = contentItems;
    model.idMapping = idMapping;

    return model;
}
