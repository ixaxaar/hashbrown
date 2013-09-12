
var redis = require("redis");
var _ = require('underscore');

var framework = require('../../../framework');

var __feed = require('./feed')
    , Feed = __feed.Feed;

var winston = require('winston');
var log = winston.log;

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

// in case we have only the entity name, and not the object...
var keyBuilder2 = function(asker, entity, type) {
    return asker.org + ":" + type + ":" + entity;
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

/////////////////////////////////////
//    Stack structures
/////////////////////////////////////

var userFeedStack = function(user) {
    this.name           = user.uid      || '';
    this.org            = user.org      || '';
    this.key            = (!!user) && keyBuilder(user, 'p') || '';
    this.ttl            = 24*60*60; // 24 hours
    this.stack          = [];
};
exports.userFeedStackHook = function(user, feed) {
    client.get(keyBuilder(user, 'p'), function(err, data) {
        if (!err && data) {
            data = JSON.parse(data);
            data.stack.push(new feedStackElement(feed));
            client.setex(data.key, data.ttl, JSON.stringify(data),
                function(err) { log('error', err) });
        }
        else {
            var fse = new feedStackElement(feed);
            var ufs = new userFeedStack(user);
            ufs.stack.push(fse);
            client.setex(ufs.key, ufs.ttl, JSON.stringify(ufs),
                function(err) { log('error', err) });
        }
    });
};

// for team posts, each team has one - very frequent access
var teamFeedStack = function(team) {
    this.name           = team.name         || '';
    this.org            = team.org          || '';
    this.key            = (!!team) && keyBuilder(team, 't') || '';
    this.ttl            = 2*60*60; // 2 hours
    this.stack          = [];
};
exports.teamFeedStackHook = function(user, feed) {
    feed.teams.forEach(function(t) {
        client.get(keyBuilder2(user, t, 't'), function(err, data) {
            if (!err && data) {
                data = JSON.parse(data);
                data.stack.push(new feedStackElement(feed));
                client.setex(data.key, data.ttl, JSON.stringify(data),
                    function(err) { log('error', err) });
            }
            else {
                var fse = new feedStackElement(feed);
                var tfs = new teamFeedStack();
                tfs.name = t;
                tfs.org = user.org;
                tfs.key = keyBuilder2(user, t, 't');
                tfs.stack.push(fse);
                client.setex(tfs.key, tfs.ttl, JSON.stringify(tfs),
                    function(err) { log('error', err) });
            }
        });
    });
};

// organization-level broadcasts
var broadcastFeedStack = function(org) {
    this.name           = org.name          || '';
    this.org            = org.org           || '';
    this.key            = (!!org) && keyBuilder(org, 'b') || '';
    this.ttl            = 24*60*60; // 24 hours
    this.stack          = [];
};
exports.broadcastFeedStackHook = function(user, feed) {
    client.get(keyBuilder(user, 'b'), function(err, data) {
        if (!err && data) {
            data = JSON.parse(data);
            data.stack.push(new feedStackElement(feed));
            client.setex(data.key, data.ttl, JSON.stringify(data),
                function(err) { log('error', err) });
        }
        else {
            var fse = new feedStackElement(feed);
            var bfs = new broadcastFeedStack(user);
            bfs.stack.push(fse);
            client.setex(bfs.key, bfs.ttl, JSON.stringify(bfs),
                function(err) { log('error', err) });
        }
    });
};


/////////////////////////////////////
//    Timeline builders
/////////////////////////////////////

var userTimelineBuilder = function(user, slab, fn) {
    var cont = true;

    // see if the cache already contains our data
    if (!slab) client.get(keyBuilder(user, 'p'), function(err, data) {
        data = JSON.parse(data);
        if (!err && data && data.stack && data.stack.length > RECENT_FEEDLIST_SIZE/2)
            fn && fn(true, data);
        else cont = false;
    });

    if (cont) {
        // construct the query
        var query = Feed.find({});
        query.where('acl', user.uid);
        query.and([{ org: user.org }]);
        query.skip(slab * RECENT_FEEDLIST_SIZE);
        query.limit(RECENT_FEEDLIST_SIZE);
        query.sort({ updated: -1 });

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
                    client.setex(keyBuilder(user, 'p'), ufs.ttl, JSON.stringify(ufs), function(err) {
                        if (err) console.log(err);
                    });
                else console.log('agdasg')
            }
            else {
                log('warning', 'Could not find any records');
                fn && fn(false, err);
            }
        });
    }
    else fn(false, 'logic error');
};
exports.userTimelineBuilder = userTimelineBuilder;

var teamTimelineBuilder = function(team, slab, fn) {
    var cont = true;

    // see if the cache already contains our data
    if (!slab) client.get(keyBuilder(team, 't'), function(err, data) {
        if (!err && data && data.stack.length > RECENT_FEEDLIST_SIZE/2)
            fn && fn(true, data);
        else cont = false;
    });

    if (cont) {
        // construct the query
        var query = Feed.find({});
        query.where('teams', team.name);
        query.and([{ org: team.org }]);
        query.sort({ updated: -1 });
        query.skip(slab * RECENT_FEEDLIST_SIZE);
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
    }
    else fn(false, 'logic error');
};
exports.teamTimelineBuilder = teamTimelineBuilder;

var broadcastTimelineBuilder = function(user, slab, fn) {
    var cont = true;

    // see if the cache already contains our data
    if (!slab) client.get(keyBuilder2(user, user.org, 't'), function(err, data) {
        if (!err && data && data.stack.length > RECENT_FEEDLIST_SIZE/2)
            fn && fn(true, data);
        else cont = false;
    });

    if (cont) {
        // construct the query
        var query = Feed.find({});
        query.where('broadcast', true);
        query.and([{ org: user.org }]);
        query.sort({ updated: -1 });
        query.skip(slab * RECENT_FEEDLIST_SIZE);
        query.limit(RECENT_FEEDLIST_SIZE);

        // execute the query
        query.exec(function(err, docs) {
            if (!err && docs.length) {
                var bfs = new broadcastFeedStack(user);
                docs.forEach(function(d) {
                    bfs.stack.push(JSON.stringify(new feedStackElement(d)));
                });
                // well, feed it back to the caller first, then commit it into cache
                fn && fn(true, bfs);
                client.setex(keyBuilder2(user, user.org, 'p'), bfs, bfs.ttl, function(err) {
                    if (err) log('warning', 'could not set user tieline into cache');
                });
            }
            else {
                log('warning', 'Could not find any records');
                fn && fn(false, err);
            }
        });
    }
    else fn(false, 'logic error');
};
exports.broadcastTimelineBuilder = broadcastTimelineBuilder;

// search for feeds tagged with a set of tags
var tagTimelineBuilder = function(user, tags, slab, fn) {
    // construct the query
    var query = Feed.find({});
    tags && tags.forEach(function(tag) { query.where("tags.name", tag) });
    query.where('org', user.org);
    query.or([ { teams: user.teams }, { acl: user.uid } ]);
    query.sort({ updated: -1 });
    query.skip(slab * RECENT_FEEDLIST_SIZE);
    query.limit(RECENT_FEEDLIST_SIZE);

    // execute the query
    query.exec(function(err, docs) {
        console.log(docs)
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
exports.tagTimelineBuilder = tagTimelineBuilder;

/////////////////////////////////////
//    Document-as-a-repository browser
/////////////////////////////////////

var docLister = function(user, fn) {
    // this is gonna be a huge fucking function :/
    /*
        to show:
        1. Latest versions of all versioned documents
        2. All personal documents owned by this user
        how to:
        1. Iterate through all versioned documents of this user's teams
            repitions are not allowed
        2. Iterate through all documents which have this user in their acl
            (repitions are allowed here)
        policy: private documents - can they be versioned?
    */
    var versionedDocs
        , privateDocs;

    var query = Feed.find({});
    query.where('versioned').equals("true");
    query.where('org', user.org);
    query.or([ { teams: user.teams }, { acl: user.uid } ]);
    query.sort('updated', -1);

    query.exec(function(err, docs) {
        var stack = [];
        docs.forEach(function(doc) {
            stack.push({
                uuid:               doc.uuid,
                owner:              doc.owner,
                displayName:        doc.content[0].displayName,
                tags:               doc.tags,
                teams:              doc.teams
            });
        });
        versionedDocs = stack;
    });

    query = Feed.find({});
    query.where('org', user.org);
    query.where(acl, user.uid);
    query.sort('updated', -1);

    query.exec(function(err, docs) {
        var stack = [];
        docs.forEach(function(doc) {
            stack.push({
                uuid:               doc.uuid,
                owner:              doc.owner,
                displayName:        doc.content[0].displayName,
                tags:               doc.tags,
                teams:              doc.teams
            });
        });
        privateDocs = stack;
    });

    fn && fn(true, versionedDocs + privateDocs);
};
exports.docLister = docLister;

/////////////////////////////////////
//    Document searcher
/////////////////////////////////////

// search for a document
var docSearcher = function(user, doc, slab, fn) {
    // construct the query
    var rx = new RegExp('/.*' + doc + '.*/'); // todo: choose a utf8-safe regexp?
    var query = Feed.find({});
    query.where('content.displayName', rx);
    query.where('org', user.org);
    query.or([ { teams: user.teams }, { acl: user.uid } ]);
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
exports.docSearcher = docSearcher;


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
    // maybe they have been stored there by another server instance
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

exports.init = UserFeedConstructor;

