
var scroll = require('./scroll');

var uuid = require('node-uuid');

var goose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = goose.ObjectId;


var taleSchema = new Schema({
    uuid:           { type: String, default: uuid.v4() },
    created:        { type: Date, default: Date.now() },
    updated:        { type: Date, default: Date.now() },
    org:            String,
    teller:         String,
    tellerName:     String,
    tale:           ObjectId,
    says:           [ObjectId]
});
taleSchema.index({ teller: 1, updated: 1 });

// todo: secret tale

taleSchema.methods.Create = function(user, tale, fn) {
    var that = this;

    this.uuid = uuid.v4();
    this.org = user.org;
    this.teller = user.uid;
    this.tellerName = user.profile[0].name || user.uid;

    var s = new scroll({});
    s.Create({
        org:        this.org,
        content:    tale,
        actor:      this.summoner,
        actorName:  this.summonerName,
        teams:      user.teams
    }, function(err, sc) {});

    this.tale = s;
    this.save(function(err, t) { fn(!err, err || that) });

};

taleSchema.methods.Destroy = function(user, fn) {
    this.remove(function(err, t) { fn(!err, err || that) });
};

taleSchema.methods.Say = function(user, saying, fn) {
    var s = new scroll({});
    s.Create({
        org:        this.org,
        content:    saying,
        actor:      user.uid,
        actorName:  user.profile[0].name || user.uid
    }, function(err, sc) {});

    this.says.push(s);
    this.save(function(err, t) { fn(!err, err || that) });
};

taleSchema.methods.Unsay = function(user, uuid, fn) {
    var that = this;

    // only the commenter or the summoner can delete a comment
    this.says = _.reject(this.says, function(d) {
        if (user.uid === d.actor || user.uid === that.teller)
            return d.uuid === uuid;
        else return false;
    });
    this.markModified('says');
    this.save(function(err, sc) { fn && fn(!err, err || that) });
};

taleSchema.methods.Cheer = function(user, uuid, fn) {
    this.says.forEach(function(s) {
        if (s.uuid === uuid) s.votes++;
    });
    this.save(function(err, sc) { fn && fn(!err, err || that) });
};

taleSchema.methods.Uncheer = function(user, uuid, fn) {
    this.says.forEach(function(s) {
        if (s.uuid === uuid) s.votes--;
    });
    this.save(function(err, sc) { fn && fn(!err, err || that) });
};

var tale = goose.model('tale', taleSchema);

var findTale = function(request, fn) {
    tale.findOne(request, fn);
};

exports.spawn = spawn = function(user, json, fn) {
    findTale({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Create(user, json.tale, fn);
        else fn(false, err);
    });
};

exports.destroy = destroy = function(user, json, fn) {
    findTale({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Destroy(user, fn);
        else fn(false, err);
    });
};

exports.say = say = function(user, json, fn) {
    findTale({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Say(user, json.saying, fn);
        else fn(false, err);
    });
};

exports.unsay = unsay = function(user, json, fn) {
    findTale({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Unsay(user, json.sayinguuid, fn);
        else fn(false, err);
    });
};

exports.cheer = cheer = function(user, json, fn) {
    findTale({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Cheer(user, json.tale, fn);
        else fn(false, err);
    });
};

exports.uncheer = uncheer = function(user, json, fn) {
    findTale({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Uncheer(user, json.tale, fn);
        else fn(false, err);
    });
};

