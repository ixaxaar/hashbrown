
// schema library
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
var uuid = require('node-uuid');

var _ = require('underscore');

// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

var history = require('./history');
var framework = require('../../../framework');

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

/////////////////////////////////////////////
//   Content and ContentHistory Schemas
/////////////////////////////////////////////

var ContentSchema = new Schema({
    // every file name (corresponding to every version) is a uuid
    file: String, // this will be a uuid generated by frontend which uoploads the file
    type: String, // mime-type of the content (can be string, video doc, etc)
    displayname: String, // file name they way it should be displayed or downloaded
    videoTypes: [String], // encoded video types stored on the server
    location: String, // locally accessible address of the content
    description: String // markdown - description of the content
});
exports.ContentSchema = ContentSchema;
ContentSchema.index({ displayName: 1 });
var Content = mongoose.model("ContentSchema", ContentSchema);

////////////////////////////////
//   Child Feed Schema
////////////////////////////////

// child feed schema
var ChildFeedSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    owner: String, // the owner's uuid
    created: { type : Date, default: Date.now() },
    updated: { type : Date, default: Date.now() },
    content: [ContentSchema] // the content object
});
// note: now this, sir, is gonna be costly.. todo: verify index impact on RAM
ChildFeedSchema.index({ owner: 1, updated: -1 });

var ChildFeed = mongoose.model("ChildFeedSchema", ChildFeedSchema);

// a one-field schema for now, maybe will be expanded later
var TagSchema = new Schema({
    name:   String
});
TagSchema.index({ name: 1 });

var Tag = mongoose.model("TagSchema", TagSchema);

////////////////////////////////
//   Feed Schema
////////////////////////////////

// feed schema
var FeedSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    owner: String, // the owner's uid
    private: Boolean, // for private posts
    created: { type : Date, default: Date.now() },
    updated: { type : Date, default: Date.now() },
    content: [ContentSchema], // the content object
    tags: [TagSchema], // tags to group similar feeds
    teams: [],
    acl: [String], // @mentions of people
    children: [ChildFeedSchema], // stack of child feeds
    versioned: { type: Boolean, default: false } // is this versioned?
});
FeedSchema.index({ owner: 1, updated: -1 });
FeedSchema.index({ teams: 1 });

// add histopry support for these feeds
history(FeedSchema);

/** JSON request structure:
 {
     "content": "",        // markdown
     "file": "",            // filename to be uploaded
     "type": "",           // file mime type http://stackoverflow.com/questions/4581308/jquery-or-javascript-get-mime-type-from-url
     "name": ""             // display name of the file
     "location": ""         // location of the file
     "belongs": [],        // team (optional if private)
     "mentions": [],        // array of user's uuids (optional)
     "private": "",        // boolean - private or public post
     "tags": [],           // optional - tags for faster searching
     "versioned": ""       // optional, boolean
 }
 Output:
 {
    "uuid" : ""            // uuid of the new post
 }
 */
var createFeedSchema = {
    "id": "/createFeedSchema",
    "type": "object",
    "properties": {
        "content": { "type": "string", "required": true },
        "file": { "type": "string" }, //todo:  should we make it mandatory to upload files as well?
        "name": { "type": "string" },
        "location": { "type": "string" },
        "belongs": {
            "type": "array",
            "items": "string"
        },
        "mentions": {
            "type": "array",
            "items": "string"
        }
    },
    "private": { "type": "string" },
    "tags": {
        "type": "array",
        "items": "string"
    },
    "versioned": { "type": "boolean" }
};
v.addSchema(createFeedSchema, '/createFeedSchema');

FeedSchema.methods.CreateFeed = function(user, json, fn) {
    if (!v.validate(json, createFeedSchema).errors.length) {
        this.created = Date.now();
        this.owner = user.uid;
        this.children = [];

        // fill-in the content
        this.content = [new Content({})];
        // for uploaded file
        if (json.file) {
            this.content[0].file = json.file;
            this.content[0].type = (json.type) ? json.type : null;
            this.content[0].displayname = (json.name) ? json.name : json.file;
            this.content[0].videoTypes = null; // not yet, not yet!
            this.content[0].location = (json.location) ? json.location : null;
        }
        this.content[0].description = (json.description) ? json.content : "";

        var that = this;

        // if the activity is private, only @mentions count, not teams
        if (json.private) {
            this.private = true;
            this.teams = [];
        } else if (json.belongs.length) {
            json.belongs.forEach(function(t) {
                // only add teams that the user himself belongs to
                if(_.indexOf(user.teams, t) != -1)
                    that.teams.push(t);
            });
        }

        // add all the tags
        if (json.tags.length) {
            json.tags.forEach(function(t) {
                that.tags.push(new Tag({ name: t }));
            });
        }

        // add all those who were mentioned to this feed's acl
        json.mentions.forEach(function(m) {
            // note: covered query
            user.model("UserSchema").findOne({ uid: m }, { uid: 1 }, function(err, u) {
                if (!err && u) that.acl.push(u.uid);
            });
        });

        // if verdsioning is asked to be enabled
        if (json.versioned) this.versioned = true;

        // commit to DB
        this.save(function(err, t) {
            if (!err || t) fn(null, { "uuid": t.uuid });
            else fn('Could not save', null);
        });
    }
    else fn('Request format is wrong');
};

FeedSchema.methods.Delete = function(fn) {
    this.remove(fn);
};

/** JSON request structure:
 {
     "uuid": ""            // uuid of the main post
     "content": "",        // markdown
     "mentions": [],        // array of mentions (optional)
 }
 Output:
 {
    "uuid": ""              // uuid of this child post
 }
 */
var addChildSchema = {
    "id": "/createFeedSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "content": { "type": "string", "required": "true" },
        "mentions": {
            "type": "array",
            "items": "string"
        }
    }
};
FeedSchema.methods.AddChild = function(user, json, fn) {
    if (!v.validate(json, createFeedSchema).errors.length) {
        var c = new ChildFeed({});
        c.owner = user.uid;
        c.created = Date.now();

        c.content = [new Content({})];
        (json.content) ? c.content[0].description = json.content : "";
        if (json.content) c.content[0].description = json.content;

        // add all those who are mentioned to this post's acl
        var that = this;
        if (json.mentions) json.mentions.forEach(function(m) {
            // make sure this query is covered
            user.model("UserSchema").findOne({ uid: m }, { uid: 1 }, function(err, u) {
                // we add the mentions in each sub-post to the main pot:
                // afa security is concerned, this implies a friend-of-friend kind
                // of open-ness facilitating inter-team discussions
                if (!err && u) that.acl.push(u.uid);
            });
        });

        this.children.push(c);
        this.modified = Date.now();
        this.save(function(err, f) {
            if (!err || f) fn(null, { "uuid": _.last(f.children).uuid });
            else fn('Could not add child feed', null);
        });
    }
    else fn('Request format is wrong');
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

////////////////////////////////////////
//      Permissions
////////////////////////////////////////

var verify = function(requestor, resource) {
    // the "usual" way - this resource belongs to the requesting guy
    // give him access
    if (requestor.uid === resource.owner)
        return true;

    // the "admin"'s special way - all admins and higher get full access
    // todo: what about managers? well, they get squat
    return (requestor.org === resource.org) &&
            (requestor.perm[0].admin >= framework.Permission.admin);
};



var RequestRouter = function(req, res, next) {
    if (req.body)
    switch(req.body.request) {
        case 'newfeed':
            var F = new Feed({});
            F.CreateFeed(req.user, req.body.body, function(err, f) {
                if (!err) res.send(f);
                else res.send(err);
            });
            break;

        case 'newchildfeed':
            if (req.body && req.body.body && req.body.body.teams.length)
            Feed.findOne({ "tags.name": req.body.body.teams[0],  "uuid": req.body.body.uuid },
                function(err, f) {
                    if (f) f.AddChild(req.user, req.body.body, function(err, af) {
                        if (!err) res.send(af);
                        else res.send(err);
                    });
                    else res.send(err);
                });

    }
};

module.exports = RequestRouter;


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
