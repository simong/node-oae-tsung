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

/**
 * Generates the public_discussions.csv file that provides public discussions that may be accessed by anonymous or authenticated users. This file
 * is multi-dimensional so that one user session may perform similar patterns over different sets of data. Each row has a 10 columns
 * containing a public discussion id, therefore a pattern may be iterated in one session over 10 different public discussions (e.g., view profile,
 * then view library, then view public content, then go back user library, then view group memberships, etc...)
 *
 * A discussion can only be a candidate of this file if they are public.
 *
 */
module.exports = function(batchNum, model, csvWriter, callback) {
    var rows = [];
    var currDiscussions = [];
    for (var id in model.discussions) {
        var discussion = model.discussions[id];
        if (discussion.visibility === 'public') {
            currDiscussions.push(model.idMapping.discussions[id]);
            if (currDiscussions.length === 10) {
                rows.push(currDiscussions);
                currDiscussions = [];
            }
        }
    }

    csvWriter.write('public_discussions', rows, callback);
};