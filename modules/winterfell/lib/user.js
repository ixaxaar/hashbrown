
var structures = require('./structures');

// configuration
var RECENT_FEEDLIST_SIZE = 40;

exports.ConstructFeedsForUser = function(user, fn) {
    // construct the query
    var query = Feed.find({});
    query.where('owner', user._uid);
    query.or([{'acl': user._uid}]);
    query.sort('timestamp', 1);
    query.limit(RECENT_FEEDLIST_SIZE);

    // execute the query
    query.exec(function(err, docs) {
        if (!err || docs[0]) fn(null, docs);
        else fn('Could not find any records', null);
    });
};

exports.ConstructFeedsForUserAndTag = function(user, tag, fn) {
    // construct the query
    var query = Feed.find({});
    query.where('tags', tag);
    query.or([{'acl': user._uid, 'owner': user._uid}]);
    query.sort('timestamp', 1);
    query.limit(RECENT_FEEDLIST_SIZE);

    // execute the query
    query.exec(function(err, docs) {
        if (!err || docs[0]) fn(null, docs);
        else fn('Could not find any records', null);
    });
};

exports.ConstructFeedStackFromTag = function(tag, fn) {
    Feed.find({'tags': tag}, function(err, docs) {
        if (!err || docs[0]) fn(null, docs);
        else fn(err, null);
    });
};
