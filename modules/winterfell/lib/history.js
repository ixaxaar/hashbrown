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

var feed = require('./feed');

// the unit of each ContentHistory element, does not have separate collection in db
var __ContentHistorySchema = new Schema({
    uid: String, // uuid of the post
    changed: { type: Date, default: Date.now() },
});
var __ContentHistory = mongoose.model("__ContentHistorySchema", __ContentHistorySchema);

// maintain the history of previous versions of content
var ContentHistorySchema = new Schema({
    name: { type: String, default: "" }, // has to be unique and linked to the main object in some way
    versions: [__ContentHistorySchema], // array of pervious version posts
    toReview: [__ContentHistorySchema], // un-reviewed versions
    accepted: [__ContentHistorySchema], // history of accepted versions
    rejected: [__ContentHistorySchema]  // history of rejected versions
});
mongoose.model("ContentHistorySchema", ContentHistorySchema);


// accept a toReview version as a new version
// note: in these methods, the original posts are __not__ removed
var acceptCommit = function(conn, uid, commit, fn) {
    if (conn && doc && uid && commit) {
        var history = conn.model('ContentHistorySchema');

        history.find({ name: uid }, function(err, his) {
            if (his.length) {
                if (his[0].toReview.length > commit) {
                    var rev = his[0].toReview[commit];
                    his[0].toReview.remove(commit);
                    his[0].versions.push(rev);
                    his[0].save(fn);
                }
                else fn('No history found for this document');
            }
            else fn('Error fetching history of this document');
        });
    }
    else fn && fn('Insufficient parameters');
};

// reject a toReview version
var rejectCommit = function(conn, uid, commit, fn) {
    if (conn && doc && uid && commit) {
        var history = conn.model('ContentHistorySchema');

        history.find({ name: uid }, function(err, his) {
            if (his.length) {
                if (his[0].toReview.length > commit) {
                    var rev = his[0].toReview[commit];
                    his[0].toReview.remove(commit);
                    his[0].rejected.push(rev);
                    his[0].save(fn);
                }
                else fn('No history found for this document');
            }
            else fn('Error fetching history of this document');
        });
    }
    else fn && fn('Insufficient parameters');
};

// delete a versioned commit
var deleteCommit = function(user, commit, fn) {
    var history = this.connection.model('ContentHistorySchema');

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            if (his[0].versions.length >= commit) {
                var rev = his[0].toReview[commit];
                his[0].versions.remove(commit);
                his[0].rejected.push(rev);
                his[0].save(fn);
            }
            else fn('no history found for this document');
        }
        else fn('Error fetching history of this document');
    });
};

// accept a number of toReview versions and add this as a new version
var version = function(conn, doc, uid, fn) {
    if (conn && doc && uid) {
        var history = conn.model('ContentHistorySchema');

        history.find({ name: uid }, function(err, his) {
            if (his.length) {
                // add this's content as a new version
                his[0].versions.push(new __ContentHistory({ uid: doc._id }));
                // save the history structure
                his[0].save(fn);
            }
            else fn('Error fetching history of this document');
        });
    }
    else fn && fn('Insufficient parameters');
};

var newCommit = function(conn, doc, uid, fn) {
    if (conn && doc && uid) {
        var history = conn.model('ContentHistorySchema');

        history.find({ name: uid }, function(err, his) {
            if (!his.length) {
                // the history for this document does not exist, create a new one
                var newhistory = new history({});
                newhistory.name = uid;
                // policy: first commit is a new version, not a toReview
                newhistory.versions = [new __ContentHistory({ uid: doc._id })];
                newhistory.toReview = [];
                newhistory.save(fn);
            }
            else {
                // okay, so history exists, add this bare commit to toReview
                his[0].toReview.push(new __ContentHistory({ uid: doc._id}));
                his[0].save(fn);
            }
        });
    }
    else fn && fn('Insufficient parameters');
};

var getHistory = function(conn, uid, fn) {
    if (conn && uid) {
        history.find({ name: uid }, function(err, his) {
            if (his.length) {
                var hist = his[0];

                //sanitize all _ids and other mongoDB stuff if any
                delete hist[_id];
                for (var key in hist.versions)
                    if (hist.versions.hasOwnProperty(key))
                        if (key === '_id' || key === '__v')
                            delete hist.versions[key];
                for (var key in hist.toReview)
                    if (hist.versions.hasOwnProperty(key))
                        if (key === '_id' || key === '__v')
                            delete hist.versions[key];
                for (var key in hist.accepted)
                    if (hist.versions.hasOwnProperty(key))
                        if (key === '_id' || key === '__v')
                            delete hist.versions[key];
                for (var key in hist.rejected)
                    if (hist.versions.hasOwnProperty(key))
                        if (key === '_id' || key === '__v')
                            delete hist.versions[key];

                fn(null, hist);
            }
            else fn('Error fetching history of this document');
        });
    }
    else fn && fn('Insufficient parameters');
};

//var preSave = function(next, done) {
//    // nothing
//};
//
//var postSave = function(doc){
//    // if the document is versioned, document the recent history
//    if (doc.versioned) {
//        newCommit(doc, function(err) {
//            log('err', 'Could not save history: ' + err.message);
//        });
//    }
//};

var history = function(schema) {
    // add these field to the schema
    // versioned: indicates whether a document is versioned
    // versionuuid: indicates points to the document's contentHistory
    schema.add({ versioned: { type: Boolean, default: (defaultEnabled || false) } });
    schema.add({ versionuuid: { type: String, default: "" } });

    // add these schema methods
    schema.methods.addToReview = newCommit;
    schema.methods.acceptReview = acceptCommit;
    schema.methods.rejectReview = rejectCommit;
    schema.methods.version = version;
    schema.methods.deleteVersion = deleteCommit;
    schema.methods.getHistory = getHistory;

    // schema middleware: bad idea :(
//    schema.pre('save', preSave);
//    schema.post('save', postSave);
};

// enable versioning for a document
history.prototype.enableHistory = function(document) {
    document.versioned = true;
    document.versionuuid = uuid.v4();
};

// extend the schemas with history functions
module.exports = exports = history;

