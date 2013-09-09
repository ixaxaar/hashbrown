
var redis = require("redis");
var _ = require('underscore');

var framework = require('../../../framework');

var feed = require('./feed')
    , Feed = feed.Feed
    , findFeed = feed.findFeed;

// redis server connection and stuff
// yes, all this info is cached in _our_ redis server, so that
// the org's server's slowness can be forgiven.. todo: good idea?
var client = redis.createClient();
//client.auth();

var errorHandler = function (err) { log("error", err); };
client.on("error", errorHandler);


/////////////////////////////////////
//    Redis Cached Feedlists
/////////////////////////////////////

// note: timeout feature should be used heavily to reduce loads
// make sure that all code is failsafe to missing stack items
// due to timeouts

// for a ergular user, his feeds are to be a mashup of
// 1. Private feeds - in which the user has been added to its acl
// 2. team feeds which the user has been subscribed to
// 3. broadcasts which the entire organization has access to

// only for maintaining private posts, not so frequetly accessed
// and since private posts are assumed to be of not much high volume,
// these stacks will probably time out and hence will not be much of a burden

// The DNA is nothing more than a program designed to preserve itself
// life when organized into species relies upon genes to be its memory system
// so man is an individual only because og his intangible memory
// and memory cannot be defined but it defines mankind ;)

/////////////////////////////////////
//    Cache size configuration
/////////////////////////////////////
var RECENT_FEEDLIST_SIZE = 20;

var keyBuilder = function(entity, type) {
    return entity.org + ":" + type + ":" + (entity.name || entity.uid);
};

// this is the unit of each stack
var feedStackElement = function(feed) {
    this.uuid           = feed.uuid;
    this.owner          = feed.owner;
    this.private        = feed.private;
    this.created        = feed.created;
    this.tags           = feed.tags;
    this.teams          = feed.teams;
    this.versioned      = feed.versioned;
    this.content        = feed.content;
    this.children       = feed.children;
};

var userFeedStack = function(user) {
    this.name           = user.uid;
    this.org            = user.org;
    this.key            = keyBuilder(user, 'p');
    this.ttl            = 24*60*60; // 24 hours
    this.stack          = [];
};
userFeedStack.prototype.hook = userFeedStackHook;
userFeedStackHook = function() {};

// for team posts, each team has one - very frequent access
var teamFeedStack = function(team) {
    this.name           = team.name;
    this.org            = team.org;
    this.key            = keyBuilder(team, 't');
    this.ttl            = 2*60*60; // 2 hours
    this.stack          = [];
};
teamFeedStack.prototype.hook = teamFeedStackHook;
teamFeedStackHook = function() {};

// organization-level broadcasts
var broadcastFeedStack = function(org) {
    this.name           = org.name;
    this.org            = org.org;
    this.key            = keyBuilder(org, 'b');
    this.ttl            = 24*60*60; // 24 hours
    this.stack          = [];
};
broadcastFeedStack.prototype.hook = broadcastFeedStackHook;
broadcastFeedStackHook = function() {};

var userTimelineBuilder = function(user, slab, fn) {
    // construct the query
    var query = Feed.find({});
    query.where('acl', user.uid);
    query.and([{ org: user.org }]);
    query.skip(slab * RECENT_FEEDLIST_SIZE);
    query.limit(RECENT_FEEDLIST_SIZE);
    query.sort('updated', -1);

    // execute the query
    query.exec(function(err, docs) {
        if (!err && docs.length) {
            var ufs = new userFeedStack(user);
            docs.forEach(function(d) {
                ufs.stack.push(JSON.stringify(new feedStackElement(d)));
            });
            // well, feed it back to the caller first, then commit it into cache
            fn && fn(true, ufs);

            // cache only the first slab, not the whole thing
            if (!slab)
                client.setex(keyBuilder(user, 'p'), ufs, ufs.ttl, function(err) {
                    if (err) log('warning', 'could not set user tieline into cache');
                });
        }
        else {
            log('warning', 'Could not find any records');
            fn && fn(false, err);
        }
    });
};

// search for feeds tagged with a set of tags
var tagTimelineBuilder = function(user, tags, slab, fn) {
    // construct the query
    var query = Feed.find({});
    tags && tags.forEach(function(tag) { query.where('tag', tag) });
    query.and([{ org: user.org }]);
    query.skip(slab * RECENT_FEEDLIST_SIZE);
    query.limit(RECENT_FEEDLIST_SIZE);
    query.sort('updated', -1);

    // execute the query
    query.exec(function(err, docs) {
        if (!err && docs.length) {
            var ufs = new userFeedStack(user);
            docs.forEach(function(d) {
                ufs.stack.push(JSON.stringify(new feedStackElement(d)));
            });
            fn && fn(true, ufs);
        }
        else fn(false, err);
    });
};

//var docLister = function(user, fn) {
//    var ufs = new userFeedStack(user);
//
//    user.teams.forEach(function(t) {
//        //
//    });
//
//    var query = Feed.find({});
//    query.where('content.displayName', rx);
//    query.and([{ org: user.org }]);
//    query.skip(slab * RECENT_FEEDLIST_SIZE);
//    query.limit(RECENT_FEEDLIST_SIZE);
//    query.sort('updated', -1);
//};

// search for a document
var docSearcher = function(user, doc, slab, fn) {
    // construct the query
    var rx = new RegExp('/.*' + doc + '.*/'); // todo: choose a utf8-safe regexp?
    var query = Feed.find({});
    query.where('content.displayName', rx);
    query.and([{ org: user.org }]);
    query.skip(slab * RECENT_FEEDLIST_SIZE);
    query.limit(RECENT_FEEDLIST_SIZE);
    query.sort('updated', -1);

    // execute the query
    query.exec(function(err, docs) {
        if (!err && docs.length) {
            var ufs = new userFeedStack(user);
            docs.forEach(function(d) {
                ufs.stack.push(JSON.stringify(new feedStackElement(d)));
            });
            fn && fn(true, ufs);
        }
        else fn(false, err);
    });
};


var teamTimelineBuilder = function(team, fn) {
    // construct the query
    var query = Feed.find({});
    query.where('teams', team.name);
    query.and([{ org: team.org }]);
    query.sort('updated', -1);
    query.limit(RECENT_FEEDLIST_SIZE);

    // execute the query
    query.exec(function(err, docs) {
        if (!err && docs.length) {
            var tfs = new teamFeedStack(team);
            docs.forEach(function(d) {
                tfs.stack.push(JSON.stringify(new feedStackElement(d)));
            });
            // well, feed it back to the caller first, then commit it into cache
            fn && fn(true, tfs);
            client.setex(keyBuilder(team, 'p'), tfs, tfs.ttl, function(err) {
                if (err) log('warning', 'could not set user tieline into cache');
            });
        }
        else {
            log('warning', 'Could not find any records');
            fn && fn(false, err);
        }
    });
};

var broadcastTimelineBuilder = function(org, fn) {
    // construct the query
    var query = Feed.find({});
    query.where('owner', org.uid);
    query.and([{ org: org.org }]);
    query.sort('updated', -1);
    query.limit(RECENT_FEEDLIST_SIZE);

    // execute the query
    query.exec(function(err, docs) {
        if (!err && docs.length) {
            var bfs = new broadcastFeedStack(team);
            docs.forEach(function(d) {
                bfs.stack.push(JSON.stringify(new feedStackElement(d)));
            });
            // well, feed it back to the caller first, then commit it into cache
            fn && fn(true, bfs);
            client.setex(keyBuilder(org, 'p'), bfs, bfs.ttl, function(err) {
                if (err) log('warning', 'could not set user tieline into cache');
            });
        }
        else {
            log('warning', 'Could not find any records');
            fn && fn(false, err);
        }
    });
};

var UserFeedConstructor = function() {
    // construct the redis caches for user, team and broadcast feeds
    // this can be a pretty costly affair once the bases become large! :O

    framework.forEachUser(function(u) {
        var ufs = new userFeedStack(u);
        client.get(ufs.key, function(err, data) {
            if (!err && data) {}
            else client.setex(ufs.key, ufs.ttl, ufs, function(err) {
                (!err) || log('warning', 'Could not init user feed cache');
            });
        });
    });

    // multiple-node problem - dont do anything to the values already in memory
    // maybe they have been stored there by another server
    framework.forEachTeam(function(t) {
        var tfs = new teamFeedStack(t);
        client.get(tfs.key, function(err, data) {
            if (!err && data) {}
            else teamTimelineBuilder(t);
        });
    });

    framework.forEachOrg(function(o) {
        var ofs = new broadcastFeedStack(o);
        client.get(ofs.key, function(err, data) {
            if (!err && data) {}
            else broadcastTimelineBuilder(o);
        });
    });
};

module.exports = exports = UserFeedConstructor;

