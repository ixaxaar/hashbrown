
var scroll = require('./scroll');

var uuid = require('node-uuid');

var goose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = goose.ObjectId;


var councilSchema = new Schema({
    uuid:           { type: String, default: uuid.v4() },
    created:        { type: Date, default: Date.now() },
    updated:        { type: Date, default: Date.now() },
    org:            String,
    summoner:       String,
    summonerName:   String,
    invited:        [String],
    agenda:         ObjectId,
    discussion:     [ObjectId],
    conclusion:     ObjectId,
    accepted:       String
});
councilSchema.index({ summoner: 1, updated: 1 });


councilSchema.methods.Invite = function(user, fn) {
    var that = this;

    if (user.org === this.org) {
        // send the guy a scroll
        var s = new scroll({});
        s.Create({
            org:        this.org,
            content:    "Invitation to discussion",
            actor:      this.summoner,
            actorName:  this.summonerName,
            receivers:  user.uid
        }, function(err, sc) {});

        this.invited.push(user.uid);
        that.save(function(err, sc) { fn && fn(!err, err || that) });
    }
    else fn(false, 'User not found');
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
    }, function(err, sc) {});

    that.discussion.push(s);
    this.save(function(err, sc) { fn && fn(!err, err || that) });
};

councilSchema.methods.Upvote = function(user, uuid, fn) {
    var that = this;

    var s = _.find(this.discussion, function(scr) { return scr.uuid === uuid });
    s.votes++;
    // reply asap
    fn && fn(true, that);

    // now we do the dirty work
    scroll.findOne({ uuid: uuid }, function(err, s) {
        if (!err && s) {
            s.votes++;
            s.save(function(err) {});
        }
    });
};

councilSchema.methods.Downvote = function(user, uuid, fn) {
    var that = this;

    var s = _.find(this.discussion, function(scr) { return scr.uuid === uuid });
    s.votes++;
    // reply asap
    fn && fn(true, that);

    // now we do the dirty work
    scroll.findOne({ uuid: uuid }, function(err, s) {
        if (!err && s) {
            s.votes++;
            s.save(function(err) {});
        }
    });
};

councilSchema.methods.Conclusion = function(user, comment, uuid, fn) {
    var that = this;

    if(user.uid === this.summoner) {
        // the accepted point, can be none
        this.accepted = _.find(this.discussion,
            function(scr) { return scr.uuid === uuid }) || {};
        this.accepted = this.accepted.uuid;

        // the conclusion
        var s = new scroll({});
        s.Create({
            org:        this.org,
            content:    comment,
            private:    true
        }, function(err, sc) {});

        this.accepted = s;
        this.save(function(err, sc) { fn && fn(!err, err || that) });
    }
    else fn(false, 'Only the summoner can close this');
};

var council = goose.model('council', councilSchema);
council.ensureIndexes();

var Council = function(user, msg, fn) {
    var c = new council({});
    c.uuid = uuid.v4();
    c.summoner = user.uid;
    c.summonerName = user.profile[0].name || user.uid;
    c.org = user.org;
    c.invited = [];

    var agenda = new scroll({});
    agenda.Create({
        org:        c.org,
        content:    msg,
        actor:      c.summoner,
        actorName:  c.summonerName,
        private:    true
    }, function(err, ag) {});

    c.agenda = agenda;
    c.discussion = [];
    c.conclusion = null;

    // save only if agenda was saved successfully
    if (c.agenda) c.save(function(err, sc) { fn && fn(!err, err || sc) });
    else fn && fn('Could not create agenda');
};

module.exports = exports = Council;
