
// schema library
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var uuid = require('node-uuid');
var _ = require('underscore');

var feed = require('./feed');

// the unit of each ContentHistory element, does not have separate collection in db
var __ContentHistorySchema = new Schema({
    uuid: String, // uuid of the post
    changed: { type: Date, default: Date.now() },
    content: [feed.ContentSchema] // note: content is not destroyed, it is linked!
});
var __ContentHistory = mongoose.model("__ContentHistorySchema", __ContentHistorySchema);

// maintain the history of previous versions of content
var ContentHistorySchema = new Schema({
    name: { type: String, default: "" }, // has to be unique and linked to the main object in some way
    versions: [__ContentHistorySchema], // array of pervious version posts
    toReview: [__ContentHistorySchema], // un-reviewed versions
    accepted: [__ContentHistorySchema] // history of accepted versions
});
var ContentHistory = mongoose.model("ContentHistorySchema", ContentHistorySchema);


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
var rejectCommit = function(user, commit, fn) {
    var history = this.connection.model('ContentHistorySchema');

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            if (his[0].toReview.length >= commit) {
                his[0].toReview.remove(commit);
                his[0].save(fn);
            }
            else fn('no history found for this document');
        }
        else fn('Error fetching history of this document');
    });
};

// delete a versioned commit
var deleteCommit = function(user, commit, fn) {
    var history = this.connection.model('ContentHistorySchema');

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            if (his[0].toReview.length >= commit) {
                his[0].versions.remove(commit);
                his[0].save(fn);
            }
            else fn('no history found for this document');
        }
        else fn('Error fetching history of this document');
    });
};

// accept a number of toReview versions and add this as a new version
var acceptMerged = function(user, commits, fn) {
    var history = this.connection.model('ContentHistorySchema');
    var that = this;

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            // delete the toReview comments and push them into accepted
            commits.forEach(function(c) {
                if (his[0].toReview.length >= c) {
                    var rev = his[0].toReview[c];
                    his[0].toReview.remove(c);
                    his[0].accepted.push(rev);
                }
            });
            // add this's content as a new version
            his[0].versions.push(that.content);
            // save the history structure
            his[0].save(fn);
        }
        else fn('Error fetching history of this document');
    });
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
                newhistory.versions = [new __ContentHistory({ content: doc._id })];
                newhistory.toReview = [];
                newhistory.save(fn);
            }
            else {
                // okay, so history exists, add this bare commit to toReview
                his[0].toReview.push(new __ContentHistory({content: doc.content}));
                his[0].save(fn);
            }
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
    schema.methods.mergeCommits = acceptMerged;
    schema.methods.deleteVersion = deleteCommit;

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

