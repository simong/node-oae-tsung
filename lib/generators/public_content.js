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
 * Generates the public_content.csv file that provides public content that may be accessed by anonymous or authenticated users. This file
 * is multi-dimensional so that one user session may perform similar patterns over different sets of data. Each row has a 10 columns
 * containing a public content id, therefore a pattern may be iterated in one session over 10 different public content items (e.g., view
 * profile, then view users, then view public user, then go back to content profile, then create comment, etc...)
 *
 * A content item can only be a candidate of this file if it is public.
 *
 */
module.exports = function(batchNum, model, outputDir, callback) {
    var rows = [];

    var currContent = [];
    for (var id in model.content) {
        var content = model.content[id];
        if (content.visibility === 'public') {
            currContent.push(model.idMapping['content'][id]);
            if (currContent.length === 10) {
                rows.push(currContent);
                currContent = [];
            }
        }
    }

    var outputFile = outputDir+'/public_content.csv';
    console.log('[public_content.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
}