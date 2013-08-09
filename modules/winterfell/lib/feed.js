
// schema library
var mongoose = require('mongoose');
var uuid = require('node-uuid');

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

////////////////////////////////
//   Content Schema
////////////////////////////////

var ContentSchema = new Schema({
    id: String, // uuid of the uploaded file (one feed = one file)
    type: String, // mime-type of the content (can be string, video doc, etc)
    location: String, // where does this content reside
    description: String // markdown
});

var Content = mongoose.model("ContentSchema", ContentSchema);

////////////////////////////////
//   Child Feed Schema
////////////////////////////////

// child feed schema
var ChildFeedSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    owner: String, // the owner's uuid
    created: { type : Date, default: Date.now },
    updated: { type : Date, default: Date.now },
    content: [ContentSchema] // the content object
});
// note: now this, sir, is gonna be costly.. todo: verify index impact on RAM
ChildFeedSchema.index({ owner: 1, updated: -1 });

var ChildFeed = mongoose.model("ChildFeedSchema", ChildFeedSchema);

var TagSchema = new Schema({
    name:   String,
    team: Boolean
});
TagSchema.index({ name: 1 });

var Tag = mongoose.model("TagSchema", TagSchema);

////////////////////////////////
//   Feed Schema
////////////////////////////////

// feed schema
var FeedSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    owner: String, // the owner's uuid
    private: Boolean, // for private posts
    created: { type : Date, default: Date.now },
    updated: { type : Date, default: Date.now },
    content: [ContentSchema], // the content object
    tags: [TagSchema], // tags to group similar feeds
    acl: [String], // list of people having access to this
    children: [ChildFeedSchema] // stack of child feeds
});
FeedSchema.index({owner: 1, updated: -1});

FeedSchema.methods.CreateFeed = function(user, json, fn) {
//    {
//        "content": "",		// markdown
//        "file": "",			// filename to be uploaded
//        "belongs": [],		// team (optional if private)
//        "mentions": [],		// array of team-mates (optional)
//        "private": "",		// boolean - private or public post
//        "tags": []			// optional - tags for faster searching
//    }

    this.created = Date.now;
    this.owner = user.uid;
    this.content = json.content;
    this.children = [];

    var that = this;

    // if the activity is private
    if (json.private) {
        this.private = true;
    } else {
    }

    if (tagList.length) {
        tagList.forEach(function(t) {
            that.tags.push(t);
        });
    }

    // add and update other user's feeds
    json.mentions.forEach(function(m) {
        // make sure this query is covered
        Users.findOne({ uid: m }, { uid: 1 }, function(err, u) {
            if (!err && u) that.acl.push(u);
        });
    });

    // 'updated' gets autoupdated here
    this.save(function(err, t) {
        if (!err || t) fn(null, t);
        else fn('Could not save', null);
    });
};

FeedSchema.methods.ModifyContent = function(content, fn) {
    // modify content
    this.content = content;
    this.updated = Date.now;
    this.save(function(err, f) {
        if (err || !f) fn('Could not modify content', null);
        else fn(null, f);
    });
};

FeedSchema.methods.AddTag = function(tag, fn) {
    // append to the access control list
    var t =  new Tag({name: tag});
    if (this.tags.push(t)) {
        this.updated = Date.now;
        this.save(function(err, u) {
            if (err) fn(err, null);
            else fn(null, u);
        });
    } else fn('Could not add tag', null);
};

FeedSchema.methods.RemoveTag = function(tag, fn) {
    // append to the access control list
    if (this.tags.remove(tag)) {
        this.updated = Date.now;
        this.save(function(err, u) {
            if (err) fn(err, null);
            else fn(null, u);
        });
    } else fn('Could not remove tag', null);
};

FeedSchema.methods.GrantAccess = function(user, fn) {
    // append to the access control list
    if (this.acl.push(user)) {
        this.updated = Date.now;
        this.save(function(err, u) {
            if (err) fn(err, null);
            else fn(null, u);
        });
    } else fn('Could not grant permission', null);
};

FeedSchema.methods.RevokeAccess = function(user, fn) {
    // append to the access control list
    if (this.acl.remove(user)) {
        this.updated = Date.now;
        this.save(function(err, u) {
            if (err) fn(err, null);
            else fn(null, u);
        });
    } else fn('Could not remove permission', null);
};

FeedSchema.methods.Delete = function(fn) {
    this.remove(fn);
};

FeedSchema.methods.AddChild = function(user, content, fn) {
    var c = new ChildFeed({});
    c.owner = user._id;
    c.created = Date.now;
    c.content = content;

    this.children.push(child);
    this.modified = Date.now;
    this.save(function(err, f) {
        if (!err || f) fn(null, f);
        else fn('Could not add child feed', null);
    });
};

FeedSchema.methods.removeChild = function(uuid, fn) {
    var ctr = 0;
    this.children.forEach(function(c) {
        if (c.uuid == uuid) {
            fn(null, c.remove(ctr));
        }
        ctr++;
    });

    if (ctr == this.children.length) fn('Could not find child', null);
};

var Feed = mongoose.model("FeedSchema", FeedSchema);
//exports.Feed = Feed;

// build indexes
Feed.ensureIndexes(function(err, obj) { if (err) console.log('Could not ensure index'); });

// fucking costly function (unless feed is cached), avoid as much as possible
var findFeed = function(uuid, fn) {
    // todo: return the cached one if present
    Feed.find({ uuid: uuid }, function(err, f) {
        if (!err || f) fn(null, f);
        else fn('Could not find feed', null);
    });
};
exports.FindFeed = findFeed;

module.exports = RequestRouter;
RequestRouter = function(req, res, next) {
};


// todo: implement caching in memcached

////////////////////////////////
//   Feed Stack Schema
////////////////////////////////

// the stack of feeds constructed for each user
// one stack per user 
var FeedStackSchema = new Schema({
    owner: String, // the _id of the user
    recentStack: [FeedSchema], // the more recent and probably cached part of stack
    archiveStack: String // the archived part of the stack
});

FeedStackSchema.methods.Push = function(feed) {
    this.recentStack.push(feed);
    this.CompactAndSave(); // save after compacting / archiving
};

var FeedStack = mongoose.model("FeedStackSchema", FeedStackSchema);
