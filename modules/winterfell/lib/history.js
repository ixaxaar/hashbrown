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


var goose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = Schema.ObjectId;

var mongoose = goose.createConnection('mongodb://localhost/history');

var uuid = require('node-uuid');
var _ = require('underscore');


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.r2d2 = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

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
var _history = goose.model("_history", __contentHistorySchema);

// maintain the history of previous versions of content
var contentHistorySchema = new Schema({
    name: { type: String, default: uuid.v4() },                 // has to be unique and linked to the main object in some way
    owner: String,                                              // owner of this document, all mergeRequsts go to him
    timeline: [__contentHistorySchema],                         // entire timeline of version changes todo: is this a good idea?
    pullRequests: [Number],                                     // requests to merge documents to create a new version, points to timeline
    versions: [Number],                                         // array of pervious versions, points to timeline
    locked: Boolean                                             // whether this file is locked (only owner can lock a file)
});
// contentHistorySchema.index({ name: 1 });
var history = goose.model("history", contentHistorySchema);

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

var getLatest = function (conn, user, uniqueId, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    if (uniqueId) {
        history.findOne({ name: uniqueId }, function(err, h) {
            if (h) fn(null, h.timeline[_.last(h.versions)]);
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
            var lastRequestAcceptedIndex = requestsAccpeted ? _.last(requestsAccpeted).index : 0;

            // find all the user's checkins after the last pulled checkin
            var commitsByUser = _.filter(h.timeline, function(_h) {
                return !!(_h.user === user &&
                    _h.action === actions.checkin &&
                    _h.index > lastRequestAcceptedIndex);
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
            h.pullRequests.push((h.timeline.length - 1));
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
            var index = h.pullRequests[number];
            if (index) {
                // yes, this is hokus-pokus to delete an array element and
                // for mongoose to realize that the array has changes
                // markModified sounds good but does not work here.
                var off = h.pullRequests.length - number;
                var popped = [];
                while(off--) popped.push(h.pullRequests.pop());
                popped.pop();
                while(popped.length) h.pullRequests.push(popped.pop());

                var ver = bump( _.last(h.timeline).version );
                h.timeline.push( new _history({
                    uid: "",
                    user: user,
                    version: ver,
                    action: actions.acceptPull,
                    related: [index],
                    index: h.timeline.length
                }) );
                // determine the last version
                var last_ver = 0;
                try {
                    console.log(h.timeline[_.last(h.timeline[index].related)])
                    last_ver = h.timeline[_.last(h.timeline[index].related)].index;
                } catch (e) { last_ver = 0; }
                console.log(last_ver)
                if (last_ver) h.versions.push(last_ver);
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
            var index = h.pullRequests[number];
            if (index) {
                // yes, this is hokus-pokus to delete an array element and
                // for mongoose to realize that the array has changes
                // markModified sounds good but does not work here.
                var off = h.pullRequests.length - number;
                var popped = [];
                while(off--) popped.push(h.pullRequests.pop());
                popped.pop();
                while(popped.length) h.pullRequests.push(popped.pop());

                var ver = bump( _.last(h.timeline).version );
                h.timeline.push( new _history({
                    uid: "",
                    user: user,
                    version: ver,
                    action: actions.acceptPull,
                    related: [index],
                    index: h.timeline.length
                }) );
                h.save(fn);
            }
            else fn('Documents checkin does not exist');
        }
        else fn('Documents history does not exist');
    });
};

var getHistory = function(conn, user, uniqueId, fn) {
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

var getFullHistory = function(conn, user, uniqueId, fn) {
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

// POLICY: controversial area, can we delete feeds associated with history?
var purgeDoc = function(conn, user, doc, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: doc.path }, function(err, h) {
        if (h) {
            h.timeline.forEach(function(s) {
                if (s.uid === doc._id) s.uid = null;
            });

            // keep on popping till the last remaining version
            // points to something that exists
            while(1) {
                if (h.timeline[_.last(h.versions)] === null)
                    h.versions.pop();
                else break;
            }

            fn && fn(null);
        }
        else fn && fn('Documents history does not exist');
    });
};

var purgeHistory = function(conn, user, uniqueId, fn) {
    conn = conn || mongoose;

    var history = conn.model('history');
    history.findOne({ name: uniqueId }, function(err, h) {
        if (h && h.owner === user) h.remove(fn);
        else fn && fn('Documents history does not exist');
    });
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
    schema.methods.__purgeDoc             = purgeDoc;
    schema.methods.__purgeHistory         = purgeHistory;
    schema.methods.__checkoutAndLock      = checkoutAndLock;
//    schema.methods.__checkinAndUnlock     = checkinAndUnlock;
    schema.methods.__pullRequest          = pullRequest;
    schema.methods.__acceptPullRequest    = acceptPullRequest;
    schema.methods.__rejectPullRequest    = rejectPullRequest;
    schema.methods.__getLatest            = getLatest;
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

