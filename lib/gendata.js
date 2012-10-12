var mkdirp = require('mkdirp');
var fs = require('fs');

exports.generateCsvData = function(numberOfBatches, sourceScriptsDir, outputDir, callback) {
    // Create the output directory.
    mkdirp.sync(outputDir);

    // Loop over each batch, read it and collect the data we need.
    for (var batchNumber = 0; batchNumber < numberOfBatches; batchNumber++) {
        console.log('Processing batch #' + batchNumber);
      
        var usersBatchFile = sourceScriptsDir + '/users/' + batchNumber + '.txt';
        var groupsBatchFile = sourceScriptsDir + '/groups/' + batchNumber + '.txt';

        // Read the data,
        // It doesn't really matter that it happens synchronously as it's the only thing that this module does.
        var userData = fs.readFileSync(usersBatchFile, 'utf8');
        var groupData = fs.readFileSync(groupsBatchFile, 'utf8');

        var users = {};
        var userBatch = userData.split('\n');

        // build the usernames and passwords
        userBatch.forEach(function(item) {
            item = JSON.parse(item);
            users[item.userid] = {};
            users[item.userid].password = item.password;
            users[item.userid].groups = {'member': [], 'manager': []};
        });

        // Get the groups
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

        // Collect data in easy-to-write format.
        var data = [];
        for (var userId in users) {
            for (var i = 0; i < 10 && i < users[userId].groups.member.length; i++)  {
                data.push([userId, users[userId].password, users[userId].groups.member[i]])
            }
        }
    }

    // Write the CSV file.
    var usersCSV = outputDir + '/users.csv';
    writeCSVFile(usersCSV, data);

    // Output some logging
    console.log('Complete batch processing.');
    console.log('Generated:');
    console.log(usersCSV);
    callback();
};


/**
 * Write a CSV file.
 *
 * @param  {String}                  path   The path to write to
 * @param  {Array<Array<String> >}   data   An array of arrays with string.
 *                                          Each inner array will be formatted on one line as a string of comma-seperated values.
 */
var writeCSVFile = exports.writeCSVFile = function(path, data) {
    var fd = fs.openSync(path, 'w');
    var lines = [];
    for (var i = 0; i < data.length; i++) {
        lines.push(data[i].join(','));
    }
    var buffer = new Buffer(lines.join('\n'));
    fs.writeSync(fd, buffer, 0, buffer.length, null);
};

