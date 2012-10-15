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
 * Generates the public_groups.csv file that provides public groups that may be accessed by anonymous or authenticated users. This file
 * is multi-dimensional so that one user session may perform similar patterns over different sets of data. Each row has a 10 columns
 * containing a public group id, therefore a pattern may be iterated in one session over 10 different public groups (e.g., view profile,
 * then view library, then view public content, then go back group library, then view group membership, etc...)
 *
 * A group can only be a candidate of this file if it is public.
 *
 */
module.exports = function(batchNum, model, outputDir, callback) {
    var rows = [];
    var currGroups = [];
    for (var id in model.groups) {
        var group = model.groups[id];
        if (group.visibility === 'public') {
            currGroups.push(id);
            if (currGroups.length === 10) {
                rows.push(currGroups);
                currGroups = [];
            }
        }
    }

    var outputFile = outputDir+'/public_groups.csv';
    console.log('[public_groups.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
}