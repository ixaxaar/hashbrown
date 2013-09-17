
var scroll = require('./scroll');

var uuid = require('node-uuid');

var goose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = goose.ObjectId;


var councilSchema = new Schema({
    uuid:           { type: String, default: uuid.v4() },
    created:        { type: Date, default: Date.now() },
    updated:        { type: Date, default: Date.now() },
    summoner:       String,
    summonerName:   String,
    org:            String,
    invited:        [String],
    agenda:         ObjectId,
    discussion:     [ObjectId],
    conclusion:     ObjectId
});
councilSchema.index({ summoner: 1, updated: 1 });


var council = function(user, msg, fn) {
    var c = new councilSchema({});
    c.uuid = uuid.v4();
    c.summoner = user.uid;
    c.summonerName = user.profile[0].name;
    c.org = user.org;
    c.invited = [];

    var agenda = new scroll({});
    agenda.Create({
        org:        c.org,
        content:    msg,
        actor:      c.summoner,
        actorName:  c.summonerName,
        private:    true
    }, function(err, ag) { if (!err) c.agenda = ag; });

    c.discussion = [];
    if (c.agenda) c.save(function(err, sc) { fn && fn(!err, err || sc) });
    else fn && fn('Could not create agenda');
};


councilSchema.methods.Invite = function(user, fn) {
    var that = this;
    if (user.org === this.org) this.invited.push(user);

    // send the guy a scroll
    var s = new scroll({});
    s.Create({
        org:        this.org,
        content:    "Invitation to discussion",
        actor:      this.summoner,
        actorName:  this.summonerName,
        receivers:  user.uid
    }, function(err, sc) {
        if (!err)  that.save(function(err, sc) { fn && fn(!err, err || sc) });
        else fn && fn('Could not create invititation');
    });
};

councilSchema.methods.Comment = function(user, comment, fn) {
    var that = this;

    var s = new scroll({});
    s.Create({
        org:        this.org,
        content:    msg,
        actor:      this.summoner,
        actorName:  this.summonerName,
        private:    true
    }, function(err, sc) {
        if (!err) {
            that.discussion.push(sc);
        }
    });

    this.save(function(err, sc) { fn && fn(!err, err || sc) });
};

councilSchema.methods.upvote = function(user, fn) {
    //
};

councilSchema.methods.Conclusion = function() {
    //
};

