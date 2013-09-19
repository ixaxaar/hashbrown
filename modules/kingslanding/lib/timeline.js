
var _ = require('underscore');

var tale = require('./tale')
    , taleModel = require('./tale.tale');

var council = require('./council')
    , councilModel = council.council;

var scroll = require('./scroll');


var MAX_QUERY_LIMIT = MAX_QUERY_LIMIT;


// construct a timeline __for__ the user
var timeline = function(user, slab, fn) {
    // construct the timeline for councils
    var councils;
    var query = councilModel.find();
    query.where('invited', user.uid);
    query.sort({ updated: 1 });
    query.skip(slab * MAX_QUERY_LIMIT);
    query.limit(MAX_QUERY_LIMIT);
    query.exec(function(err, docs) {
        councils = docs || {};

        // construct the timeline for tales
        var tales;
        var query2 = taleModel.find();
        query2.where('teams', user.teams);
        query2.sort({ updated: 1 });
        query2.skip(slab * MAX_QUERY_LIMIT);
        query2.limit(MAX_QUERY_LIMIT);
        query2.exec(function(err, docs) {
            tales = docs || {};

            var summons;
            var query3 = taleModel.find();
            query3.and({ actor: user.uid, type: 'log' });
            query3.sort({ updated: 1 });
            query3.skip(slab * MAX_QUERY_LIMIT);
            query3.limit(MAX_QUERY_LIMIT);
            query3.exec(function(err, docs) {
                summons = docs || {};

                var reply = {
                    'councils': councils,
                    'tales':    tales,
                    'summons':  summons
                };
                // expected to always generate a successful reply
                fn(true, JSON.stringify(reply));
            });
        });
    });
};
exports.timeline = timeline;


// construct a timeline __of__ the user
var userTimeline = function(user, slab, fn) {
    // construct the timeline for councils
    var councils;
    var query = councilModel.find();
    query.where('summoner', user.uid);
    query.sort({ updated: 1 });
    query.skip(slab * MAX_QUERY_LIMIT);
    query.limit(MAX_QUERY_LIMIT);
    query.exec(function(err, docs) {
        councils = docs || {};

        // construct the timeline for tales
        var tales;
        var query2 = taleModel.find();
        query2.where('actor', user.teams);
        query2.sort({ updated: 1 });
        query2.skip(slab * MAX_QUERY_LIMIT);
        query2.limit(MAX_QUERY_LIMIT);
        query2.exec(function(err, docs) {
            tales = docs || {};

            var summons;
            var query3 = taleModel.find();
            query3.and({ actor: user.uid, type: 'log' });
            query3.sort({ updated: 1 });
            query3.skip(slab * MAX_QUERY_LIMIT);
            query3.limit(MAX_QUERY_LIMIT);
            query3.exec(function(err, docs) {
                summons = docs || {};

                var reply = {
                    'councils': councils,
                    'tales':    tales,
                    'summons':  summons
                };
                // expected to always generate a successful reply
                fn(true, JSON.stringify(reply));
            });
        });
    });
};
exports.userTimeline = userTimeline;

