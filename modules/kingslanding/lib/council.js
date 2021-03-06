
var scroll = require('./scroll');

var uuid = require('node-uuid');
var _ = require('underscore');

var goose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = goose.ObjectId;

var framework = require('../../../framework')
    , findUser = framework.findUserbyuid;

var councilSchema = new Schema({
    uuid:           { type: String, default: uuid.v4() },
    created:        { type: Date, default: Date.now() },
    updated:        { type: Date, default: Date.now() },
    org:            String,
    summoner:       String,
    summonerName:   String,
    invited:        [String],
    agenda:         [ObjectId],
    discussion:     [ObjectId],
    conclusion:     [ObjectId],
    accepted:       String
});
councilSchema.index({ invited: 1, updated: 1 });


councilSchema.methods.Invite = function(user, invited, fn) {
    var that = this;

    findUser(invited, function(err, invited) {
       if (!err && invited && user.org === that.org && invited.org === that.org) {
           if (_.contains(that.invited, user.uid)) {
               if (!_.contains(that.invited, invited.uid)) {
                   // send the guy a scroll
                   var s = new scroll({});
                   s.Create({
                       org:        that.org,
                       content:    "Invitation to discussion",
                       actor:      user.uid,
                       actorName:  user.profile[0].name || user.uid,
                       receivers:  [invited.uid]
                   }, function(err, sc) {});

                   that.invited.push(invited.uid);
                   that.updated = Date.now();
                   that.save(function(err, sc) { fn && fn(!err, err || that) });
               }
               else fn(false, 'Already invited');
           }
           else fn(false, 'Only invited individuals can invite');
       }
       else fn(false, 'Could not find user');
    });
};

councilSchema.methods.Comment = function(user, comment, fn) {
    var that = this;

    if (_.contains(this.invited, user.uid)) {
        var s = new scroll({});
        s.Create({
            org:        this.org,
            content:    comment,
            actor:      user.uid,
            actorName:  user.profile[0].name || user.uid,
            private:    true
        }, function(err, sc) {});

        that.discussion.push(s);
        this.updated = Date.now();
        this.save(function(err, sc) { fn && fn(!err, err || that) });
    }
    else fn(false, 'Only invited individuals can comment');
};

councilSchema.methods.Uncomment = function(user, uuid, fn) {
    var that = this;

    // only the commenter or the summoner can delete a comment
    this.discussion = _.reject(this.discussion, function(d) {
        if (user.uid === d.actor || user.uid === that.summoner)
            return d.uuid === uuid;
        else return false;
    });
    this.markModified('discussion');
    this.updated = Date.now();
    this.save(function(err, sc) { fn && fn(!err, err || that) });
};

councilSchema.methods.Upvote = function(user, uuid, fn) {
    if (_.contains(this.invited, user.uid)) {
        this.discussion.forEach(function(s) {
            if ((s.uuid === uuid) && !_.contains(s.votes, user.uid)) s.votes.push(user.uid);
        });
        this.updated = Date.now();
        this.save(function(err, sc) { fn && fn(!err, err || sc) });
    }
    else fn(false, 'Only invited individuals can upvote');
};

councilSchema.methods.Downvote = function(user, uuid, fn) {
    if (_.contains(this.invited, user.uid)) {
        this.discussion.forEach(function(s) {
            if (s.uuid === uuid)
                s.votes = _.reject(s.votes, function(v) { return v === user.uid });
        });
        this.updated = Date.now();
        this.save(function(err, sc) { fn && fn(!err, err || sc) });
    }
    else fn(false, 'Only invited individuals can downvote');
};

councilSchema.methods.Destroy = function(user, fn) {
    this.remove(function(err, t) { fn(!err, err || t) });
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

        this.conclusion.push(s);
        this.updated = Date.now();
        this.save(function(err, sc) { fn && fn(!err, err || that) });
    }
    else fn(false, 'Only the summoner can close this');
};

var council = goose.model('council', councilSchema);
council.ensureIndexes();
exports.council = council;

var findCouncil = function(query, fn) {
    council.findOne(query, fn);
};

exports.spawn = spawn = function(user, msg, fn) {
    var c = new council({});
    c.uuid = uuid.v4();
    c.summoner = user.uid;
    c.summonerName = user.profile[0].name || user.uid;
    c.org = user.org;
    c.invited = [user.uid];

    var agenda = new scroll({});
    agenda.Create({
        org:        c.org,
        content:    msg,
        actor:      c.summoner,
        actorName:  c.summonerName,
        private:    true
    }, function(err, ag) {});

    c.agenda.push(agenda);
    c.discussion = [];
    c.conclusion = [];

    // save only if agenda was saved successfully
    c.save(function(err, sc) { fn && fn(!err, err || sc) });
};

exports.invite  = invite = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Invite(user, json.user, fn);
        else fn(false, err || 'Could not find');
    });
};

exports.comment  = comment = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Comment(user, json.comment, fn);
        else fn(false, err || 'Could not find');
    });
};

exports.uncomment  = uncomment = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Uncomment(user, json.commentuuid, fn);
        else fn(false, err || 'Could not find');
    });
};

exports.upvote  = upvote = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Upvote(user, json.commentuuid, fn);
        else fn(false, err || 'Could not find');
    });
};

exports.downvote  = downvote = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Downvote(user, json.commentuuid, fn);
        else fn(false, err || 'Could not find');
    });
};

exports.conclusion  = conclusion = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Conclusion(user, json.conclusion, json.commentuuid, fn);
        else fn(false, err || 'Could not find');
    });
};

exports.destroy  = destroy = function(user, json, fn) {
    findCouncil({ uuid: json.uuid }, function(err, c) {
        if (!err && c) c.Destroy(user, json.conclusion, json.commentuuid, fn);
        else fn(false, err || 'Could not find');
    });
};

