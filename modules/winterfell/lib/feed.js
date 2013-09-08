
// schema library
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var uuid = require('node-uuid');
var _ = require('underscore');

var history = require('./history');
var framework = require('../../../framework'),
    permissions = framework.permissions;

var validation = require('./validation')
    , validate = validation.validate
    , createFeedSchema = validation.createFeedSchema
    , removeChildValidationSchema = validation.removeChildValidationSchema
    , removeFeedValidationSchema = validation.removeFeedValidationSchema;

////////////////////////////////
//   Utilities
////////////////////////////////

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

var getTeamDBConnection = function(team, user, fn) {
    // check if the user is a member of the team
    if (_.indexOf(user.teams, name) != -1)
        framework.findTeam(name, user.org, fn);

    // policy: in case of an admin, comply
    else if (permissions.hasAdminPermission(user, permissions.admin))
        framework.findTeam(name, user.org, fn);
    else
        fn('User is not part of the requested team');
};

/////////////////////////////////////////////
//   Content and ContentHistory Schemas
/////////////////////////////////////////////

var ContentSchema = new Schema({
    // every file name (corresponding to every version) is a uuid
    file: String, // this will be a uuid generated by frontend which uoploads the file
    mime: String, // mime-type of the content (can be string, video doc, etc)
    displayname: String, // file name they way it should be displayed or downloaded
    videoFiles: [String], // encoded video files
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
    org: String, // the owner'S organization
    private: Boolean, // for private posts
    created: { type : Date, default: Date.now() },
    updated: { type : Date, default: Date.now() },
    content: [ContentSchema], // the content object
    tags: [TagSchema], // tags to group similar feeds
    teams: [],
    acl: [String], // @mentions of people
    children: [ChildFeedSchema], // stack of child feeds
    versioned: { type: Boolean, default: false }, // is this versioned?
    associations: { type: Array } // any associations for other modules
});
FeedSchema.index({ owner: 1, updated: -1 });
FeedSchema.index({ teams: 1 });

// this is a virtual unix-style filesystem path for this feed
// can be used to uniquely identify this feed'S file
FeedSchema.virtual("path")
    .get(function() {
        return "/" + this.org + "/" + this.owner + "/" + this.content[0].displayname;
    });

// add history support for these feeds
history(FeedSchema);

/** JSON request structure:
 {
     "content": "",        // markdown
     "file": "",            // filename to be uploaded
     "mime": "",           // file mime type http://stackoverflow.com/questions/4581308/jquery-or-javascript-get-mime-type-from-url
     "name": ""             // display name of the file
     "location": ""         // location of the file
     "belongs": [],        // team (optional if private)
     "mentions": [],        // array of user's uids (optional)
     "private": "",        // boolean - private or public post
     "tags": [],           // optional - tags for faster searching
     "versioned": ""       // optional, boolean
     "associations": ""    // associations, request from different module
 }
 Output:
 {
    "uuid" : ""            // uuid of the new post
 }
 */
FeedSchema.methods.CreateFeed = function(user, json, fn) {
    if (validate(json, createFeedSchema)) {
        this.owner = user.uid;
        this.children = [];
        this.org = user.org;

        // fill-in the content
        this.content = [new Content({})];
        // for uploaded file
        this.content[0].file = json.file                    || '';
        this.content[0].mime = json.mime                    || '';
        this.content[0].displayname = json.name             || '';
        this.content[0].videoFiles = [];
        this.content[0].location = json.location            || '';
        this.content[0].description = json.content          || '';

        var that = this;

        // if the activity is private, only @mentions count, not teams
        if (json.private) {
            this.private = true;
            this.teams = [];
        } else if (json.belongs) {
            json.belongs.forEach(function(t) {
                // policy: only add teams that the user himself belongs to
                if(_.indexOf(user.teams, t) != -1) that.teams.push(t);
            });
        }

        // add all the tags
        if (json.tags) {
            json.tags.forEach(function(t) {
                that.tags.push(new Tag({ name: t }));
            });
        }

        // add all those who were mentioned to this feed's acl
        if (json.mentions) json.mentions.forEach(function(m) {
            // note: covered query
            framework.findUserbyuid(m, function(err, u) {
                if (!err && u) that.acl.push(u.uid);
            });
        });

          // todo: incorporate this when done testing - versioning is for files only
//        if (this.file)
        if (json.versioned) //history.enableHistory(this, this.path);
        {
            this.versioned = true;
            this.versionuid = json.historyId || this.path;
        }
        this.associations = json.associations       || {};

        // commit to DB
        this.save(function(err, t) {
            if (!err && t) fn(true, t);
            else fn(false, 'Could not save ' + err.message);
        });
    }
    else fn(false, 'Request format is wrong');
};

/** JSON request structure:
 {
     "content": "",        // markdown
     "file": "",            // filename to be uploaded
     "mime": "",           // file mime type http://stackoverflow.com/questions/4581308/jquery-or-javascript-get-mime-type-from-url
     "name": ""             // display name of the file
     "location": ""         // location of the file
     "belongs": [],        // team (optional if private)
     "mentions": [],        // array of user's uids (optional)
     "private": "",        // boolean - private or public post
     "tags": [],           // optional - tags for faster searching
     "versioned": ""       // optional, boolean
     "associations": ""    // associations, request from different module
     "historyId": ""       // unique Id of the actual document
 }
 Output:
 {
    "uuid" : ""            // uuid of the new post
 }
 */
FeedSchema.methods.Checkin = function(user, json, fn) {
    var that = this;

    this.CreateFeed(user, json, function(stat, f) {
        if (stat) {
            // note: if the historyId is missing implies that this is a
            // first-time checkin
            json.historyId = json.historyId || f.path;
            that.__checkin(null, user.uid, f, json.historyId, function(err, h) {
                if (!err) fn(true, {feed: f, history: h});
                else fn(false, err);
            });
        }
        else fn(stat, f);
    });
};

FeedSchema.methods.Checkout = function(user, json, fn) {
    this.__checkout(null, user.uid, json.historyId, false, function(err, h) {
        if (!err && h.uid != '') Feed.findById(h.uid, function(err, cf) {
            if (!err && cf) fn(true, cf);
            else fn(false, err);
        });
        else fn(false, err || 'Last checked-in instance is a problem');
    });
};

FeedSchema.methods.PullRequest = function(user, json, fn) {
    this.__pullRequest(null, user.uid, json.historyId, function(err, ret) {
        if (!err) fn(true, ret);
        else fn(false, err);
    });
};

FeedSchema.methods.AcceptPull = function(user, json, fn) {
    this.__acceptPullRequest(null, user.uid, json.historyId, json.number,
        function(err, ret) {
            if (!err) fn(true, ret);
            else fn(false, err);
    });
};

FeedSchema.methods.RejectPull = function(user, json, fn) {
    this.__rejectPullRequest(null, user.uid, json.historyId, json.number,
        function(err, ret) {
            if (!err) fn(true, ret);
            else fn(false, err);
    });
};

FeedSchema.methods.GetHistory = function(user, json, fn) {
    this.__getHistory(null, user.uid, json.historyId,
        function(err, ret) {
            if (!err) fn(true, ret);
            else fn(false, err);
        }
    );
};

FeedSchema.methods.GetFullHistory = function(user, json, fn) {
    this.__getFullHistory(null, user.uid, json.historyId,
        function(err, ret) {
            if (!err) fn(true, ret);
            else fn(false, err);
        }
    );
};

/** JSON request structure:
 {
    "uuid": ""            // uuid of the main post
 }
 Output:
 {
    "uuid": ""              // uuid of this post
 }
 */
FeedSchema.methods.Delete = function(user, json, fn) {
    if (validate(json, removeFeedValidationSchema)) {
        var u = this.uuid;
        this.remove(function(err) {
            if (!err) fn(null, { "uuid": u });
            else fn('Could not remove');
        });
    }
    else fn('Request format is wrong');
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
FeedSchema.methods.AddChild = function(user, json, fn) {
    if (validate(json, addChildSchema)) {
        var c = new ChildFeed({});
        c.owner = user.uid;
        c.created = Date.now();

        c.content = [new Content({})];
        c.content[0].description = json.content || "";

        // add all those who are mentioned to this post's acl
        var that = this;
        if (json.mentions) json.mentions.forEach(function(m) {
            // make sure this query is covered
            user.model("UserSchema").findOne({ uid: m }, { uid: 1 }, function(err, u) {
                // policy: we add the mentions in each sub-post to the main post:
                // afa security is concerned, this implies a friend-of-friend kind
                // of open-ness facilitating inter-team discussions
                if (!err && u) that.acl.push(u.uid);
            });
        });

        this.children.push(c);
        this.modified = Date.now();
        this.save(function(err, f) {
            if (!err || f) fn(null, { "uuid": c.uuid });
            else fn('Could not add child feed', null);
        });
    }
    else fn('Request format is wrong');
};

/** JSON request structure:
 {
    "uuid": ""                 // uuid of the main post
    "childuuid": ""            // uuid of the child post
 }
 Output:
 {
    "uuid": ""              // uuid of this child post
 }
 */
FeedSchema.methods.removeChild = function(json, fn) {
    if (validate(json, removeChildValidationSchema)) {
        var ctr = 0;
        var done = false;
        this.children.forEach(function(c) {
            if (c.uuid == json.childuuid) {
                done = true;
                c.remove(ctr);
                c.save(fn);
            }
            ctr++;
        });

        if (!done) fn('Could not find child', null);
    }
    else fn('Request format is wrong');
};

var Feed = mongoose.model("FeedSchema", FeedSchema);
exports.Feed = Feed;

// build indexes
Feed.ensureIndexes(function(err) { if (err) console.log('Could not ensure index'); });


// fucking costly function (unless feed is cached)
var findFeed = function(asker, uuid, fn) {
    var found = true;

    // see if this feed belongs to the asker himself
    // this kind of queries is more probable and we can serve
    // it in lesser time as 'owner' is indexed
    Feed.find({})
    .where('owner').equals(asker.uid)
    .where('uuid').equals(uuid)
    .exec(function(err, f) {
            if (!err && f) {
                fn(null, f);
                found = true;
            }
        });

    // fall-back to thew brute-force way
    if (!found) Feed.find({})
        .where('uuid').equals(uuid)
        .exec(function(err, f) {
            if (!err && f) {
                fn(null, f);
                found = true;
            } else fn('Could not find feed');
        });
};
exports.findFeed = findFeed;

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
exports.verify = verify;

