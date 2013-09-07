//    The MIT License (MIT)
//
//    Copyright (c) 2013 Russi Chatterjee
//
//    Permission is hereby granted, free of charge, to any person obtaining a copy
//    of this software and associated documentation files (the "Software"), to deal
//    in the Software without restriction, including without limitation the rights
//    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//    copies of the Software, and to permit persons to whom the Software is
//    furnished to do so, subject to the following conditions:
//
//    The above copyright notice and this permission notice shall be included in
//    all copies or substantial portions of the Software.
//
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//    THE SOFTWARE.


var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var uuid = require('node-uuid');
var _ = require('underscore');

var actions = {
    none:               0,
    checkout:           1,
    checkin:            2,
    pull:               3,
    acceptPull:         4,
    rejectPull:         5
};

// the unit of each ContentHistory element, does not have separate collection in db
var __contentHistorySchema = new Schema({
    uid: String,                                                // uid of the actual document
    user: String,                                               // a unique identifier for identifying the user
    version: Number,                                            // version number associated with this change
    changed: { type: Date, default: Date.now() },
    action: Number,                                             // the action that was taken at this point
    related: [Number],                                         // all _history-s from timeline related to this
    index: Number
});
var _history = mongoose.model("_history", __contentHistorySchema);

// maintain the history of previous versions of content
var contentHistorySchema = new Schema({
    name: { type: String, default: uuid.v4() },                 // has to be unique and linked to the main object in some way
    owner: String,                                              // owner of this document, all mergeRequsts go to him
    locked: Boolean,                                            // whether this file is locked (only owner can lock a file)
    timeline: [__contentHistorySchema],                         // entire timeline of version changes todo: is this a good idea?
    versions: [Number],                                         // array of pervious versions, points to timeline
    pullRequests: [Number]                                      // requests to merge documents to create a new version, points to timeline
});
// contentHistorySchema.index({ name: 1 });
var history = mongoose.model("history", contentHistorySchema);

var bump = function(ver) {
    return ver + 1;
};

var checkin = function (conn, user, doc, uniqueId, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    if (doc.versioned) {
        if (uniqueId) {
            history.findOne({ name: uniqueId }, function(err, h) {
                if (h && h.locked) fn('This document is locked');
                else if (h) {
                    var ver = bump( _.last(h.timeline).version );
                    h.timeline.push( new _history({ 
                        uid: doc._id, 
                        user: user,
                        version: ver, 
                        action: actions.checkin,
                        index: h.timeline.length
                    }) );
                    h.save(fn);
                }
                // otherwise, this is the first time this doc is being checked-in, hurray
                else {
                    var h = new history({
                        name: uniqueId,
                        owner: user,
                        timeline: [ new _history({
                            uid: doc._id,
                            user: user,
                            version: 0,
                            action: actions.checkin,
                            index: 0
                        }) ],
                        versions: [ 0 ]
                    });
                    h.save(fn);
                }
            });
        }
        else fn('No uniqueId supplied');
    }
    else fn('The document is not versioned');
};

var checkout = function (conn, user, uniqueId, lock, fn) {
    conn = conn || mongoose;
    lock = lock || false;

    var history = conn.model('history');
    if (uniqueId) {
        history.findOne({ name: uniqueId }, function(err, h) {
            if (h && h.locked) fn('This document is locked');
            else if (h) {
                h.timeline.push( new _history({ 
                    uid: "",
                    user: user,
                    version: "",
                    action: actions.checkout,
                    index: h.timeline.maxlength
                }) );
                if (lock) h.locked = true;
                // save the request in the document's timeline
                h.save(function(err, sh) {
                    if (!err) fn(null, sh.timeline[_.last(sh.versions)]);
                    else fn('Could not save history');
                });
            }
            else fn('Documents history does not exist');
        });
    }
    else fn('Invalid parameters');
};

var checkoutAndLock = function (conn, user, uniqueId, fn) {
    checkout(conn, user, uniqueId, true, fn);
};

var pullRequest = function(conn, user, uniqueId, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: uniqueId }, function(err, h) {
        if (h) {
            // find all the pull requests that have been accepted for the user
            var requestsAccpeted = _.filter(h.timeline, function(_h) {
                return !!(_h.user === user && _h.action === actions.acceptPull);
            });

            // sort all the accepted pull requests
            var sortAcceptedPullrequest = _.sortBy(requestsAccpeted, function(r) {
                return r.changed;
            });

            // okay so we got the lastaccepted pull request here
            // next thing we want are all the checkins done by user
            // after this pull was requested
            // map last-acc-pull -> pull -> [checkins]
            var lastAcceptedPullrequest = _.last(sortAcceptedPullrequest);
            var lastPull = lastAcceptedPullrequest.related;
            var timeThreshold = lastPull.changed;

            // find all the user's checkins after the last pulled checkin
            var commitsByUser = _.filter(h.timeline, function(_h) {
                return !!(_h.user === user &&
                    _h.action === actions.checkin &&
                    _h.changed > timeThreshold);
            });
            var commits = [];
            commitsByUser.forEach(function(c) { commits.push(c.index) } );

            h.timeline.push( new _history({
                uid: "",
                user: user,
                version: "",
                action: actions.pull,
                related: commits,
                index: h.timeline.length
            }) );
            h.pullRequests.push(h.timeline.length - 1);
            h.save(fn);
        }
        else fn('Documents history does not exist');
    });  
};

var acceptPullRequest = function(conn, user, uniqueId, number, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: uniqueId }, function(err, h) {
        if (h) {
            if (h.pullRequests[number]) {
                var ver = bump( _.last(h.timeline).version );
                h.timeline.push( new _history({
                    uid: "",
                    user: user,
                    version: ver,
                    action: actions.acceptPull,
                    related: [h.pullRequests[number]],
                    index: h.timeline.length
                }) );
                h.versions.push(h.timeline.length - 1);
                h.pullRequests.remove(number);
                h.save(fn);
            }
            else fn('Documents checkin does not exist');
        }
        else fn('Documents history does not exist');
    });
};

var rejectPullRequest = function(conn, user, uniqueId, number, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: uniqueId }, function(err, h) {
        if (h) {
            if (h.pullRequests[number]) {
                var ver = bump( _.last(h.timeline).version );
                h.timeline.push( new _history({
                    uid: "",
                    user: user,
                    version: ver,
                    action: actions.rejectPull,
                    related: [h.pullRequests[number]],
                    index: h.timeline.length
                }) );
                h.pullRequests.remove(number);
                h.save(fn);
            }
            else fn('Documents checkin does not exist');
        }
        else fn('Documents history does not exist');
    });
};

var getHistory = function(conn, uniqueId, user, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: uniqueId }, function(err, h) {
        if (h) {
            fn(null,_.filter(h.timeline, function(_h) {
                return !!(_h.user === user);
            }));
        }
        else fn('Documents checkin does not exist');
    });
};

var getFullHistory = function(conn, uniqueId, user, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: uniqueId }, function(err, h) {
        if (h) {
            fn(null, h.timeline);
        }
        else fn('Documents checkin does not exist');
    });
};

var enableHistory = function(uniqueId) {
    if (uniqueId) {
        this.versioned = true;
        this.versionuid = uniqueId;
    }
};

var History = function(schema) {
    // add these fields to the schema
    // versioned: indicates whether a document is versioned
    // versionuid: points to the document's contentHistory
    schema.add({ versioned: { type: Boolean, default: false } });
    schema.add({ versionuid: { type: String } });

    // add these schema methods
    schema.methods.__checkin              = checkin;
    schema.methods.__checkout             = checkout;
    schema.methods.__checkoutAndLock      = checkoutAndLock;
//    schema.methods.__checkinAndUnlock     = checkinAndUnlock;
    schema.methods.__pullRequest          = pullRequest;
    schema.methods.__acceptPullRequest    = acceptPullRequest;
    schema.methods.__rejectPullRequest    = rejectPullRequest;
    schema.methods.__getHistory           = getHistory;
    schema.methods.__getFullHistory       = getFullHistory;
    schema.methods.__enableHistory        = enableHistory;

    // schema middleware: bad idea :(
//    schema.pre('save', preSave);
//    schema.post('save', postSave);
};

// enable versioning for a document
// uniqueId can be constructed for e.g. as a virtual of the schema (e.g. like a unix path)
History.prototype.enableHistory = function(document, uniqueId) {
    if (document && uniqueId) {
        document.versioned = true;
        document.versionuid = uniqueId;
    }
};

// extend the schemas with history functions
module.exports = exports = History;

