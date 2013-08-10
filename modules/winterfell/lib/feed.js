
// schema library
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
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
    file: String, // uuid of the uploaded file (one feed = one file)
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
    created: { type : Date, default: Date.now() },
    updated: { type : Date, default: Date.now() },
    content: [ContentSchema] // the content object
});
// note: now this, sir, is gonna be costly.. todo: verify index impact on RAM
ChildFeedSchema.index({ owner: 1, updated: -1 });

var ChildFeed = mongoose.model("ChildFeedSchema", ChildFeedSchema);

var TagSchema = new Schema({
    name:   String,
    team: { type: Boolean, default: false }
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
    created: { type : Date, default: Date.now() },
    updated: { type : Date, default: Date.now() },
    content: [ContentSchema], // the content object
    tags: [TagSchema], // tags to group similar feeds
    teams: [],
    acl: [String], // list of people having access to this - those who can comment
    children: [ChildFeedSchema] // stack of child feeds
});
FeedSchema.index({owner: 1, updated: -1});

FeedSchema.methods.CreateFeed = function(user, org, json, fn) {
/**
{
    "content": "",        // markdown
    "file": "",            // filename to be uploaded
    "type": "",           // file mime type http://stackoverflow.com/questions/4581308/jquery-or-javascript-get-mime-type-from-url
    "belongs": [],        // team (optional if private)
    "mentions": [],        // array of team-mates (optional)
    "private": "",        // boolean - private or public post
    "tags": []            // optional - tags for faster searching
}
*/
    this.created = Date.now();
    this.owner = user.uid;
    this.content[0] = new Content({ file: null, type: null, location: null, description: null});
    // for uploaded file
    if (json.file) {
        this.content[0].file = json.file;
        if (json.type) this.content[0].type = json.type;
    }

    if (json.content) this.content[0].description = json.content;
    this.children = [];

    var that = this;

    // if the activity is private
    if (json.private) {
        this.private = true;
        this.teams = null;
    } else  if (json.teams) {
        json.teams.forEach(function(t) {
            team.FindTeam(t, function(err, ft) {
                // push all users in that team to the acl
                if (!err && ft) {
                    that.teams.push(ft.uuid);
                    that.tags.push(ft.uuid); // for faster searching
                }
            })
        });
    }

    // add all the tags
    if (json.tags.length > 0) {
        json.tags.forEach(function(t) {
            that.tags.push(new Tag({ name: t }));
        });
    }

    // add all those who were mentioned to this feed's acl
    json.mentions.forEach(function(m) {
        // make sure this query is covered
        Users.findOne({ uid: m }, { uid: 1 }, function(err, u) {
            if (!err && u) that.acl.push(u);
        });
    });

    // commit to DB
    this.save(function(err, t) {
        console.log(err)
        if (!err || t) fn(null, t);
        else fn('Could not save', null);
    });
};

FeedSchema.methods.Delete = function(fn) {
    this.remove(fn);
};

FeedSchema.methods.AddChild = function(user, json, fn) {
/**
 {
     "uuid": ""            // uuid of the main post
     "content": "",        // markdown
     "file": "",            // filename to be uploaded
     "type": "",           // file mime type http://stackoverflow.com/questions/4581308/jquery-or-javascript-get-mime-type-from-url
     "mentions": [],        // array of mentions (optional)
     "teams": []            // feeds are always dsiplayed as per teams,
                            // so frontend has this info, leads to faster searching on the backend
 }
 */

    var c = new ChildFeed({});
    c.owner = user.uid;
    c.created = Date.now();

    c.content[0] = new Content({ file: null, type: null, location: null, description: null});
    if (json.content) c.content[0].description = json.content;
    if (json.file) {
        c.content[0].file = json.file;
        if (json.type) c.content[0].type = json.type;
    }

    // add all those who are mentioned to this post's acl
    var that = this;
    if (json.mentions) json.mentions.forEach(function(m) {
        // make sure this query is covered
        Users.findOne({ uid: m }, { uid: 1 }, function(err, u) {
            if (!err && u) that.acl.push(u);
        });
    });

    this.children.push(c);
    this.modified = Date.now();
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

var RequestRouter = function(req, res, next) {
    if (req.body)
    switch(req.body.request) {
        case 'newfeed':
            var F = new Feed({});
            F.CreateFeed(req.user, req.user, req.body.body, function(err, f) {
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
