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
var TsungUtil = require('../util');

/**
 * Generates a CSV file of search terms that will return search results in the data-set. A term can only be a candidate for this file
 * if it returns at least 30 items (i.e., 3 pages of content, paged at 10).
 */
module.exports = function(batchNum, model, outputDir, callback) {
    var rows = [];

    var terms = {};

    var _parseTerms = function(str) {
        if (str) {
            str.split(' ').forEach(function(term) {
                if (!terms[term]) {
                    terms[term] = 1;
                } else {
                    terms[term]++;
                }
            });
        }
    };

    _.values(model.content).forEach(function(content) {
        _parseTerms(content.description);
        _parseTerms(content.name);
    });

    _.values(model.groups).forEach(function(group) {
        _parseTerms(group.name);
        _parseTerms(group.description);
        _parseTerms(group.alias);
    });

    _.values(model.users).forEach(function(user) {
        _parseTerms(user.displayName);
        _parseTerms(user.username);
    });

    for (var term in terms) {
        if (term.length < 3 || terms[term] < 30) {
            delete terms[term];
        }
    }

    var rows = _.keys(terms).map(function(term) {
        return [term];
    });

    var outputFile = outputDir + '/search_terms_30.csv';
    console.log('[search_terms_30.csv] Writing %s rows to %s', rows.length, outputFile);
    TsungUtil.writeCsvFile(outputFile, rows, callback);
}