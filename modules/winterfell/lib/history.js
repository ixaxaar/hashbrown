
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
    name: String, // has to be unique and linked to the main object in some way
    versions: [__ContentHistorySchema], // array of pervious version posts
    hanging: [__ContentHistorySchema], // un-reviewed versions
    accepts: [__ContentHistorySchema] // history of accepted versions
});
var ContentHistory = mongoose.model("ContentHistorySchema", ContentHistorySchema);


// accept a hanging version as a new version
// note: in these methods, the original posts are __not__ removed
var Accept = function(user, commit, fn) {
    var history = this.connection.model('ContentHistorySchema');

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            if (his[0].hanging.length >= commit) {
                var rev = his[0].hanging[commit];
                his[0].hanging.remove(commit);
                his[0].versions.push(rev);
                his[0].save(fn);
            }
            else fn('no history found for this document');
        }
        else fn('Error fetching history of this document');
    });
};

// reject a hanging version
var Reject = function(user, commit, fn) {
    var history = this.connection.model('ContentHistorySchema');

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            if (his[0].hanging.length >= commit) {
                his[0].hanging.remove(commit);
                his[0].save(fn);
            }
            else fn('no history found for this document');
        }
        else fn('Error fetching history of this document');
    });
};

// delete a versioned commit
var Delete = function(user, commit, fn) {
    var history = this.connection.model('ContentHistorySchema');

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            if (his[0].hanging.length >= commit) {
                his[0].versions.remove(commit);
                his[0].save(fn);
            }
            else fn('no history found for this document');
        }
        else fn('Error fetching history of this document');
    });
};

// accept a number of hanging versions and add this as a new version
var AcceptMerged = function(user, commits, fn) {
    var history = this.connection.model('ContentHistorySchema');
    var that = this;

    history.find({name: this.content.displayname}, function(err, his) {
        if (his.length) {
            // delete the hanging comments and push them into accepts
            commits.forEach(function(c) {
                if (his[0].hanging.length >= c) {
                    var rev = his[0].hanging[c];
                    his[0].hanging.remove(c);
                    his[0].accepts.push(rev);
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

var NewCommit = function(doc, fn) {
    var history = doc.connection.model('ContentHistorySchema');

    history.find({name: doc.content.displayname}, function(err, his) {
        if (!his.length) {
            var newhistory = new history({});
            newhistory.name = doc.displayname;
            newhistory.versions = [new __ContentHistory({ content: doc.uuid })];
            newhistory.hanging = [];
            his[0] = newhistory;
        }
        else his[0].hanging.push(new __ContentHistory({content: doc.content}));

        his[0].save(fn);
    });
};

var PreSave = function(next, done) {
    // nothing
};

var PostSave = function(doc){
    // if the document is versioned, document the recent history
    if (doc.versioned) {
        NewCommit(doc, function(err) {
            console.log('Could not save history: ' + err.message);
        });
    }
};

// extend the schemas with history functions
module.exports = function(schema) {
    schema.methods.pullCommit = Accept;
    schema.methods.deleteCommit = Reject;
    schema.methods.mergeCommits = AcceptMerged;
    schema.methods.commit = NewCommit;
    schema.methods.deleteVersion = Delete;

    schema.pre('save', PreSave);
    schema.post('save', PostSave);
};

