
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
    , validate = validation.validator
    , requestValidatorSchema = validation.requestValidatorSchema
    , resultConstructorValidatorSchema = validation.resultConstructorValidatorSchema;

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
    versioned: { type: Boolean, default: false }, // is this versioned?
    associations: { type: ObjectId } // any associations for other modules
});
FeedSchema.index({ owner: 1, updated: -1 });
FeedSchema.index({ teams: 1 });

// add history support for these feeds
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
FeedSchema.methods.CreateFeed = function(user, json, fn) {
    if (!v.validate(json, createFeedSchema).errors.length) {
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
            if (!err || t) fn(true, { "uuid": t.uuid });
            else fn(false, 'Could not save');
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
FeedSchema.methods.AddChild = function(user, json, fn) {
    if (!v.validate(json, addChildSchema).errors.length) {
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
                // we add the mentions in each sub-post to the main post:
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
     "uuid": ""            // uuid of the main post
 }
 Output:
 {
    "uuid": ""              // uuid of this child post
 }
 */
FeedSchema.methods.removeChild = function(uuid, fn) {
    var ctr = 0;
    var done = false;
    this.children.forEach(function(c) {
        if (c.uuid == uuid) {
            done = true;
            fn(null, c.remove(ctr));
        }
        ctr++;
    });

    if (!done) fn('Could not find child', null);
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

var requestRouter = function(req, res, next) {
    if (validate(req.body, requestValidatorSchema))
        switch(req.body.request) {

            case 'newfeed':
                var F = new Feed({});
                F.CreateFeed(req.user, req.body.body, respond);
                break;

            case 'newchildfeed':
                if (req.body.uuid)
                    Feed.findOne({ uuid: req.body.uuid }, function(err, f) {
                        if (!err && f) f.AddChild(req.user, req.body.body, respond);
                        else respond(false, 'Feed not found');
                    });
                break;

            case 'deletefeed':
                if (req.body.uuid)
                    Feed.findOne({ uuid: req.body.uuid }, function(err, f) {
                        if (!err && f) f.Delete(respond);
                        else respond(false, 'Feed not found');
                    });
                break;

            case 'deletechildfeed':
                if (req.body.uuid)
                    Feed.findOne({ uuid: req.body.uuid }, function(err, f) {
                        if (!err && f) f.removeChild(req.body.body, respond);
                        else respond(false, 'Feed not found');
                    });
                break;

            default:
                respond(false, 'Request not found');
        }
    else respond(false, 'Request not found');
};

module.exports = RequestRouter;


