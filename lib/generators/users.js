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
var TsungUtil = require('../util');

/**
 * Generates the users.csv file that provides simple usernames, passwords, and an associated group.
 */
module.exports = function(batchNum, model, outputDir, callback) {
    var users = model.users;
    // aggregate the user rows for the users.csv file
    var rows = [];
    for (var id in users) {
        var user = users[id];
        rows.push([model.idMapping['users'][id], user.userid, user.password]);
    }

    var outputFile = outputDir+'/users.csv';
    console.log('[users.csv] Writing %s rows to %s', rows.length, outputFile);

    TsungUtil.writeCsvFile(outputFile, rows, callback);
};