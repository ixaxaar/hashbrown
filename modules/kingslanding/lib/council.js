
var scroll = require('./scroll');

var council = function(user, msg) {
    this.summoner = user.uid;
    this.summonerName = user.profile[0].name;
    this.org = user.org;
    this.invited = [];

    this.agenda = new scroll({});
    this.agenda.Create({
        org:        this.org,
        content:    msg,
        actor:      this.summoner,
        actorName:  this.summonerName,
        private:    true
    });

    this.discussion = [];
};

council.prototype.invite = function(user) {
    if (user.org === this.org) this.invited.push(user);

    // send the guy a scroll
    var s = new scroll({});
    s.Create({
        org:        this.org,
        content:    "Invitation to discussion",
        actor:      this.summoner,
        actorName:  this.summonerName,
        receivers:  user.uid
    });
};

council.prototype.comment = function(user, comment) {
    var s = new scroll({});
    s.Create({
        org:        this.org,
        content:    msg,
        actor:      this.summoner,
        actorName:  this.summonerName,
        private:    true
    });
    this.discussion.push()
};

council.prototype.conclusion = function() {
    //
};

// todo: votes on posts
