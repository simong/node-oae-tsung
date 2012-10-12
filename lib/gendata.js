var mkdirp = require('mkdirp');
var fs = require('fs');

exports.generateCsvData = function(numberOfBatches, sourceScriptsDir, outputDir, callback) {

    // create the output directory
    mkdirp.sync(outputDir);

    // gather the generators
    var generators = [];
    fs.readdirSync(__dirname+'/generators').forEach(function(file) {
        generators.push(require('./generators/' + file));
    });

    console.log('[csv] Using generators: %s', JSON.stringify(generators));

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
 * Build the data mode from the source files that will be used to drive the CSV files.
 *
 * @param   {Number}  batchNum              The batch number to generate the model for
 * @param   {String}  sourceScriptsDir      The directory in which the source scripts live
 * @returns {Object}                        The model that is used by the generators
 */
var _buildModel = function(batchNum, sourceScriptsDir) {
    var model = {};

    var usersBatchFile = sourceScriptsDir + '/users/' + batchNum + '.txt';
    var groupsBatchFile = sourceScriptsDir + '/groups/' + batchNum + '.txt';

    // Read the data,
    // It doesn't really matter that it happens synchronously as it's the only thing that this module does.
    console.log('[csv %s] Reading file %s', batchNum, usersBatchFile);
    var userData = fs.readFileSync(usersBatchFile, 'utf8');

    console.log('[csv %s] Reading file %s', batchNum, groupsBatchFile);
    var groupData = fs.readFileSync(groupsBatchFile, 'utf8');

    var users = {};
    var userBatch = userData.split('\n');

    // build the usernames and passwords
    console.log('[csv %s] Processing users', batchNum);
    userBatch.forEach(function(item) {
        item = JSON.parse(item);
        users[item.userid] = {};
        users[item.userid].password = item.password;
        users[item.userid].groups = {'member': [], 'manager': []};
    });


    // Get the groups
    console.log('[csv %s] Processing groups', batchNum);
    groupData = groupData.split('\n');
    groupData.forEach(function(group) {
        group = JSON.parse(group);
        group.roles.manager.users.forEach(function(member) {
            users[member.substr(6)].groups.manager.push(group.id);
        });
        group.roles.member.users.forEach(function(member) {
            users[member.substr(6)].groups.member.push(group.id);
        });
    });

    model.users = users;
    return model;
}
