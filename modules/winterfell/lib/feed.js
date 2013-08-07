
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
//   Content Feed Schema
////////////////////////////////

var ContentSchema = new Schema({
    id: String, // uuid of the uploaded file
    type: String, // mime-type of the content (can be string, video doc, etc)
    location: String // where does this content reside
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
    created: { type : Date, default: Date.now },
    updated: { type : Date, default: Date.now },
    content: [ContentSchema], // the content object
    tags: [TagSchema], // tags to group similar feeds
    acl: [String], // list of people having access to this
    children: [ChildFeedSchema] // stack of child feeds
});
FeedSchema.index({owner: 1, updated: -1});

FeedSchema.methods.Save = function(user, content, tagList, fn) {
    this.created = Date.now;
    this.owner = user._id;
    this.content = content;
    this.children = [];

    var that = this;
    if (tagList.length > 1) {
        tagList.forEach(function(t) {
            that.tags.push(t);
        });
    }

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
    if (this.tags.push(tag)) {
        this.updated = Date.now;
        this.save(function(err, u) {
            if (err) fn(err, null);
            else fn(null, u);
        });
    } else fn('Could not grant tag', null);
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

// Feed APIs
// NOTE: user here is passed from  req.user

// sample feed JSON request
//{
//    proj: project,
//    content: {},
//    tagList: []
//}

// todo: who will ensure that the json content is sane (not html etc etc security shit)
exports.NewFeed = function(User, json, fn) {
    var f = new Feed({});

    user.Find(User.uuid, function(err, u) {
        json.tagList.push(json.proj); // project is also a tag!

        // verify if user has permission to all projects (some tags are projects)
        if (!err && u) user.hasModifyPermission(u, json.tagList, function(err, pu) {
            // save the feed
            if (!err && pu) f.Save(pu, json.content, json.tagList, function(err, nf) {
                // update the user's stack with new content in the background
                pu.feedStack.Push(nf);
                fn(null, nf);
            });
            else fn('User does not have permission to create new feed', null);
        });
        else fn('Could not create new feed', null);
    });
};

exports.newChildFeed = function(User, json, fn) {
    findFeed(json.feedId, function(err, f) {
        if (!err && f) f.AddChild(User, json.content, function(err, mf) {
            // do some updations to all those subscribed to this main feed
            user.Find(mf.owner, function(err, o) {
                // this is supposed to delete any earlier references to
                // this feed and re-add it to the user's stack
                o.feedStack.Push(mf);
            });
            // push this update to all others in the access control list
            mf.acl.forEach(function(uid) {
                user.Find(uid, function(err, u) {
                    if (!err && u) u.feedStack.Push(mf);
                });
            });
            // okay.. done :D
            fn(null, mf);
        });
        else fn('Wrong parent feed', null);
    });
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
exports.FeedStack = FeedStack;
