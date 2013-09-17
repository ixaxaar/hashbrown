
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
    sayers:         [ObjectId]
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

//taleSchema.methods.Destroy
//taleSchema.methods.Say
//taleSchema.methods.Unsay
//taleSchema.methods.Cheer
//taleSchema.methods.Uncheer

